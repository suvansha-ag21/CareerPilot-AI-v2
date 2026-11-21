function escapePdfText(text) {
    return text
        .replace(/[^\x20-\x7E]/g, " ")
        .replace(/\\/g, "\\\\")
        .replace(/\(/g, "\\(")
        .replace(/\)/g, "\\)");
}
function wrapLine(text, maxChars) {
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0)
        return [];
    const lines = [];
    let current = "";
    for (const word of words) {
        if (!current) {
            current = word;
        }
        else if (current.length + 1 + word.length <= maxChars) {
            current += ` ${word}`;
        }
        else {
            lines.push(current);
            current = word;
        }
    }
    if (current)
        lines.push(current);
    return lines;
}
export function downloadTailoredResumePdf(params) {
    const blocks = [
        { text: params.candidateName.toUpperCase(), bold: true, size: 16 },
        {
            text: [params.tailored.headline, params.email, params.location].filter(Boolean).join("  |  "),
            size: 10,
            gapBefore: 2,
        },
        { text: `TARGET ROLE: ${params.tailored.targetRole}`, bold: true, size: 10, gapBefore: 10 },
        { text: "PROFESSIONAL SUMMARY", bold: true, size: 11, gapBefore: 12 },
        ...wrapLine(params.tailored.tailoredSummary, 88).map((line) => ({ text: line, size: 10 })),
        { text: "CORE SKILLS", bold: true, size: 11, gapBefore: 12 },
        ...wrapLine(params.tailored.highlightedSkills.join("  •  "), 88).map((line) => ({
            text: line,
            size: 10,
        })),
        { text: "TAILORED ACHIEVEMENTS & PROJECT BULLETS", bold: true, size: 11, gapBefore: 12 },
    ];
    for (const item of params.tailored.rewrittenBullets) {
        blocks.push({ text: `[${item.section}]`, bold: true, size: 9, gapBefore: 6 });
        for (const line of wrapLine(`- ${item.tailored}`, 86)) {
            blocks.push({ text: line, size: 10 });
        }
    }
    if (params.tailored.atsKeywordsAdded.length > 0) {
        blocks.push({ text: "ALIGNED ROLE KEYWORDS", bold: true, size: 11, gapBefore: 12 });
        for (const line of wrapLine(params.tailored.atsKeywordsAdded.join(", "), 88)) {
            blocks.push({ text: line, size: 9 });
        }
    }
    // Paginate cleanly across US Letter pages (612 x 792 pt)
    const pages = [];
    let streamLines = [];
    let y = 745;
    const flushPage = () => {
        if (streamLines.length > 0) {
            pages.push(streamLines.join("\n"));
            streamLines = [];
        }
        y = 745;
    };
    for (const b of blocks) {
        y -= b.gapBefore ?? 0;
        const size = b.size ?? 10;
        const lineHeight = size + 4;
        if (y < 55) {
            flushPage();
        }
        const font = b.bold ? "/F2" : "/F1";
        streamLines.push(`BT ${font} ${size} Tf 50 ${y} Td (${escapePdfText(b.text)}) Tj ET`);
        y -= lineHeight;
    }
    flushPage();
    // Build valid PDF objects
    const objects = [];
    const pageObjIds = [];
    let nextId = 3; // 1 = Catalog, 2 = Pages
    const fontRegularId = nextId++;
    const fontBoldId = nextId++;
    for (const contentStream of pages) {
        const pageId = nextId++;
        const contentId = nextId++;
        pageObjIds.push(pageId);
        objects.push(`${pageId} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> >> endobj\n`);
        objects.push(`${contentId} 0 obj << /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`);
    }
    const catalogObj = "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n";
    const pagesObj = `2 0 obj << /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjIds.length} >> endobj\n`;
    const f1Obj = `${fontRegularId} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n`;
    const f2Obj = `${fontBoldId} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj\n`;
    const ordered = [catalogObj, pagesObj, f1Obj, f2Obj, ...objects];
    // Re-sort by numeric object ID before xref generation
    ordered.sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10));
    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    for (const obj of ordered) {
        offsets.push(pdf.length);
        pdf += obj;
    }
    const xrefPos = pdf.length;
    pdf += `xref\n0 ${ordered.length + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i <= ordered.length; i++) {
        pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
    }
    pdf += `trailer << /Size ${ordered.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`;
    const blob = new Blob([pdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeRole = params.tailored.targetRole.replace(/[^A-Za-z0-9]+/g, "_");
    a.download = `CareerPilot_${safeRole}_Resume.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
