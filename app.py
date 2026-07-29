import os
import re
import sys
import zipfile
import tempfile
import gradio as gr
import pytesseract
from pdf2image import convert_from_path
import shutil
import spaces

@spaces.GPU
def dummy_gpu():
    pass


def process_single_pdf(pdf_path):
    images = convert_from_path(pdf_path)
    full_text = ""
    for image in images:
        text = pytesseract.image_to_string(image, lang='por')
        full_text += text + "\n"
    return full_text

def extract_info_and_rename(text, name_prefix):
    clean_text = re.sub(r'\s+', ' ', text)
    
    rpa_match = re.search(r'RPA\s*[:.-]?\s*(\d{4,6})', clean_text, re.IGNORECASE) or re.search(r'(\d{4,6})\s*2[0-9]{3}', clean_text)
    value_match = re.search(r'(?:Total|Liquido|Líquido|Recebi|Recebido|Pago|Valor)\s*(?:[a-zÀ-ú\s]{0,20})?\s*[:.-]?\s*R?\$\s*([\d.,]{4,15})', clean_text, re.IGNORECASE) or re.search(r'R\$\s*([\d.,]{4,15})', clean_text, re.IGNORECASE)
    
    name = 'NOME-NAO-ENCONTRADO'
    name_label = re.search(r'(?:Nome|Diarista|Beneficiário|Prestador|Diarista:)\s*[:.-]?\s*([A-ZÀ-Ú\s]{5,70})', clean_text, re.IGNORECASE)
    
    if name_label:
        name = name_label.group(1).strip()
    else:
        words = re.findall(r'[A-ZÀ-Ú]{3,}(?:\s[A-ZÀ-Ú]{3,}){1,5}', clean_text)
        if words:
            filtered = [w for w in words if not re.search(r'RPA|CPF|RECIBO|VALOR|DATA|NASCIMENTO', w, re.IGNORECASE)]
            if filtered:
                name = max(filtered, key=len)
                
    rpa = rpa_match.group(1).strip() if rpa_match else '####'
    value_raw = value_match.group(1).strip() if value_match else '0,00'
    
    cpf_label_match = re.search(r'(?:CPF|N[o°] do CPF)\s*(?:n[o°]|n|:)?\s*([\d.\-\s]{11,18})', clean_text, re.IGNORECASE)
    cpf_raw_match = re.search(r'\d{3}[\s.]\d{3}[\s.]\d{3}[-\s.]\d{1,2}', clean_text) or re.search(r'\d{11}', clean_text)
    
    cpf_raw = cpf_label_match.group(1) if cpf_label_match else (cpf_raw_match.group(0) if cpf_raw_match else '00000000000')
    cpf_raw = re.sub(r'\D', '', cpf_raw)
    if len(cpf_raw) > 11:
        cpf_raw = cpf_raw[:11]
        
    if name != 'NOME-NAO-ENCONTRADO':
        name = re.split(r'(?:CPF|RPA|DATA|VALOR|CONTA|ENDERE|NASC|SITU|EMIT|PAGO|DOCUM|RECIBO)', name, flags=re.IGNORECASE)[0].strip()[:45]
        name = re.sub(r'\d+', '', name).strip()
        
    prefix_part = f"{name_prefix.strip()}_" if name_prefix and name_prefix.strip() else "00_"
    base_name = f"{prefix_part}RPA {rpa}_DIARISTA {name}_{value_raw}_{cpf_raw}"
    base_name = re.sub(r'[^\w\s.,-]', '', base_name)
    
    return base_name, text

def process_zip(zip_file, pattern):
    if zip_file is None:
        return None, "Por favor, envie um arquivo ZIP."
        
    temp_dir = tempfile.mkdtemp()
    out_dir = tempfile.mkdtemp()
    
    try:
        with zipfile.ZipFile(zip_file.name, 'r') as zip_ref:
            zip_ref.extractall(temp_dir)
            
        pdf_files = [f for f in os.listdir(temp_dir) if f.lower().endswith('.pdf')]
        
        if not pdf_files:
            return None, "Nenhum PDF encontrado no arquivo ZIP."
            
        results_log = []
        out_zip_path = os.path.join(out_dir, "pdfs_renomeados.zip")
        
        used_names = []
        with zipfile.ZipFile(out_zip_path, 'w') as out_zip:
            for pdf_file in pdf_files:
                pdf_path = os.path.join(temp_dir, pdf_file)
                try:
                    text = process_single_pdf(pdf_path)
                    new_base_name, _ = extract_info_and_rename(text, pattern)
                    
                    final_name = new_base_name
                    count = 1
                    while f"{final_name}.pdf" in used_names:
                        final_name = f"{new_base_name}_{count}"
                        count += 1
                        
                    out_zip.write(pdf_path, f"{final_name}.pdf")
                    used_names.append(f"{final_name}.pdf")
                    results_log.append(f"✅ {pdf_file} -> {final_name}.pdf")
                except Exception as e:
                    results_log.append(f"❌ {pdf_file} -> Erro: {str(e)}")
                    
        return out_zip_path, "\n".join(results_log)
        
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

css = """
footer {display: none !important;}
"""

with gr.Blocks(title="Renomeador de PDF", css=css) as demo:
    gr.Markdown("# 📄 Renomeador de Recibo de Pagamento")
    gr.Markdown("Envie um arquivo `.zip` contendo recibos em PDF. O sistema usará IA (OCR) para extrair os dados e renomear os arquivos no padrão `{Prefixo}_RPA {RPA}_DIARISTA {Nome}_{Valor}_{CPF}.pdf`.")
    
    with gr.Row():
        with gr.Column():
            prefix_input = gr.Textbox(label="Número Prefixo", placeholder="Ex: 17")
            zip_input = gr.File(label="Arquivo ZIP com PDFs", file_types=[".zip"])
            process_btn = gr.Button("Processar Documentos", variant="primary")
            
        with gr.Column():
            output_file = gr.File(label="ZIP Renomeado para Download")
            output_log = gr.Textbox(label="Resultados", lines=10)
            
    process_btn.click(
        fn=process_zip,
        inputs=[zip_input, prefix_input],
        outputs=[output_file, output_log]
    )

if __name__ == "__main__":
    demo.launch()
