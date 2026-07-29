---
title: Renomeador de Recibo de Pagamento
emoji: 📄
colorFrom: indigo
colorTo: purple
sdk: gradio
app_file: app.py
pinned: false
---

# Renomeador de Recibo de Pagamento - Versão Gradio

Este projeto é uma ferramenta de processamento em lote para documentos PDF, focada na extração de dados via OCR (Optical Character Recognition) e renomeação automatizada.

Esta versão (branch `feat/migracao-huggingface`) foi reescrita e adaptada para rodar **nativamente no Hugging Face Spaces usando Gradio**. Essa mudança removeu a dependência de containers Docker (Next.js/Node), garantindo que a aplicação possa ser hospedada no plano "Free CPU" sem necessidade de cadastrar um cartão de crédito.

## 🚀 Live Demo

A aplicação está hospedada e pode ser acessada publicamente em:
**[Hugging Face Spaces - Renomeador de Recibo de Pagamento](https://huggingface.co/spaces/luisitcho/projeto-python-renomeador-pdf)**

> **Nota**: Por ser uma hospedagem gratuita, a aplicação pode entrar em modo de suspensão após 48h de inatividade. Caso encontre a aplicação "dormindo", basta aguardar alguns minutos para que ela seja reiniciada.

## Como Funciona o Fluxo

1. O usuário realiza o upload de um arquivo ZIP contendo os PDFs (Recibos originais).
2. O usuário preenche um "Prefixo" (Ex: `17`).
3. O servidor em Python (`app.py`) recebe e descompacta os arquivos.
4. Para cada PDF, as páginas são convertidas em imagens (via Poppler) e o texto bruto é extraído (via Tesseract OCR).
5. O sistema aplica regras complexas (Expressões Regulares) para identificar campos-chave: RPA, Nome, Valor e CPF.
6. O arquivo recebe um novo nome seguindo o rigoroso padrão:
   `{Prefixo}_RPA {RPA}_DIARISTA {Nome}_{Valor}_{CPF}.pdf`
7. A aplicação reempacota os PDFs finalizados e retorna um novo arquivo ZIP para download.

## Estrutura do Projeto

```text
.
├── app.py                    # Interface Gráfica (Gradio) e Lógica OCR
├── packages.txt              # Dependências do Sistema Linux (Tesseract, Poppler)
├── requirements.txt          # Bibliotecas Python (gradio, pytesseract, pdf2image)
└── README.md                 # Documentação técnica
```

## Motor de Extração (OCR)

A escolha do ecossistema Python nativo se deve à maturidade das suas bibliotecas de visão computacional:

- **pdf2image**: Utiliza o utilitário `poppler-utils` para renderizar páginas do PDF em buffers de imagem.
- **pytesseract**: Wrapper para o **Tesseract OCR**, que foi devidamente configurado com pacotes de idioma Português (`tesseract-ocr-por`) para ler cedilhas e acentos corretamente.
- **Expressões Regulares (`re`)**: As rotinas de busca foram aprimoradas para lidar com sujeira e ruídos gerados por escaneamentos em baixa qualidade.

## Como Executar Localmente

Caso precise testar ou alterar o código no seu próprio computador:

1. Certifique-se de que o seu SO possui os binários instalados:
   * **Debian/Ubuntu:** `sudo apt install tesseract-ocr tesseract-ocr-por poppler-utils`
   * **Mac (Homebrew):** `brew install tesseract tesseract-lang poppler`
2. Instale as bibliotecas Python:
   ```bash
   pip install -r requirements.txt
   ```
3. Inicie o servidor local:
   ```bash
   python app.py
   ```
4. O terminal exibirá um endereço local (normalmente `http://127.0.0.1:7860`). Acesse pelo navegador para ver a interface funcionando!
