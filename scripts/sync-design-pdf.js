const fs = require('fs');
const path = require('path');

const designDir = path.join(__dirname, '..', 'design-html');

// 1. In 13-formula-workspace-detail.html: add 'Save PDF' button
const wsFile = path.join(designDir, '13-formula-workspace-detail.html');
if (fs.existsSync(wsFile)) {
  let wsHtml = fs.readFileSync(wsFile, 'utf8');

  const targetSnippet = 'Formula Settings</button>';
  const pdfBtn = '<a href="18-formula-approved-pdf.html" target="_blank" class="inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium transition-colors border border-emerald-600/30 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800 h-8 rounded-md px-3 text-xs no-underline shadow-2xs mr-2"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text text-emerald-600"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg> Save PDF</a>';

  if (wsHtml.includes(targetSnippet) && !wsHtml.includes('18-formula-approved-pdf.html')) {
    wsHtml = wsHtml.replace(targetSnippet, `${targetSnippet}${pdfBtn}`);
    fs.writeFileSync(wsFile, wsHtml, 'utf8');
    console.log('Successfully added Save PDF button to 13-formula-workspace-detail.html');
  }
}

// 2. In 04-formulas-list.html: add 'Save PDF' badge/link on approved formulas
const fListFile = path.join(designDir, '04-formulas-list.html');
if (fs.existsSync(fListFile)) {
  let fListHtml = fs.readFileSync(fListFile, 'utf8');
  const searchLink = '<a class="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1" href="/formulas/';
  const replaceLink = '<a href="18-formula-approved-pdf.html" target="_blank" class="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 shadow-2xs mr-2 no-underline"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text text-emerald-600"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg> Save PDF</a><a class="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1" href="/formulas/';

  if (fListHtml.includes(searchLink) && !fListHtml.includes('18-formula-approved-pdf.html')) {
    fListHtml = fListHtml.replace(searchLink, replaceLink);
    fs.writeFileSync(fListFile, fListHtml, 'utf8');
    console.log('Successfully added Save PDF link to 04-formulas-list.html');
  }
}

// 3. Create 18-formula-approved-pdf.html (the standalone design artboard for the approved PDF dossier)
const sampleHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Olfacta — Approved Formula Specification & Compounding Guide Dossier</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-neutral-100 text-neutral-900 p-4 sm:p-8 print:p-0 print:bg-white">
  <div class="max-w-4xl mx-auto mb-4 flex items-center justify-between print:hidden">
    <a href="13-formula-workspace-detail.html" class="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 no-underline">
      &larr; Back to Workspace
    </a>
    <button onclick="window.print()" class="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-sm cursor-pointer">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
      Download / Save as PDF
    </button>
  </div>

  <div class="max-w-4xl mx-auto bg-white border border-neutral-200 rounded-xl p-8 sm:p-12 shadow-sm print:border-0 print:shadow-none print:p-4">
    <!-- Header -->
    <div class="border-b-2 border-neutral-900 pb-6 mb-6">
      <div class="flex items-start justify-between">
        <div>
          <div class="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-1">
            AROMA LABS &bull; PERFUME FORMULATION LABORATORY
          </div>
          <h1 class="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-neutral-950">
            Citrus Woody EDP
          </h1>
          <p class="text-xs text-neutral-600 mt-1 font-mono">
            Document Ref: OLFACTA-FRM-00482B-V1 &bull; Specification Certificate
          </p>
        </div>
        <div class="text-right">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-600/30 bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-1">
            &check; APPROVED SPECIFICATION
          </span>
          <p class="text-xs text-neutral-500 font-mono">Version: <b class="text-neutral-900">v1.0</b> &bull; Date: <b>September 09, 2026</b></p>
        </div>
      </div>
    </div>

    <!-- Quick Meta Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-neutral-50 border border-neutral-200 mb-6 text-xs">
      <div>
        <span class="text-neutral-500 block text-[11px] font-medium uppercase">Product Type</span>
        <span class="font-semibold text-neutral-900">Eau De Parfum</span>
      </div>
      <div>
        <span class="text-neutral-500 block text-[11px] font-medium uppercase">Application</span>
        <span class="font-semibold text-neutral-900">Fine Fragrance</span>
      </div>
      <div>
        <span class="text-neutral-500 block text-[11px] font-medium uppercase">Concentrate Ratio</span>
        <span class="font-semibold font-mono text-neutral-900">20% Concentrate</span>
      </div>
      <div>
        <span class="text-neutral-500 block text-[11px] font-medium uppercase">Reference Batch</span>
        <span class="font-semibold font-mono text-neutral-900">1000 g</span>
      </div>
    </div>

    <!-- Compounding Guide SOP -->
    <div class="mb-6 rounded-lg border border-neutral-200 p-5 bg-white space-y-3">
      <h2 class="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b pb-2">
        Formula Guide & Compounding Standard Operating Procedure
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-neutral-700">
        <div>
          <p class="font-semibold text-neutral-900 mb-1">1. Sequence of Raw Material Addition:</p>
          <ol class="list-decimal pl-4 space-y-1 text-neutral-600">
            <li>Dissolve crystalline aroma isolates into solvent/carrier under gentle magnetic stirring.</li>
            <li>Incorporate heavy resinoids, balsams, and woody base notes at room temp (18-22&deg;C).</li>
            <li>Blend middle floral/amber heart accords.</li>
            <li>Add volatile citrus & top notes last to prevent head-space vapor evaporation.</li>
          </ol>
        </div>
        <div>
          <p class="font-semibold text-neutral-900 mb-1">2. Maturation & Maceration Protocol:</p>
          <ul class="list-disc pl-4 space-y-1 text-neutral-600">
            <li><b>Concentrate Aging:</b> Rest neat fragrance oil <b>14-21 days</b> sealed under inert gas.</li>
            <li><b>Alcohol Maceration:</b> Post-dilution with 96% grain alcohol, macerate for <b>28 days</b> at 15&deg;C.</li>
            <li><b>Chilling & Filtration:</b> Chill to 4&deg;C for 48h to precipitate waxes; filter at 0.45&micro;m.</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Formulation Recipe Table -->
    <div class="mb-6">
      <h2 class="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-2">
        Master Formulation Recipe (8 Compounded Ingredients)
      </h2>
      <table class="w-full text-left text-xs border-collapse border border-neutral-300">
        <thead>
          <tr class="bg-neutral-100 border-b border-neutral-300 font-semibold text-neutral-800">
            <th class="py-2 px-3">#</th>
            <th class="py-2 px-3">Raw Material / Ingredient</th>
            <th class="py-2 px-3 font-mono">CAS Number</th>
            <th class="py-2 px-3">Type</th>
            <th class="py-2 px-3 text-center">Dilution</th>
            <th class="py-2 px-3 text-right font-mono">Weight (g)</th>
            <th class="py-2 px-3 text-right font-mono">% Share</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-neutral-200">
          <tr><td class="py-1.5 px-3 font-mono text-neutral-400">1</td><td class="py-1.5 px-3 font-medium">Bergamot Oil (FCF)</td><td class="py-1.5 px-3 font-mono">8007-75-8</td><td class="py-1.5 px-3">Essential Oil</td><td class="py-1.5 px-3 text-center font-mono">Pure (100%)</td><td class="py-1.5 px-3 text-right font-mono font-semibold">45.00</td><td class="py-1.5 px-3 text-right font-mono">4.50%</td></tr>
          <tr><td class="py-1.5 px-3 font-mono text-neutral-400">2</td><td class="py-1.5 px-3 font-medium">Linalyl Acetate</td><td class="py-1.5 px-3 font-mono">115-95-7</td><td class="py-1.5 px-3">Aroma Chemical</td><td class="py-1.5 px-3 text-center font-mono">Pure (100%)</td><td class="py-1.5 px-3 text-right font-mono font-semibold">15.00</td><td class="py-1.5 px-3 text-right font-mono">1.50%</td></tr>
          <tr><td class="py-1.5 px-3 font-mono text-neutral-400">3</td><td class="py-1.5 px-3 font-medium">Hedione (Methyl Dihydrojasmonate)</td><td class="py-1.5 px-3 font-mono">24851-98-7</td><td class="py-1.5 px-3">Aroma Chemical</td><td class="py-1.5 px-3 text-center font-mono">Pure (100%)</td><td class="py-1.5 px-3 text-right font-mono font-semibold">30.00</td><td class="py-1.5 px-3 text-right font-mono">3.00%</td></tr>
          <tr><td class="py-1.5 px-3 font-mono text-neutral-400">4</td><td class="py-1.5 px-3 font-medium">Iso E Super</td><td class="py-1.5 px-3 font-mono">54464-57-2</td><td class="py-1.5 px-3">Aroma Chemical</td><td class="py-1.5 px-3 text-center font-mono">Pure (100%)</td><td class="py-1.5 px-3 text-right font-mono font-semibold">60.00</td><td class="py-1.5 px-3 text-right font-mono">6.00%</td></tr>
          <tr><td class="py-1.5 px-3 font-mono text-neutral-400">5</td><td class="py-1.5 px-3 font-medium">Cedarwood Virginia</td><td class="py-1.5 px-3 font-mono">8000-27-9</td><td class="py-1.5 px-3">Essential Oil</td><td class="py-1.5 px-3 text-center font-mono">Pure (100%)</td><td class="py-1.5 px-3 text-right font-mono font-semibold">20.00</td><td class="py-1.5 px-3 text-right font-mono">2.00%</td></tr>
          <tr><td class="py-1.5 px-3 font-mono text-neutral-400">6</td><td class="py-1.5 px-3 font-medium">Ambroxan</td><td class="py-1.5 px-3 font-mono">6790-58-5</td><td class="py-1.5 px-3">Aroma Chemical</td><td class="py-1.5 px-3 text-center font-mono">Pure (100%)</td><td class="py-1.5 px-3 text-right font-mono font-semibold">10.00</td><td class="py-1.5 px-3 text-right font-mono">1.00%</td></tr>
          <tr><td class="py-1.5 px-3 font-mono text-neutral-400">7</td><td class="py-1.5 px-3 font-medium">Galaxolide 50% IPM</td><td class="py-1.5 px-3 font-mono">1222-05-5</td><td class="py-1.5 px-3">Aroma Chemical</td><td class="py-1.5 px-3 text-center font-mono">50% (IPM)</td><td class="py-1.5 px-3 text-right font-mono font-semibold">20.00</td><td class="py-1.5 px-3 text-right font-mono">2.00%</td></tr>
          <tr><td class="py-1.5 px-3 font-mono text-neutral-400">8</td><td class="py-1.5 px-3 font-medium">Perfumers Alcohol 96%</td><td class="py-1.5 px-3 font-mono">64-17-5</td><td class="py-1.5 px-3">Solvent / Carrier</td><td class="py-1.5 px-3 text-center font-mono">Pure (100%)</td><td class="py-1.5 px-3 text-right font-mono font-semibold">800.00</td><td class="py-1.5 px-3 text-right font-mono">80.00%</td></tr>
        </tbody>
        <tfoot>
          <tr class="bg-neutral-100 font-bold border-t border-neutral-300">
            <td colspan="5" class="py-2 px-3 text-right uppercase tracking-wider text-[11px]">Total Compounded Batch:</td>
            <td class="py-2 px-3 text-right font-mono">1000.00</td>
            <td class="py-2 px-3 text-right font-mono">100.00%</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Safety & Regulatory -->
    <div class="mb-8 rounded-lg border border-neutral-200 p-4 bg-neutral-50/50">
      <div class="flex items-center justify-between mb-1.5">
        <h3 class="text-xs font-bold uppercase tracking-wider text-neutral-900">
          IFRA Safety & Regulatory Compliance Validation
        </h3>
        <span class="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
          STATUS: COMPLIANT / PASS
        </span>
      </div>
      <p class="text-xs text-neutral-600 leading-relaxed">
        Automated toxicological and IFRA quantitative risk assessment (QRA) completed for <b>Fine Fragrance</b> in <b>Global IFRA</b> markets. All restricted photo-sensitizers and allergens remain within maximum permissible thresholds.
      </p>
    </div>

    <!-- Physical Signature Block -->
    <div class="border-t-2 border-neutral-900 pt-6">
      <h3 class="text-xs font-bold uppercase tracking-widest text-neutral-900 mb-6">
        Official Physical Authorization & Sign-Off
      </h3>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div>
          <div class="border-b-2 border-neutral-400 pb-1 h-14 flex items-end">
            <span class="text-[10px] text-neutral-300 select-none">Physical Signature</span>
          </div>
          <div class="space-y-0.5 text-xs mt-2">
            <span class="text-[10px] uppercase font-bold text-neutral-500 block">Formulating Perfumer</span>
            <p class="font-semibold text-neutral-900">Jean Carles</p>
            <p class="text-[11px] text-neutral-500 font-mono">Date: ____________________</p>
          </div>
        </div>

        <div>
          <div class="border-b-2 border-neutral-400 pb-1 h-14 flex items-end">
            <span class="text-[10px] text-neutral-300 select-none">Physical Signature</span>
          </div>
          <div class="space-y-0.5 text-xs mt-2">
            <span class="text-[10px] uppercase font-bold text-neutral-500 block">Regulatory & IFRA Compliance</span>
            <p class="font-semibold text-neutral-900">Compliance Director</p>
            <p class="text-[11px] text-neutral-500 font-mono">Date: ____________________</p>
          </div>
        </div>

        <div>
          <div class="border-b-2 border-neutral-400 pb-1 h-14 flex items-end">
            <span class="text-[10px] text-neutral-300 select-none">Physical Signature</span>
          </div>
          <div class="space-y-0.5 text-xs mt-2">
            <span class="text-[10px] uppercase font-bold text-neutral-500 block">Laboratory Director / Release</span>
            <p class="font-semibold text-neutral-900">Quality Assurance Officer</p>
            <p class="text-[11px] text-neutral-500 font-mono">Date: ____________________</p>
          </div>
        </div>
      </div>

      <div class="mt-8 pt-4 border-t border-neutral-200 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
        <span>Olfacta Laboratory Formulation Protocol &bull; Confidential & Proprietary</span>
        <span>Generated: September 09, 2026</span>
      </div>
    </div>
  </div>
</body>
</html>`;

const pdfScreenFile = path.join(designDir, '18-formula-approved-pdf.html');
fs.writeFileSync(pdfScreenFile, sampleHtml, 'utf8');
console.log('Successfully created 18-formula-approved-pdf.html');

// 4. Update index.html directory listing
const indexFile = path.join(designDir, 'index.html');
if (fs.existsSync(indexFile)) {
  let indexHtml = fs.readFileSync(indexFile, 'utf8');
  const screenCard = `
      <a href="18-formula-approved-pdf.html" class="block p-4 rounded-lg border border-neutral-200 bg-white hover:border-emerald-500 hover:shadow-md transition-all group no-underline">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-xs font-mono text-emerald-600 font-bold">SCREEN 18</span>
          <span class="text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">New</span>
        </div>
        <h3 class="text-sm font-bold text-neutral-900 group-hover:text-emerald-600 transition-colors">Approved Formula PDF Specification & Sign-Off</h3>
        <p class="text-xs text-neutral-500 mt-1">Master compounding SOP, formula guide, ingredient table, and physical authorization sign-off blocks.</p>
      </a>
  `;
  if (!indexHtml.includes('18-formula-approved-pdf.html')) {
    indexHtml = indexHtml.replace('</div>\n  </div>\n</body>', `${screenCard}\n    </div>\n  </div>\n</body>`);
    fs.writeFileSync(indexFile, indexHtml, 'utf8');
    console.log('Successfully updated design-html/index.html with Screen 18');
  }
}
