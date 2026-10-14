import re
import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, hex_color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def add_inline_formatted_text(p, text):
    """
    Parses **bold**, *italic*, and `code` inline tokens.
    """
    # Regex token matching: (`code`|**bold**|*italic*|regular text)
    pattern = r'(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))'
    tokens = re.split(pattern, text)
    
    for token in tokens:
        if not token:
            continue
        if token.startswith('`') and token.endswith('`') and len(token) >= 2:
            code_text = token[1:-1]
            run = p.add_run(code_text)
            run.font.name = 'Consolas'
            run.font.size = Pt(11)
            run.font.color.rgb = RGBColor(180, 40, 40)
        elif token.startswith('**') and token.endswith('**') and len(token) >= 4:
            bold_text = token[2:-2]
            # Check if there is italic inside bold or vice versa
            run = p.add_run(bold_text)
            run.bold = True
        elif token.startswith('*') and token.endswith('*') and len(token) >= 2:
            italic_text = token[1:-1]
            run = p.add_run(italic_text)
            run.italic = True
        elif token.startswith('[') and ']' in token and token.endswith(')'):
            m = re.match(r'\[([^\]]+)\]\(([^)]+)\)', token)
            if m:
                link_text = m.group(1)
                run = p.add_run(link_text)
                run.font.color.rgb = RGBColor(0, 102, 204)
                run.underline = True
            else:
                p.add_run(token)
        else:
            p.add_run(token)

def convert_md_to_docx(md_path, docx_path):
    with open(md_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    doc = Document()

    # Set page margins (Standard Vietnamese academic: Left 3cm, Right 2cm, Top 2cm, Bottom 2cm)
    for section in doc.sections:
        section.top_margin = Inches(0.8)     # ~2.0 cm
        section.bottom_margin = Inches(0.8)  # ~2.0 cm
        section.left_margin = Inches(1.1)    # ~2.8 cm
        section.right_margin = Inches(0.8)   # ~2.0 cm
        
        # Add page numbers in footer
        footer = section.footer
        f_p = footer.paragraphs[0]
        f_p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        f_run = f_p.add_run("Báo cáo môn học: Triển khai & Quản trị Hệ thống Phần mềm")
        f_run.font.name = 'Times New Roman'
        f_run.font.size = Pt(9)
        f_run.font.italic = True
        f_run.font.color.rgb = RGBColor(128, 128, 128)

    # Configure base Normal style
    style_normal = doc.styles['Normal']
    font = style_normal.font
    font.name = 'Times New Roman'
    font.size = Pt(12.5)
    font.color.rgb = RGBColor(30, 30, 30)

    i = 0
    n = len(lines)
    
    in_code_block = False
    code_block_lines = []
    code_lang = ""

    while i < n:
        raw_line = lines[i]
        line = raw_line.rstrip('\r\n')
        
        # Handle code blocks
        if line.strip().startswith('```'):
            if not in_code_block:
                in_code_block = True
                code_lang = line.strip()[3:].strip()
                code_block_lines = []
                i += 1
                continue
            else:
                in_code_block = False
                # Render code block in a callout table
                tbl = doc.add_table(rows=1, cols=1)
                tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
                cell = tbl.cell(0, 0)
                set_cell_background(cell, "F4F5F7")
                set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
                
                # Border styling
                tcPr = cell._tc.get_or_add_tcPr()
                borders = parse_xml(
                    f'<w:tcBorders {nsdecls("w")}>'
                    f'<w:top w:val="single" w:sz="4" w:space="0" w:color="D1D5DB"/>'
                    f'<w:left w:val="single" w:sz="18" w:space="0" w:color="1F4E79"/>'
                    f'<w:bottom w:val="single" w:sz="4" w:space="0" w:color="D1D5DB"/>'
                    f'<w:right w:val="single" w:sz="4" w:space="0" w:color="D1D5DB"/>'
                    f'</w:tcBorders>'
                )
                tcPr.append(borders)
                
                cp = cell.paragraphs[0]
                cp.paragraph_format.space_before = Pt(0)
                cp.paragraph_format.space_after = Pt(0)
                cp.paragraph_format.line_spacing = 1.05
                
                full_code = "\n".join(code_block_lines)
                crun = cp.add_run(full_code)
                crun.font.name = 'Consolas'
                crun.font.size = Pt(10)
                crun.font.color.rgb = RGBColor(34, 34, 34)
                
                p_after = doc.add_paragraph()
                p_after.paragraph_format.space_before = Pt(0)
                p_after.paragraph_format.space_after = Pt(4)
                
                i += 1
                continue

        if in_code_block:
            code_block_lines.append(line)
            i += 1
            continue

        # Check for table
        if line.strip().startswith('|') and line.strip().endswith('|'):
            # Collect all table lines
            table_lines = []
            while i < n and lines[i].strip().startswith('|') and lines[i].strip().endswith('|'):
                table_lines.append(lines[i].strip())
                i += 1
            
            # Parse table
            if len(table_lines) >= 2:
                # Row 0: Header, Row 1: Separator |---|---|
                header_raw = table_lines[0]
                header_cols = [c.strip() for c in header_raw.strip('|').split('|')]
                
                # Check if row 1 is separator
                data_rows = []
                sep_idx = 1 if ('---' in table_lines[1]) else None
                start_data = 2 if sep_idx is not None else 1
                
                for r_idx in range(start_data, len(table_lines)):
                    r_line = table_lines[r_idx]
                    cols = [c.strip() for c in r_line.strip('|').split('|')]
                    # pad if fewer cols
                    while len(cols) < len(header_cols):
                        cols.append('')
                    data_rows.append(cols[:len(header_cols)])
                
                tbl = doc.add_table(rows=len(data_rows) + 1, cols=len(header_cols))
                tbl.style = 'Table Grid'
                tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
                
                # Header row
                hdr_cells = tbl.rows[0].cells
                for col_idx, col_name in enumerate(header_cols):
                    set_cell_background(hdr_cells[col_idx], "1F4E79")
                    set_cell_margins(hdr_cells[col_idx], top=100, bottom=100, left=120, right=120)
                    hp = hdr_cells[col_idx].paragraphs[0]
                    hp.alignment = WD_ALIGN_PARAGRAPH.CENTER
                    hp.paragraph_format.space_before = Pt(3)
                    hp.paragraph_format.space_after = Pt(3)
                    hrun = hp.add_run(col_name)
                    hrun.bold = True
                    hrun.font.name = 'Times New Roman'
                    hrun.font.size = Pt(11)
                    hrun.font.color.rgb = RGBColor(255, 255, 255)
                
                # Data rows
                for row_idx, row_data in enumerate(data_rows):
                    row_cells = tbl.rows[row_idx + 1].cells
                    bg = "F9FAFB" if row_idx % 2 == 1 else "FFFFFF"
                    for col_idx, cell_value in enumerate(row_data):
                        set_cell_background(row_cells[col_idx], bg)
                        set_cell_margins(row_cells[col_idx], top=80, bottom=80, left=100, right=100)
                        dp = row_cells[col_idx].paragraphs[0]
                        dp.paragraph_format.space_before = Pt(2)
                        dp.paragraph_format.space_after = Pt(2)
                        dp.paragraph_format.line_spacing = 1.15
                        
                        # Check if first col is number/STT
                        if col_idx == 0 and len(cell_value) <= 5 and cell_value.isdigit():
                            dp.alignment = WD_ALIGN_PARAGRAPH.CENTER
                            
                        add_inline_formatted_text(dp, cell_value)
                        for r in dp.runs:
                            if not r.font.name:
                                r.font.name = 'Times New Roman'
                            if not r.font.size:
                                r.font.size = Pt(11)
                
                doc.add_paragraph().paragraph_format.space_after = Pt(6)
            continue

        # Horizontal rule
        if line.strip() in ['---', '***', '___']:
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(6)
            p.paragraph_format.space_after = Pt(6)
            run = p.add_run("—" * 35)
            run.font.color.rgb = RGBColor(180, 180, 180)
            i += 1
            continue

        # Headings
        if line.startswith('# ') and not line.startswith('## '):
            h_text = line[2:].strip()
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(18)
            p.paragraph_format.space_after = Pt(8)
            p.paragraph_format.keep_with_next = True
            run = p.add_run(h_text)
            run.bold = True
            run.font.name = 'Times New Roman'
            run.font.size = Pt(20)
            run.font.color.rgb = RGBColor(16, 54, 94)
            i += 1
            continue

        if line.startswith('## ') and not line.startswith('### '):
            h_text = line[3:].strip()
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(14)
            p.paragraph_format.space_after = Pt(6)
            p.paragraph_format.keep_with_next = True
            run = p.add_run(h_text)
            run.bold = True
            run.font.name = 'Times New Roman'
            run.font.size = Pt(16)
            run.font.color.rgb = RGBColor(26, 82, 118)
            i += 1
            continue

        if line.startswith('### ') and not line.startswith('#### '):
            h_text = line[4:].strip()
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(10)
            p.paragraph_format.space_after = Pt(4)
            p.paragraph_format.keep_with_next = True
            run = p.add_run(h_text)
            run.bold = True
            run.font.name = 'Times New Roman'
            run.font.size = Pt(13.5)
            run.font.color.rgb = RGBColor(33, 97, 140)
            i += 1
            continue

        if line.startswith('#### '):
            h_text = line[5:].strip()
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(8)
            p.paragraph_format.space_after = Pt(3)
            p.paragraph_format.keep_with_next = True
            run = p.add_run(h_text)
            run.bold = True
            run.font.name = 'Times New Roman'
            run.font.size = Pt(12.5)
            run.font.color.rgb = RGBColor(40, 116, 166)
            i += 1
            continue

        # Blockquote: > ...
        if line.startswith('> '):
            quote_text = line[2:].strip()
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Inches(0.4)
            p.paragraph_format.space_before = Pt(4)
            p.paragraph_format.space_after = Pt(4)
            add_inline_formatted_text(p, quote_text)
            for r in p.runs:
                r.font.italic = True
                r.font.color.rgb = RGBColor(80, 80, 80)
            i += 1
            continue

        # Bullet list: * or -
        bullet_match = re.match(r'^(\s*)([\*\-])\s+(.+)$', line)
        if bullet_match:
            indent_spaces = len(bullet_match.group(1))
            content = bullet_match.group(3)
            p = doc.add_paragraph(style='List Bullet')
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.2
            if indent_spaces >= 2:
                p.paragraph_format.left_indent = Inches(0.4 + (indent_spaces // 2) * 0.25)
            add_inline_formatted_text(p, content)
            i += 1
            continue

        # Numbered list: 1. or 2.
        num_match = re.match(r'^(\s*)(\d+)\.\s+(.+)$', line)
        if num_match:
            indent_spaces = len(num_match.group(1))
            num_str = num_match.group(2)
            content = num_match.group(3)
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Inches(0.3 + (indent_spaces // 2) * 0.2)
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.2
            run_num = p.add_run(f"{num_str}. ")
            run_num.bold = True
            add_inline_formatted_text(p, content)
            i += 1
            continue

        # Empty line
        if not line.strip():
            # Don't add multiple empty paragraphs
            i += 1
            continue

        # Regular paragraph
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(3)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.25
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        add_inline_formatted_text(p, line.strip())
        i += 1

    doc.save(docx_path)
    print("Successfully converted to docx!")

if __name__ == '__main__':
    md_file = r'c:\Users\ADMIN\OneDrive\Desktop\Hệthống Blog  CMS\BAO_CAO_HE_THONG.md'
    docx_file = r'c:\Users\ADMIN\OneDrive\Desktop\Hệthống Blog  CMS\BAO_CAO_HE_THONG.docx'
    convert_md_to_docx(md_file, docx_file)
