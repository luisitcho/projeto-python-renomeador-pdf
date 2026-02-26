import sys
import os
import pytesseract
from pdf2image import convert_from_path
import json

def process_pdf(pdf_path):
    try:
        # Check if file exists
        if not os.path.exists(pdf_path):
            print(f"Error: File {pdf_path} not found", file=sys.stderr)
            sys.exit(1)

        # Convert PDF pages to images
        # Requires poppler-utils installed on the system
        images = convert_from_path(pdf_path)
        
        full_text = ""
        for i, image in enumerate(images):
            # Perform OCR on each page
            text = pytesseract.image_to_string(image, lang='por')
            full_text += text + "\n"
            
        # Return the extracted text
        print(full_text.strip())
        
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python process_pdf.py <pdf_path>", file=sys.stderr)
        sys.exit(1)
        
    process_pdf(sys.argv[1])
