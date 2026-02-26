# Dockerfile para Next.js + Python OCR (Hugging Face Compatible)
FROM nikolaik/python-nodejs:python3.12-nodejs22

# Instala dependências de sistema como root
USER root
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-por \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Configura o diretório de trabalho
WORKDIR /app

# Em vez de criar um novo usuário (que pode dar conflito no UID 1000), 
# vamos garantir que o diretório pertença ao UID 1000 (padrão do Hugging Face)
RUN chown -R 1000:1000 /app

# Switch para o UID 1000 (usuário não-root padrão da imagem e do HF)
USER 1000

# Instala dependências do Node
COPY --chown=1000:1000 package*.json ./
RUN npm install

# Copia script Python e requisitos
COPY --chown=1000:1000 requirements.txt* ./
RUN pip install --no-cache-dir pytesseract pdf2image pillow

# Copia o resto do código
COPY --chown=1000:1000 . .

# Build do Next.js
ENV NODE_ENV=production
RUN npm run build

ENV PORT=7860
EXPOSE 7860
CMD ["npm", "start"]
