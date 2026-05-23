from pathlib import Path
import re

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
)


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "THE_PADDLER_Project_Report.md"
OUTPUT = ROOT / "THE_PADDLER_Project_Report.pdf"


def clean_inline(text: str) -> str:
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    text = re.sub(r"`([^`]+)`", r"<font name='Courier'>\1</font>", text)
    return text


def footer(canvas, doc):
    canvas.saveState()
    width, height = A4
    canvas.setStrokeColor(colors.HexColor("#d9d9d9"))
    canvas.line(18 * mm, 15 * mm, width - 18 * mm, 15 * mm)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#666666"))
    canvas.drawString(18 * mm, 9 * mm, "THE PADDLER Project Report")
    canvas.drawRightString(width - 18 * mm, 9 * mm, f"Page {doc.page}")
    canvas.restoreState()


def build_pdf():
    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="CoverTitle",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=30,
            leading=34,
            textColor=colors.HexColor("#111111"),
            spaceAfter=10,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CoverSubtitle",
            parent=styles["Normal"],
            fontSize=12,
            leading=18,
            textColor=colors.HexColor("#555555"),
            spaceAfter=18,
        )
    )
    styles.add(
        ParagraphStyle(
            name="SectionHeading",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=17,
            leading=21,
            textColor=colors.HexColor("#111111"),
            spaceBefore=14,
            spaceAfter=7,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Body",
            parent=styles["BodyText"],
            fontSize=9.8,
            leading=14,
            textColor=colors.HexColor("#262626"),
            spaceAfter=7,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ReportBullet",
            parent=styles["Body"],
            leftIndent=14,
            firstLineIndent=-8,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Small",
            parent=styles["Body"],
            fontSize=8.5,
            leading=12,
            textColor=colors.HexColor("#555555"),
        )
    )

    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=20 * mm,
        title="THE PADDLER Project Report",
        author="THE PADDLER",
    )

    story = []
    story.append(Spacer(1, 28 * mm))
    story.append(Paragraph("THE PADDLER", styles["CoverTitle"]))
    story.append(Paragraph("Project Report and Technical Handover", styles["CoverSubtitle"]))
    story.append(
        Table(
            [
                ["Project", "Custom streetwear ecommerce platform"],
                ["Updated", "23 May 2026"],
                ["Stack", "Next.js, TypeScript, Firebase, Razorpay, Shiprocket"],
                ["Status", "Main website complete; domain/live production setup pending"],
            ],
            colWidths=[38 * mm, 118 * mm],
            style=TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111111")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
                    ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ("LEADING", (0, 0), (-1, -1), 12),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cccccc")),
                    ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#f7f7f7")),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                    ("TOPPADDING", (0, 0), (-1, -1), 7),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ]
            ),
        )
    )
    story.append(Spacer(1, 8 * mm))
    story.append(Paragraph("This document summarizes the current build, integrations, completed modules, operating logic, and launch checklist for THE PADDLER.", styles["Body"]))
    story.append(PageBreak())

    lines = SOURCE.read_text(encoding="utf-8").splitlines()
    pending_bullets = []

    def flush_bullets():
        nonlocal pending_bullets
        if not pending_bullets:
            return
        data = [[Paragraph(clean_inline(item), styles["Small"])] for item in pending_bullets]
        table = Table(data, colWidths=[156 * mm])
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8f8f8")),
                    ("BOX", (0, 0), (-1, -1), 0.4, colors.HexColor("#dddddd")),
                    ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#eeeeee")),
                    ("LEFTPADDING", (0, 0), (-1, -1), 7),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )
        story.append(table)
        story.append(Spacer(1, 4 * mm))
        pending_bullets = []

    for raw in lines:
        line = raw.strip()
        if not line:
            flush_bullets()
            story.append(Spacer(1, 2 * mm))
            continue
        if line.startswith("# "):
            continue
        if line.startswith("## "):
            flush_bullets()
            story.append(Paragraph(clean_inline(line[3:]), styles["SectionHeading"]))
            continue
        if line.startswith("- "):
            pending_bullets.append("- " + line[2:])
            continue
        if re.match(r"^\d+\.\s+", line):
            pending_bullets.append(line)
            continue
        flush_bullets()
        story.append(Paragraph(clean_inline(line), styles["Body"]))

    flush_bullets()
    doc.build(story, onFirstPage=footer, onLaterPages=footer)


if __name__ == "__main__":
    build_pdf()
    print(OUTPUT)
