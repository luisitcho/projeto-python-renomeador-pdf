# Dockerfile para Next.js + Python OCR (Hugging Face Compatible)
FROM nikolaik/python-nodejs:python3.12-nodejs22

# Instala dependências de sistema como root
USER root
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-por \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Cria usuário 1000 conforme padrão do Hugging Face
RUN useradd -m -u 1000 user
WORKDIR /app
RUN chown user:user /app

# Switch para o usuário não-root
USER user
ENV PATH="/home/user/.local/bin:$PATH"

# Instala dependências do Node
COPY --chown=user package*.json ./
RUN npm install

# Copia script Python e requisitos
COPY --chown=user requirements.txt* ./
RUN pip install --no-cache-dir pytesseract pdf2image pillow

# Copia o resto do código
COPY --chown=user . .

# Build do Next.js
ENV NODE_ENV=production
RUN npm run build

ENV PORT=7860
EXPOSE 7860
CMD ["npm", "start"]
