export interface ReportData {
  moduleKey: "M1" | "M2" | "M3";
  isPractice: boolean;
  studentName: string;
  studentId?: string | null;
  section?: string | null;
  completedAt: Date;
  runNumber?: number;
  decisions: Record<string, unknown>;
  result: {
    score: number;
    maxScore: number;
    letterGrade: string;
    scoreBreakdown: Record<string, unknown>;
    kpis: Record<string, unknown>;
    feedback?: string[];
    validationFlags?: string[];
  };
  justification: string;
}

function safe(v: unknown, decimals = 0, prefix = "", suffix = ""): string {
  if (v === undefined || v === null) return "—";
  const n = Number(v);
  if (isNaN(n)) return String(v);
  const rounded = decimals === 0 ? Math.round(n) : parseFloat(n.toFixed(decimals));
  return `${prefix}${rounded.toLocaleString()}${suffix}`;
}

function decisionsSection(data: ReportData): string {
  const d = data.decisions as Record<string, unknown>;

  if (data.moduleKey === "M1") {
    const allocs = (d.allocations as Array<Record<string, unknown>> | undefined) ?? [];
    const allocRows = allocs.map(
      (a) =>
        `<tr>
          <td>${a.supplierId ?? "—"}</td>
          <td>${a.materialType ?? "—"}</td>
          <td>${safe(a.kg)} kg</td>
          <td>${a.transportMode ?? "—"}</td>
          <td>${a.assurancePackage ?? "—"}</td>
          <td>${safe(a.numBatches)}</td>
        </tr>`,
    ).join("");
    return `
      <table>
        <tr><td>SKU A Forecast</td><td>${safe(d.forecastA)} units</td></tr>
        <tr><td>SKU B Forecast</td><td>${safe(d.forecastB)} units</td></tr>
        <tr><td>Forecast Method A</td><td>${d.forecastMethodA ?? d.forecastMethod ?? "—"}</td></tr>
        <tr><td>Forecast Method B</td><td>${d.forecastMethodB ?? d.forecastMethod ?? "—"}</td></tr>
        <tr><td>Market Intelligence Report</td><td>${d.purchaseReport ? "Yes (purchased)" : "No"}</td></tr>
      </table>
      <p class="sub-heading">Supplier Allocations</p>
      <table>
        <thead><tr><th>Supplier</th><th>Material</th><th>Quantity</th><th>Transport</th><th>Assurance</th><th>Batches</th></tr></thead>
        <tbody>${allocRows}</tbody>
      </table>`;
  }

  if (data.moduleKey === "M2") {
    const sopA = (d.sopA as number[] | undefined) ?? [];
    const sopB = (d.sopB as number[] | undefined) ?? [];
    const sopRows = Array.from({ length: 8 }, (_, i) =>
      `<tr><td>Week ${i + 1}</td><td>${safe(sopA[i])} units</td><td>${safe(sopB[i])} units</td></tr>`,
    ).join("");
    return `
      <table>
        <tr><td>Capacity Mode</td><td>${d.capacityMode ?? "—"}</td></tr>
        <tr><td>Lot Size</td><td>${d.lotSize ?? "—"}</td></tr>
        <tr><td>Priority Rule</td><td>${d.priorityRule ?? "—"}</td></tr>
        <tr><td>Safety Stock Policy</td><td>${d.safetyStock ?? "—"}</td></tr>
        <tr><td>Bottleneck Target</td><td>${d.bottleneckTarget ?? "none"}</td></tr>
        <tr><td>Training Choice</td><td>${d.trainingChoice ?? "none"}</td></tr>
        <tr><td>Layout Choice</td><td>${d.layoutChoice ?? "—"}</td></tr>
        <tr><td>Flow Choice</td><td>${d.flowChoice ?? "—"}</td></tr>
        <tr><td>Lean Tool</td><td>${d.leanChoice ?? "none"}</td></tr>
      </table>
      <p class="sub-heading">8-Week S&OP Production Plan</p>
      <table>
        <thead><tr><th>Week</th><th>SKU A (Trend Tee)</th><th>SKU B (Core Jogger)</th></tr></thead>
        <tbody>${sopRows}</tbody>
      </table>`;
  }

  return `
    <table>
      <tr><td>Network Strategy</td><td>${d.networkStrategy ?? "—"}</td></tr>
      <tr><td>Shipping Service Mode</td><td>${d.serviceMode ?? "—"}</td></tr>
      <tr><td>Reorder Point (ROP)</td><td>${safe(d.rop)} units</td></tr>
      <tr><td>Order Quantity (Q)</td><td>${safe(d.q)} units</td></tr>
      <tr><td>Target Service Level</td><td>${d.serviceLevel ? `${(Number(d.serviceLevel) * 100).toFixed(0)}%` : "95%"}</td></tr>
    </table>`;
}

function kpisSection(data: ReportData): string {
  const k = data.result.kpis as Record<string, unknown>;

  if (data.moduleKey === "M1") {
    return `
      <table>
        <tr><td>Total Procurement Cost</td><td>${safe(k.totalProcurementCost, 0, "€")}</td></tr>
        <tr><td>Material Cost</td><td>${safe(k.materialCost, 0, "€")}</td></tr>
        <tr><td>Transport Cost</td><td>${safe(k.transportCost, 0, "€")}</td></tr>
        <tr><td>Forecast Error (avg)</td><td>${safe(Number(k.forecastErrorPct) * 100, 1, "", "%")}</td></tr>
        <tr><td>Avg Lead Time</td><td>${safe(k.avgLeadTimeDays)} days</td></tr>
        <tr><td>Avg Supplier Reliability</td><td>${safe(k.avgReliabilityPct)}%</td></tr>
        <tr><td>Avg Sustainability Score</td><td>${safe(k.avgSustainability, 1)} / 5.0</td></tr>
        <tr><td>Avg Quality Score</td><td>${safe(k.avgQuality, 1)} / 5.0</td></tr>
        <tr><td>CO₂ Footprint</td><td>${safe(k.totalCo2)} kg</td></tr>
        <tr><td>Late Deliveries</td><td>${safe(k.lateDeliveries)} / ${safe(k.totalDeliveries)}</td></tr>
      </table>`;
  }

  if (data.moduleKey === "M2") {
    return `
      <table>
        <tr><td>Service Level</td><td>${safe(k.serviceLevel, 1)}%</td></tr>
        <tr><td>Total Cost</td><td>${safe(k.totalCost, 0, "€")}</td></tr>
        <tr><td>Cost vs Target</td><td>${safe((Number(k.costRatio) - 1) * 100, 1, "", "%")}</td></tr>
        <tr><td>Capacity Utilization</td><td>${safe(k.capacityUtilization, 1)}%</td></tr>
        <tr><td>True Bottleneck</td><td>${k.trueBottleneck ?? "—"}</td></tr>
        <tr><td>Total Stockouts (A + B)</td><td>${safe(Number(k.totalStockoutsA ?? 0) + Number(k.totalStockoutsB ?? 0))} units</td></tr>
        <tr><td>Scrap / Rework Cost</td><td>${safe(k.scrapReworkCost, 0, "€")}</td></tr>
        <tr><td>Markdown Cost</td><td>${safe(k.markdownCost, 0, "€")}</td></tr>
      </table>`;
  }

  return `
    <table>
      <tr><td>Fill Rate</td><td>${safe(k.fillRate, 1)}%</td></tr>
      <tr><td>Total Cost</td><td>${safe(k.totalCost, 0, "€")}</td></tr>
      <tr><td>Cost vs Target</td><td>${safe((Number(k.costRatio) - 1) * 100, 1, "", "%")}</td></tr>
      <tr><td>Total Profit</td><td>${safe(k.totalProfit, 0, "€")}</td></tr>
      <tr><td>Profit Margin</td><td>${safe(k.profitMarginPct, 1)}%</td></tr>
      <tr><td>Total Stockouts</td><td>${safe(k.totalStockouts)} units</td></tr>
      <tr><td>Carbon Footprint</td><td>${safe(k.totalCarbonKg)} kg CO₂</td></tr>
      <tr><td>Ending Inventory</td><td>${safe(k.endingInventory)} units</td></tr>
    </table>`;
}

function scoreBreakdownSection(data: ReportData): string {
  const bd = data.result.scoreBreakdown as Record<string, unknown>;
  type Row = { label: string; score: number; max: number };
  let rows: Row[] = [];

  if (data.moduleKey === "M1") {
    rows = [
      { label: "Forecasting & Planning",          score: Number(bd.forecasting),          max: 15 },
      { label: "Supplier Selection — MCDA",        score: Number(bd.supplierMethod),        max: 12 },
      { label: "Cost / Service / Risk Trade-offs", score: Number(bd.tradeoffs),             max: 12 },
      { label: "Quality + Sustainability",          score: Number(bd.qualitySustainability), max:  8 },
      { label: "Validity",                          score: Number(bd.validityJustification), max:  5 },
    ];
  } else if (data.moduleKey === "M2") {
    rows = [
      { label: "Performance Outcomes (Service + Cost)", score: Number(bd.performance),      max: 20 },
      { label: "S&OP Planning Quality",                 score: Number(bd.sopQuality),        max: 10 },
      { label: "Bottleneck & Capacity Decision",        score: Number(bd.bottleneckScore),   max: 10 },
      { label: "Lean · Quality · Layout Decisions",     score: Number(bd.leanQualityScore),  max: 10 },
    ];
  } else {
    rows = [
      { label: "Performance — Fill Rate + Cost Efficiency",     score: Number(bd.performance),    max: 30 },
      { label: "Inventory Math — EOQ · Safety Stock · ROP",     score: Number(bd.inventoryMath),  max: 15 },
      { label: "Policy Quality & Reasoning (Network Strategy)", score: Number(bd.policyReasoning), max:  5 },
      { label: "Validity & Completeness",                       score: Number(bd.validity),        max:  2 },
    ];
  }

  const rowsHtml = rows.map(
    (r) => `<tr><td>${r.label}</td><td class="score-cell">${r.score} / ${r.max}</td></tr>`,
  ).join("");
  return `<table><tbody>${rowsHtml}</tbody></table>`;
}

function buildReportHTML(data: ReportData): string {
  const { moduleKey, isPractice, studentName, studentId, section,
          completedAt, runNumber, justification, result } = data;

  const moduleNames: Record<string, string> = {
    M1: "Module 1 — Global Sourcing & Procurement",
    M2: "Module 2 — Operations & Flow (S&OP)",
    M3: "Module 3 — Distribution & Inventory Policy",
  };

  const reportType = isPractice ? `Practice Run #${runNumber ?? ""}` : "Official Submission";
  const dateStr = completedAt.toLocaleString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const feedbackItems = (result.feedback ?? [])
    .map((f) => `<li>${f}</li>`)
    .join("");

  const watermarkCss = isPractice
    ? `body::before { content: "PRACTICE — NOT FOR GRADING"; position: fixed; top: 50%; left: 50%;
         transform: translate(-50%, -50%) rotate(-35deg); font-size: 52px; color: rgba(0,0,0,0.05);
         white-space: nowrap; pointer-events: none; z-index: 9999; font-weight: 900; }`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${isPractice ? "[PRACTICE] " : ""}${moduleNames[moduleKey]} — Veloce Wear SCM</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:#1a1a2e;background:#f0f2f5;padding:20px;}
  .no-print{display:flex;gap:12px;max-width:820px;margin:0 auto 16px;}
  button{padding:10px 22px;font-size:13px;font-weight:600;border:none;cursor:pointer;border-radius:6px;}
  .btn-print{background:#2563eb;color:#fff;}
  .btn-close{background:#e5e7eb;color:#374151;}
  .paper{background:#fff;max-width:820px;margin:0 auto;padding:44px 52px;box-shadow:0 2px 20px rgba(0,0,0,0.10);border-radius:8px;}
  .brand{font-size:20px;font-weight:900;color:#1e293b;letter-spacing:-0.5px;}
  .brand span{color:#2563eb;}
  .brand-sub{font-size:9px;text-transform:uppercase;letter-spacing:0.18em;color:#94a3b8;margin-top:2px;}
  .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:18px;border-bottom:2.5px solid #1e293b;margin-bottom:20px;}
  .badge{display:inline-block;padding:3px 12px;border-radius:99px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;}
  .badge-official{background:#dcfce7;color:#15803d;}
  .badge-practice{background:#fef3c7;color:#92400e;}
  .watermark-banner{text-align:center;margin-bottom:14px;}
  .watermark-text{display:inline-block;padding:5px 18px;background:#fef3c7;border:1px solid #fde68a;border-radius:4px;font-size:11px;font-weight:800;color:#92400e;letter-spacing:0.08em;}
  h2{font-size:13px;font-weight:700;color:#1e293b;margin:22px 0 8px;padding-bottom:4px;border-bottom:1.5px solid #e2e8f0;}
  .sub-heading{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;margin:12px 0 5px;}
  .student-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px 16px;}
  .sf{display:flex;flex-direction:column;}
  .sl{font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:#94a3b8;margin-bottom:2px;}
  .sv{font-size:12px;font-weight:600;color:#1e293b;}
  table{width:100%;border-collapse:collapse;margin-bottom:6px;}
  th,td{padding:5px 8px;text-align:left;border-bottom:1px solid #f1f5f9;font-size:11px;}
  th{font-weight:700;color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;background:#f8fafc;}
  tr:last-child td{border-bottom:none;}
  .score-cell{text-align:right;font-weight:600;}
  .score-row{display:flex;align-items:baseline;gap:8px;margin:10px 0 4px;}
  .score-big{font-size:38px;font-weight:900;color:#1e293b;}
  .score-denom{font-size:16px;color:#94a3b8;}
  .grade{font-size:26px;font-weight:900;}
  .grA{color:#16a34a;} .grB{color:#2563eb;} .grC{color:#d97706;} .grD,.grF{color:#dc2626;}
  .note-box{background:#fff7ed;border:1px solid #fed7aa;border-radius:6px;padding:9px 14px;margin:12px 0;font-size:11px;color:#92400e;}
  .just-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px 16px;min-height:56px;font-size:11px;color:#374151;line-height:1.65;white-space:pre-wrap;}
  ul.fb{list-style:disc;padding-left:18px;font-size:11px;color:#374151;line-height:1.75;}
  .inst{margin-top:30px;padding-top:20px;border-top:2px dashed #94a3b8;}
  .inst-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin:12px 0;}
  .inst-label{font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:#94a3b8;margin-bottom:4px;}
  .inst-field{border-bottom:1.5px solid #374151;min-height:26px;padding:4px 0;}
  .inst-hint{font-size:9px;color:#94a3b8;margin-top:3px;}
  .comments-box{border:1.5px solid #374151;border-radius:4px;min-height:54px;margin:8px 0;}
  .final-row{display:flex;align-items:center;gap:10px;margin-top:14px;}
  .final-field{border-bottom:1.5px solid #1e293b;min-width:80px;height:28px;}
  .footer{margin-top:28px;padding-top:10px;border-top:1px solid #e2e8f0;font-size:9px;color:#94a3b8;text-align:center;}
  @media print{
    .no-print{display:none!important;}
    body{background:#fff;padding:0;}
    .paper{box-shadow:none;border-radius:0;max-width:100%;padding:24px 32px;}
    @page{margin:15mm 12mm;}
  }
  ${watermarkCss}
</style>
</head>
<body>
<div class="no-print">
  <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
  <button class="btn-close" onclick="window.close()">✕ Close</button>
</div>
<div class="paper">
  ${isPractice ? `<div class="watermark-banner"><span class="watermark-text">⚠ PRACTICE REPORT — NOT FOR GRADING ⚠</span></div>` : ""}

  <div class="header">
    <div>
      <div class="brand">Veloce<span>Wear</span></div>
      <div class="brand-sub">SCM Simulation · SCM 4330, Georgia Gwinnett College</div>
    </div>
    <div style="text-align:right;">
      <span class="badge ${isPractice ? "badge-practice" : "badge-official"}">${isPractice ? "PRACTICE REPORT — NOT FOR GRADING" : "OFFICIAL SCORE REPORT"}</span>
      <div style="font-size:10px;color:#64748b;margin-top:6px;">Auto-Scored by Simulation Engine</div>
    </div>
  </div>

  <h2>Student Information</h2>
  <div class="student-grid">
    <div class="sf"><div class="sl">Student Name</div><div class="sv">${studentName || "—"}</div></div>
    <div class="sf"><div class="sl">Student ID</div><div class="sv">${studentId || "—"}</div></div>
    <div class="sf"><div class="sl">Section</div><div class="sv">${section || "—"}</div></div>
    <div class="sf"><div class="sl">Attempt Type</div><div class="sv">${reportType}</div></div>
    <div class="sf"><div class="sl">Completed At</div><div class="sv">${dateStr}</div></div>
    <div class="sf"><div class="sl">Scenario</div><div class="sv">Standard Scenario</div></div>
  </div>

  <h2>${moduleNames[moduleKey]}</h2>

  <p class="sub-heading">Decisions Submitted</p>
  ${decisionsSection(data)}

  <p class="sub-heading">Key Performance Outcomes</p>
  ${kpisSection(data)}

  <p class="sub-heading">Auto-Scored Points — Objective Simulation Results Only</p>
  ${scoreBreakdownSection(data)}
  <div class="score-row">
    <span class="score-big">${result.score}</span>
    <span class="score-denom">/ ${result.maxScore} auto-scored pts</span>
    <span class="grade gr${result.letterGrade}">${result.letterGrade}</span>
  </div>

  <p class="sub-heading">Written Justification <span style="font-weight:400;color:#94a3b8;">(graded manually by instructor — not included in score above)</span></p>
  <div class="just-box">${justification || "(No justification submitted)"}</div>

  ${feedbackItems ? `
  <p class="sub-heading">Simulation Feedback</p>
  <ul class="fb">${feedbackItems}</ul>` : ""}

  <div class="note-box">
    <strong>Grading Note:</strong> The written justification above is <strong>not</strong> included in the auto-score.
    Auto-score: <strong>${result.score} / ${result.maxScore} pts</strong> (${Math.round((result.score / result.maxScore) * 100)}%).
    The instructor will award additional points for the justification separately.
  </div>

  <div class="inst">
    <h2 style="color:#475569;border-color:#94a3b8;">Instructor Use Only</h2>
    <div class="inst-grid">
      <div>
        <div class="inst-label">Justification Score Awarded</div>
        <div class="inst-field"></div>
        <div class="inst-hint">Points / max pts</div>
      </div>
      <div>
        <div class="inst-label">Brief Comment</div>
        <div class="inst-field"></div>
        <div class="inst-hint">&nbsp;</div>
      </div>
      <div>
        <div class="inst-label">Graded By</div>
        <div class="inst-field"></div>
        <div class="inst-hint">Instructor name</div>
      </div>
    </div>
    <div style="margin-top:10px;">
      <div class="inst-label">Extended Comments</div>
      <div class="comments-box"></div>
    </div>
    <div class="final-row">
      <strong style="font-size:12px;">Final Module Grade (Auto + Justification):</strong>
      <div class="final-field"></div>
      <span style="font-size:12px;color:#94a3b8;">/ ______ pts</span>
    </div>
  </div>

  <div class="footer">
    Veloce Wear SCM Simulation · SCM 4330, Georgia Gwinnett College ·
    Generated ${new Date().toLocaleString()}${isPractice ? " · PRACTICE — NOT FOR OFFICIAL GRADING" : ""}
  </div>
</div>
</body>
</html>`;
}

export function openSimulationReport(data: ReportData): void {
  const win = window.open("", "_blank");
  if (!win) {
    alert("Pop-up blocked. Please allow pop-ups for this site and try again.");
    return;
  }
  win.document.write(buildReportHTML(data));
  win.document.close();
}
