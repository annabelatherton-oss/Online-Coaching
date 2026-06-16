"""
Convert each page of a recipe PDF into a named image file.
Reads the recipe title from each page and uses it as the filename.

Usage: python3 convert-pdf.py /path/to/recipe-book.pdf
Output: creates a folder called recipe-photos/ next to the PDF
"""

import sys
import os
import re

try:
    import fitz  # PyMuPDF
except ImportError:
    print("Installing PyMuPDF...")
    os.system("pip3 install pymupdf -q")
    import fitz

def get_title_from_page(page):
    """Extract the recipe title — the largest or first bold/heading text on the page."""
    blocks = page.get_text("dict")["blocks"]

    best_text = None
    best_size = 0

    for block in blocks:
        if block.get("type") != 0:  # text blocks only
            continue
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                text = span.get("text", "").strip()
                size = span.get("size", 0)
                # Skip very short text, page numbers, or purely numeric text
                if len(text) < 3 or text.isdigit():
                    continue
                # Pick the largest font size text (likely the title)
                if size > best_size:
                    best_size = size
                    best_text = text

    return best_text

def clean_filename(title):
    """Make the title safe to use as a filename."""
    cleaned = re.sub(r'[<>:"/\\|?*]', '', title)
    cleaned = cleaned.strip().strip('.')
    return cleaned[:80]  # max 80 chars

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 convert-pdf.py /path/to/recipe-book.pdf")
        sys.exit(1)

    pdf_path = sys.argv[1]
    if not os.path.exists(pdf_path):
        print(f"File not found: {pdf_path}")
        sys.exit(1)

    # Output folder next to the PDF
    pdf_dir = os.path.dirname(os.path.abspath(pdf_path))
    out_dir = os.path.join(pdf_dir, "recipe-photos")
    os.makedirs(out_dir, exist_ok=True)

    doc = fitz.open(pdf_path)
    print(f"Found {len(doc)} pages in PDF")
    print(f"Saving images to: {out_dir}\n")

    used_names = {}

    for i, page in enumerate(doc):
        title = get_title_from_page(page)

        if not title:
            title = f"Recipe {i + 1}"

        filename = clean_filename(title)

        # Handle duplicate names
        if filename.lower() in used_names:
            used_names[filename.lower()] += 1
            filename = f"{filename} {used_names[filename.lower()]}"
        else:
            used_names[filename.lower()] = 1

        # Render page as image (2x resolution for quality)
        mat = fitz.Matrix(2, 2)
        pix = page.get_pixmap(matrix=mat)
        out_path = os.path.join(out_dir, f"{filename}.jpg")
        pix.save(out_path)

        print(f"  Page {i + 1}: {filename}.jpg")

    doc.close()
    print(f"\nDone! {len(doc)} images saved to recipe-photos/")
    print(f"\nNext step — run the upload script:")
    print(f'  node upload-photos.mjs "{out_dir}"')

if __name__ == "__main__":
    main()
