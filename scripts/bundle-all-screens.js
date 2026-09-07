const fs = require('fs');
const path = require('path');

const designDir = path.join(process.cwd(), 'design-html');

const dashboardHtml = fs.readFileSync(path.join(designDir, '03-dashboard.html'), 'utf8');
const styleMatch = dashboardHtml.match(/<style>([\s\S]*?)<\/style>/);
const css = styleMatch ? styleMatch[1] : '';

const screens = [
  { id: 'screen-01-login', title: '01. Sign In (50/50 Split)', file: '01-login.html' },
  { id: 'screen-02-signup', title: '02. Sign Up (50/50 Split)', file: '02-signup.html' },
  { id: 'screen-03-dashboard', title: '03. Laboratory Dashboard Overview', file: '03-dashboard.html' },
  { id: 'screen-04-formulas', title: '04. Formulas Listing & Status Pipeline', file: '04-formulas-list.html' },
  { id: 'screen-05-formula-new', title: '05. Create New Perfume Formula Wizard', file: '05-formula-new.html' },
  { id: 'screen-06-ingredients', title: '06. Raw Materials & Oil Collection', file: '06-ingredients-materials.html' },
  { id: 'screen-07-ingredient-new', title: '07. New Material Registration', file: '07-ingredient-new.html' },
  { id: 'screen-08-compliance', title: '08. Regulatory Compliance Engine (IFRA / EU)', file: '08-compliance-engine.html' },
  { id: 'screen-09-batches', title: '09. Compounding & Production Batches', file: '09-batches-production.html' },
  { id: 'screen-10-batch-scale', title: '10. Scale Production Batch Workflow', file: '10-batch-scale-new.html' },
  { id: 'screen-11-reports', title: '11. Laboratory Reports & Formulation Costing', file: '11-reports-analytics.html' },
  { id: 'screen-12-settings', title: '12. Team Roles & Access Control (Main Admin vs Contributor)', file: '12-settings-team-roles.html' },
  { id: 'screen-13-workspace', title: '13. Live Formulation Workspace (Olfactive Pyramid & Dosage)', file: '13-formula-workspace-detail.html' },
  { id: 'screen-14-compare', title: '14. Formula Version Comparison & Diff Matrix', file: '14-formula-version-compare.html' },
  { id: 'screen-15-material-detail', title: '15. Raw Material Detail & Chemical Specifications', file: '15-ingredient-material-detail.html' },
  { id: 'screen-16-batch-detail', title: '16. Batch Manufacturing Record & Dispensing Log', file: '16-batch-manufacturing-detail.html' },
  { id: 'screen-17-invite', title: '17. Contributor Onboarding & Invite Acceptance', file: '17-invite-accept.html' },
];

let bodySections = '';
let navItems = '';

for (const s of screens) {
  const filePath = path.join(designDir, s.file);
  if (!fs.existsSync(filePath)) continue;

  let raw = fs.readFileSync(filePath, 'utf8');

  // Strip <style> block from inner files since master stylesheet includes it
  raw = raw.replace(/<style[\s\S]*?<\/style>/gi, '');

  // Extract content between <body...> and </body>
  const bodyMatch = raw.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let innerBody = bodyMatch ? bodyMatch[1] : raw;

  // Clean out script tags
  innerBody = innerBody.replace(/<script[\s\S]*?<\/script>/gi, '');

  navItems += `
    <a href="#${s.id}" class="px-3 py-1 rounded-md bg-[#151d2f] border border-[#23304c] text-slate-400 text-xs font-medium no-underline whitespace-nowrap transition-colors hover:text-white hover:bg-slate-800 hover:border-sky-500">
      <span>${s.title}</span>
    </a>
  `;

  bodySections += `
    <section id="${s.id}" class="scroll-mt-20 flex flex-col gap-4">
      <div class="flex items-center justify-between px-1">
        <div>
          <span class="inline-block text-[10px] font-bold tracking-widest uppercase text-sky-400">Olfacta Screen &bull; PRD Artboard</span>
          <h2 class="m-0 text-lg font-bold text-white tracking-tight">${s.title}</h2>
        </div>
        <a href="${s.file}" target="_blank" class="text-xs font-semibold text-slate-400 no-underline px-3 py-1.5 rounded-md border border-[#23304c] bg-[#111827] hover:text-white hover:border-slate-600 transition-colors">
          Open Standalone &nearr;
        </a>
      </div>
      <div class="bg-white border border-[#1f293d] rounded-xl overflow-hidden min-h-[700px] relative shadow-2xl">
        ${innerBody}
      </div>
    </section>
  `;
}

const masterHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Olfacta — Complete PRD Design Screens (All 17 Screens)</title>
  <style>
  ${css}
  </style>
</head>
<body class="bg-[#090d16] text-slate-900 m-0 p-0 antialiased font-sans">
  <header class="sticky top-0 z-[99999] bg-[#090d16]/95 backdrop-blur-md border-b border-[#1f293d] px-6 py-3 flex items-center justify-between gap-4">
    <div class="text-sm font-extrabold tracking-widest text-white uppercase flex items-center gap-2 shrink-0">
      <span>OLFACTA</span>
      <span class="text-[11px] font-normal text-slate-400 tracking-normal normal-case">All 17 PRD Artboards</span>
    </div>
    <nav class="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
      ${navItems}
    </nav>
  </header>

  <main class="max-w-[1560px] mx-auto px-6 py-10 pb-28 flex flex-col gap-20">
    ${bodySections}
  </main>
</body>
</html>
`;

fs.writeFileSync(path.join(designDir, 'all-screens.html'), masterHtml, 'utf8');
console.log('Successfully re-generated all-screens.html with pure Tailwind CSS classes! Size:', masterHtml.length);
