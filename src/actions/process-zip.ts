'use server';

import JSZip from 'jszip';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface ProcessResult {
    success: boolean;
    data?: string;
    files: {
        oldName: string;
        newName: string;
        status: 'success' | 'error';
        rawText?: string;
        details?: {
            rpa: string;
            name: string;
            value: string;
            cpf: string;
        };
    }[];
    error?: string;
}

export async function processZipAction(formData: FormData): Promise<ProcessResult> {
    const file = formData.get('file') as File;
    if (!file) return { success: false, error: 'Arquivo não enviado.', files: [] };

    const namePrefix = formData.get('pattern') as string || '';

    // Pasta temporária para processar os PDFs
    const tempDir = path.join(process.cwd(), 'temp_pdf_proc');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    try {
        const arrayBuffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);
        const newZip = new JSZip();
        const results: ProcessResult['files'] = [];
        const filenames = Object.keys(zip.files).filter(n => n.toLowerCase().endsWith('.pdf'));

        // Detecta o Python: usa o venv se existir localmente, senão usa o python3 global (para o Docker)
        let pythonPath = 'python3';
        const venvPath = path.join(process.cwd(), '.venv', 'bin', 'python3');
        if (fs.existsSync(venvPath)) {
            pythonPath = `"${venvPath}"`;
        }

        for (const fileName of filenames) {
            console.log(`\n🔎 [${fileName}] Motor Python (OCR) em ação...`);
            try {
                const pdfBuffer = await zip.files[fileName].async('nodebuffer');
                // Sanitizar nome do arquivo temporário
                const safeName = fileName.replace(/[^\w.-]/g, '_');
                const tempFilePath = path.join(tempDir, safeName);
                fs.writeFileSync(tempFilePath, pdfBuffer);

                let text = "";
                try {
                    // Executa o script Python
                    // Nota: O sistema precisa de tesseract-ocr e poppler-utils instalados
                    text = execSync(`${pythonPath} process_pdf.py "${tempFilePath}"`, {
                        encoding: 'utf8',
                        timeout: 60000 // 60 segundos por arquivo (OCR pode ser lento)
                    });
                } catch (e: any) {
                    console.error(`[Erro Python OCR] No arquivo ${fileName}:`, e.stderr || e.message);
                }

                const cleanText = text.replace(/\s+/g, ' ');

                // --- LÓGICA DE EXTRAÇÃO ---
                const rpaMatch = cleanText.match(/RPA\s*[:.-]?\s*(\d{4,6})/i) || cleanText.match(/(\d{4,6})\s*2[0-9]{3}/);
                const valueMatch = cleanText.match(/(?:Total|Liquido|Líquido|Recebi|Recebido|Pago|Valor)\s*(?:[a-zÀ-ú\s]{0,20})?\s*[:.-]?\s*R?\$\s*([\d.,]{4,15})/i) || cleanText.match(/R\$\s*([\d.,]{4,15})/i);

                let name = 'NOME-NAO-ENCONTRADO';
                const nameLabel = cleanText.match(/(?:Nome|Diarista|Beneficiário|Prestador|Diarista:)\s*[:.-]?\s*([A-ZÀ-Ú\s]{5,70})/i);

                if (nameLabel) {
                    name = nameLabel[1].trim();
                } else {
                    const words = cleanText.match(/[A-ZÀ-Ú]{3,}(?:\s[A-ZÀ-Ú]{3,}){1,5}/g);
                    if (words) {
                        // Filtra palavras comuns que não são nomes
                        const filtered = words.filter(w => !/RPA|CPF|RECIBO|VALOR|DATA|NASCIMENTO/i.test(w));
                        name = filtered.reduce((a, b) => a.length > b.length ? a : b, '') || name;
                    }
                }

                const rpa = rpaMatch ? rpaMatch[1].trim() : '####';
                const valueRaw = valueMatch ? valueMatch[1].trim() : '0,00';

                // CPF: Busca mais agressiva para capturar variações de espaços e pontuação
                const cpfLabelMatch = cleanText.match(/(?:CPF|N[o°] do CPF)\s*(?:n[o°]|n|:)?\s*([\d.\-\s]{11,18})/i);
                const cpfRawMatch = cleanText.match(/\d{3}[\s.]\d{3}[\s.]\d{3}[-\s.]\d{1,2}/) || cleanText.match(/\d{11}/);

                let cpfRaw = (cpfLabelMatch ? cpfLabelMatch[1] : (cpfRawMatch ? cpfRawMatch[0] : '00000000000')).replace(/\D/g, '');
                if (cpfRaw.length > 11) cpfRaw = cpfRaw.substring(0, 11);

                if (name !== 'NOME-NAO-ENCONTRADO') {
                    name = name.split(/(?:CPF|RPA|DATA|VALOR|CONTA|ENDERE|NASC|SITU|EMIT|PAGO|DOCUM|RECIBO)/i)[0].trim().substring(0, 45).replace(/\d+/g, '').trim();
                }

                const status = (rpa !== '####' && name !== 'NOME-NAO-ENCONTRADO' && name.length > 5) ? 'success' : 'error';

                // Formato Exato: {prefix}_RPA {rpa}_DIARISTA {name}_{value}_{cpf}
                // Permitindo pontos e vírgulas no nome do arquivo para o valor
                const prefixPart = namePrefix.trim() ? `${namePrefix.trim()}_` : '00_'; // '00' como fallback se vazio
                const baseName = `${prefixPart}RPA ${rpa}_DIARISTA ${name}_${valueRaw}_${cpfRaw}`.replace(/[^\w\s.,-]/g, '');

                let finalName = baseName;
                let count = 1;
                while (newZip.file(`${finalName}.pdf`)) {
                    finalName = `${baseName}_${count++}`;
                }

                results.push({
                    oldName: fileName,
                    newName: finalName,
                    status,
                    rawText: text,
                    details: { rpa, name, value: valueRaw, cpf: cpfRaw }
                });
                newZip.file(`${finalName}.pdf`, pdfBuffer);

                // Limpa o arquivo temporário
                if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
                console.log(`[${fileName}] Finalizado com Python: ${status.toUpperCase()}`);

            } catch (err) {
                console.error(`Erro fatal no arquivo ${fileName}:`, err);
                results.push({ oldName: fileName, newName: fileName + " (Erro)", status: 'error' });
            }
        }

        const zipData = await newZip.generateAsync({ type: 'base64' });
        return { success: true, data: zipData, files: results };

    } catch (err: any) {
        console.error("Erro Geral no Processamento:", err);
        return { success: false, error: `Erro no servidor: ${err?.message || 'Falha crítica no processamento (possível timeout ou limite de memória).'}.`, files: [] };
    } finally {
        // Tenta limpar a pasta temp
        try {
            if (fs.existsSync(tempDir)) {
                const files = fs.readdirSync(tempDir);
                for (const file of files) {
                    fs.unlinkSync(path.join(tempDir, file));
                }
                fs.rmdirSync(tempDir);
            }
        } catch (e) { }
    }
}