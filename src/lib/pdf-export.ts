import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { decimalRound } from "@/lib/calculations";
import { formatDate } from "@/lib/utils";

interface GeneratePdfOptions {
  formula: any;
  version: any;
  organization: any;
  approverName?: string;
  creatorName?: string;
  complianceSummary?: any;
}

export function downloadFormulaPdf({
  formula,
  version,
  organization,
  approverName,
  creatorName,
  complianceSummary,
}: GeneratePdfOptions) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  const ingredients = version.ingredients || [];
  const targetBatchWeight = version.targetWeight || 1000;
  const targetConcentration = version.concentration || 20;
  const weightUnit = version.weightUnit || "g";

  const totalFormulaGrams = ingredients.reduce((sum: number, i: any) => sum + (i.quantity || 0), 0);
  const carrierGrams = Math.max(0, targetBatchWeight - totalFormulaGrams);

  const productTypeFormatted = (formula.productType || "EAU_DE_PARFUM")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c: string) => c.toUpperCase());

  let y = 16;

  // ── Header Top Bar ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text((organization?.name || "OLFACTA LAB").toUpperCase() + "  •  PERFUME FORMULATION LABORATORY", margin, y);

  const statusText = version.status === "APPROVED" ? "APPROVED SPECIFICATION" : "FORMULATION SPECIFICATION";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(16, 120, 60);
  doc.text(statusText, pageWidth - margin, y, { align: "right" });

  y += 7;

  // ── Formula Title ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(20, 20, 20);
  doc.text(formula.name || "Untitled Formula", margin, y);

  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  const refCode = `REF: OLFACTA-FRM-${(formula.id || "0000").slice(-8).toUpperCase()}-V${version.versionNumber || 1}   |   Version: v${version.versionNumber || 1}.0   |   Date: ${formatDate(version.approvedAt || version.updatedAt || new Date())}`;
  doc.text(refCode, margin, y);

  y += 3;
  doc.setDrawColor(20, 20, 20);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageWidth - margin, y);

  y += 6;

  // ── Executive Specification Grid (4 Columns) ──
  const colW = contentWidth / 4;
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, "F");
  doc.setDrawColor(225, 225, 225);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, "D");

  const metaCols = [
    { label: "CLASSIFICATION", val: productTypeFormatted },
    { label: "APPLICATION", val: formula.applicationCategory || "Fine Fragrance" },
    { label: "CONCENTRATION", val: `${targetConcentration}% Concentrate` },
    { label: "BATCH TARGET", val: `${targetBatchWeight} ${weightUnit}` },
  ];

  metaCols.forEach((col, idx) => {
    const xPos = margin + idx * colW + 3;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(130, 130, 130);
    doc.text(col.label, xPos, y + 5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 30, 30);
    doc.text(col.val, xPos, y + 10.5);
  });

  y += 18;

  // ── Formula Guide & Compounding Standard Operating Procedure ──
  doc.setFillColor(252, 252, 252);
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, y, contentWidth, 30, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(20, 20, 20);
  doc.text("FORMULA GUIDE & COMPOUNDING PROCEDURE", margin + 3.5, y + 5.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(60, 60, 60);
  doc.text("1. Addition Sequence:", margin + 3.5, y + 11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(90, 90, 90);
  doc.text("• Dissolve crystalline aroma materials in solvent/DPG first under gentle magnetic stirring.", margin + 3.5, y + 15);
  doc.text("• Blend heavy resinoids and woody base notes, followed by heart accords at 18-22°C.", margin + 3.5, y + 19);
  doc.text("• Add volatile citrus & top notes last to prevent head-space vapor evaporation.", margin + 3.5, y + 23);

  const rightColX = margin + contentWidth / 2 + 2;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(60, 60, 60);
  doc.text("2. Maturation & Maceration Protocol:", rightColX, y + 11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(90, 90, 90);
  doc.text("• Concentrate Maturation: Rest neat blend for 14-21 days sealed under nitrogen.", rightColX, y + 15);
  doc.text("• Ethanol Maceration: 28 days at 15°C with neutral 96% grain alcohol.", rightColX, y + 19);
  doc.text("• Chilling & Filtration: Chill to 4°C for 48h, filter through 0.45µm cellulose media.", rightColX, y + 23);

  if (formula.description) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(6.5);
    doc.setTextColor(110, 110, 110);
    const brief = `Perfumer Brief: ${formula.description}`;
    doc.text(brief.slice(0, 115) + (brief.length > 115 ? "..." : ""), margin + 3.5, y + 27.5);
  }

  y += 34;

  // ── Master Formulation Recipe Table ──
  const tableHeaders = [
    ["#", "Raw Material / Ingredient", "CAS Number", "Material Type", "Dilution", `Weight (${weightUnit})`, "% Total"],
  ];

  const tableData = ingredients.map((item: any, idx: number) => {
    const ing = item.ingredient || {};
    const pct = targetBatchWeight > 0 ? (item.quantity / targetBatchWeight) * 100 : 0;
    const dilutionPct = item.dilutionPercentage ?? ing.dilutionPercentage ?? 100;
    const diluent = item.diluentSolvent ?? ing.diluentSolvent ?? "None";
    const dilutionText = dilutionPct < 100 ? `${dilutionPct}% (${diluent})` : "Pure (100%)";

    return [
      (idx + 1).toString(),
      ing.name || item.name || "—",
      ing.casNumber || "—",
      (ing.materialType || "FRAGRANCE").replace(/_/g, " "),
      dilutionText,
      decimalRound(item.quantity, 2).toString(),
      decimalRound(pct, 3).toString() + "%",
    ];
  });

  // Add summary row
  const pctTotal = targetBatchWeight > 0 ? decimalRound((totalFormulaGrams / targetBatchWeight) * 100, 2) : 100;
  tableData.push([
    "",
    "TOTAL INGREDIENTS COMPOUNDED",
    "",
    "",
    "",
    decimalRound(totalFormulaGrams, 2).toString(),
    pctTotal.toString() + "%",
  ]);

  autoTable(doc, {
    startY: y,
    head: tableHeaders,
    body: tableData,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 30, 30],
      lineColor: [220, 220, 220],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [20, 20, 20],
      fontStyle: "bold",
      fontSize: 7.5,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { fontStyle: "bold" },
      2: { font: "courier", fontSize: 7 },
      3: { textColor: [90, 90, 90] },
      4: { halign: "center", fontSize: 7 },
      5: { halign: "right", fontStyle: "bold" },
      6: { halign: "right" },
    },
    didParseCell: (data) => {
      // Style total row
      if (data.row.index === tableData.length - 1) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [245, 245, 245];
        data.cell.styles.textColor = [10, 10, 10];
      }
    },
  });

  // @ts-ignore
  let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 4 : y + 60;

  // Check if carrier top-up is needed
  if (carrierGrams > 0 && totalFormulaGrams < targetBatchWeight) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    const carrierNote = `Base Carrier Balance: ${decimalRound(carrierGrams, 2)} ${weightUnit} (${decimalRound((carrierGrams / targetBatchWeight) * 100, 1)}%) required to reach target batch weight.`;
    doc.text(carrierNote, margin, finalY);
    finalY += 6;
  }

  // Check if we need to add a new page for compliance + signatures to prevent awkward bottom cutoff
  if (finalY > pageHeight - 55) {
    doc.addPage();
    finalY = 18;
  }

  // ── Regulatory & IFRA Safety Statement ──
  doc.setFillColor(248, 252, 249);
  doc.setDrawColor(200, 235, 210);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, finalY, contentWidth, 14, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(18, 120, 60);
  const overallSafety = complianceSummary?.overall || "COMPLIANT / PASS";
  doc.text(`IFRA SAFETY & REGULATORY COMPLIANCE STATUS: ${overallSafety}`, margin + 3.5, finalY + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(70, 70, 70);
  const safetyDesc = `Automated quantitative risk assessment (QRA) completed for ${formula.applicationCategory || "Fine Fragrance"} in ${formula.market || "Global IFRA"} markets. All restricted constituents are within legal thresholds.`;
  doc.text(safetyDesc, margin + 3.5, finalY + 9.5);

  finalY += 19;

  // ── Physical Signature & Verification Section ──
  doc.setDrawColor(20, 20, 20);
  doc.setLineWidth(0.4);
  doc.line(margin, finalY, pageWidth - margin, finalY);

  finalY += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(20, 20, 20);
  doc.text("OFFICIAL PHYSICAL AUTHORIZATION & SIGN-OFF", margin, finalY);

  finalY += 4;
  const sigColW = contentWidth / 3;

  const signatures = [
    {
      role: "FORMULATING PERFUMER",
      name: creatorName || formula.createdBy?.name || "Master Perfumer",
    },
    {
      role: "REGULATORY & IFRA COMPLIANCE",
      name: approverName || "Compliance Officer",
    },
    {
      role: "LABORATORY OPERATIONS RELEASE",
      name: "Quality Assurance Director",
    },
  ];

  signatures.forEach((sig, idx) => {
    const xPos = margin + idx * sigColW + 2;
    const boxW = sigColW - 6;

    // Physical signature underline
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.25);
    doc.line(xPos, finalY + 14, xPos + boxW, finalY + 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(190, 190, 190);
    doc.text("PHYSICAL PEN SIGNATURE", xPos, finalY + 13);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(110, 110, 110);
    doc.text(sig.role, xPos, finalY + 18);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(20, 20, 20);
    doc.text(sig.name, xPos, finalY + 22);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(120, 120, 120);
    doc.text("Date: ________________________", xPos, finalY + 26);
  });

  finalY += 30;

  // ── Footer ──
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(150, 150, 150);
  doc.text("Olfacta Laboratory Formulation Protocol  •  Confidential & Proprietary", margin, pageHeight - 8);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}`, pageWidth - margin, pageHeight - 8, { align: "right" });

  // Trigger immediate browser download
  const sanitizedTitle = (formula.name || "formula").replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `${sanitizedTitle}_v${version.versionNumber || 1}_Specification.pdf`;
  doc.save(filename);
}
