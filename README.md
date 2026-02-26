---
title: PDF Renamer Elite
emoji: 📄
colorFrom: indigo
colorTo: purple
sdk: docker
pinned: false
---

# PDF Renamer Elite - Documentação Técnica

Este projeto é uma ferramenta de processamento em lote para documentos PDF, focada na extração de dados via OCR (Optical Character Recognition) e renomeação automatizada. A solução utiliza uma arquitetura híbrida entre Node.js (Next.js) e Python para garantir performance e precisão na leitura de documentos escaneados.

## 🚀 Live Demo

A aplicação está hospedada e pode ser acessada publicamente em:
**[Hugging Face Spaces - PDF Renamer Elite](https://huggingface.co/spaces/luisitcho/projeto-python-renomeador-pdf)**

> **Nota**: Por ser uma hospedagem gratuita, a aplicação pode entrar em modo de suspensão após 48h de inatividade. Caso encontre a aplicação "dormindo", basta aguardar alguns minutos para que o container seja reiniciado.

## Arquitetura do Sistema

A aplicação é containerizada via Docker para assegurar a disponibilidade das dependências de sistema necessárias para o processamento de imagem e OCR.

### Fluxo de Processamento
1. O usuário realiza o upload de um arquivo ZIP contendo os PDFs.
2. O Server Action (`processZipAction`) descompacta os arquivos em um diretório temporário.
3. Para cada PDF, um subprocesso Python é instanciado para executar o script de OCR.
4. O script Python converte as páginas do PDF em imagens (via Poppler) e extrai o texto (via Tesseract).
5. O Node.js recebe o texto extraído, aplica padrões de Regex para identificar campos-chave (RPA, Nome, Valor, CPF) e gera o novo nome do arquivo.
6. Um novo arquivo ZIP é gerado e retornado ao usuário.

## Estrutura de Diretórios

```text
.
├── src/
│   ├── actions/
│   │   └── process-zip.ts    # Orquestração do processamento e lógica de extração (Regex)
│   ├── app/
│   │   ├── page.tsx          # Interface do usuário (Frontend Next.js)
│   │   └── globals.css       # Definições de estilo e tokens de design
├── process_pdf.py            # Motor de OCR em Python (Tesseract + pdf2image)
├── Dockerfile                # Configuração do ambiente (Node + Python + Tesseract + Poppler)
├── requirements.txt          # Dependências Python (pytesseract, pdf2image, pillow)
├── package.json              # Dependências Node.js e scripts de automação
└── README.md                 # Documentação do projeto
```

## Motor de OCR (Python)

A escolha do Python para o núcleo de extração deve-se à maturidade das bibliotecas de processamento de imagem. O script `process_pdf.py` utiliza:

- **pdf2image**: Utiliza o utilitário `pdftoppm` (parte do Poppler) para renderizar páginas de PDF em objetos de imagem bufferizados.
- **pytesseract**: Wrapper para o motor **Tesseract OCR**. Está configurado com suporte ao idioma português (`por`) para garantir a captura correta de caracteres especiais (acentuação e cedilha).
- **Pillow (PIL)**: Manipulação intermediária de imagens para otimização de leitura.

## Requisitos de Sistema (Via Docker)

O ambiente de execução deve conter as seguintes ferramentas instaladas (configuradas automaticamente no Dockerfile):
- `tesseract-ocr`: Motor principal de OCR.
- `tesseract-ocr-por`: Treinamento de linguagem para Português.
- `poppler-utils`: Necessário para a conversão de PDF para Imagem.

## Scripts Disponíveis

### Execução em Desenvolvimento (Docker)
Para rodar a aplicação com todas as dependências isoladas:
```bash
npm run docker:dev
```
Este comando executa o build da imagem e inicia o container mapeando a porta 3000.

### Limpeza de Ambiente
Caso ocorram conflitos de porta ou containers órfãos:
```bash
docker stop $(docker ps -q)
```

## Lógica de Extração de Dados
A extração é baseada em expressões regulares (Regex) aplicadas sobre o texto bruto retornado pelo OCR. O sistema prioriza a identificação de etiquetas comuns como "RPA", "CPF nº", "Valor R$" e busca nomes de beneficiários baseando-se em padrões de caixa alta e posicionamento no documento.
