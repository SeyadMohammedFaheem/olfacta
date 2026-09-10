const fs = require('fs');
const path = require('path');

const designDir = path.join(process.cwd(), 'design-html');

// List of all screen html files except index.html and all-screens.html
const screenFiles = fs.readdirSync(designDir).filter(f => f.endsWith('.html') && f !== 'index.html' && f !== 'all-screens.html');

console.log('Found screen files:', screenFiles.length);

// 1. Update Global Top Bar & Sidebar Search triggers across all screen files
for (const file of screenFiles) {
  const filePath = path.join(designDir, file);
  let html = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Sidebar search button: "Find" with "F" kbd -> "Search..." with "/" kbd
  if (html.includes('<span class="text-[13px]">Find</span></span><kbd class="px-1.5 py-0.5 text-[10px] font-mono font-medium rounded border border-neutral-200 bg-neutral-50 text-neutral-400 group-hover:text-neutral-600">F</kbd>')) {
    html = html.replace(
      '<span class="text-[13px]">Find</span></span><kbd class="px-1.5 py-0.5 text-[10px] font-mono font-medium rounded border border-neutral-200 bg-neutral-50 text-neutral-400 group-hover:text-neutral-600">F</kbd>',
      '<span class="text-[13px]">Search...</span></span><kbd class="px-2 py-0.5 text-[11px] font-mono font-medium rounded border border-neutral-200 bg-neutral-50 text-neutral-400 group-hover:text-neutral-600">/</kbd>'
    );
    changed = true;
  }

  // Top bar search button: "Ctrl+K" kbd -> "/" kbd
  if (html.includes('<kbd class="pointer-events-none rounded border bg-background px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">Ctrl+K</kbd>')) {
    html = html.replace(
      '<kbd class="pointer-events-none rounded border bg-background px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">Ctrl+K</kbd>',
      '<kbd class="pointer-events-none rounded border bg-background px-2 py-0.5 font-mono text-[11px] font-medium text-muted-foreground">/</kbd>'
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`Updated shortcuts in ${file}`);
  }
}

// 2. Specific updates for 13-formula-workspace-detail.html
const workspaceFile = path.join(designDir, '13-formula-workspace-detail.html');
let wsHtml = fs.readFileSync(workspaceFile, 'utf8');

// (a) Save button vs Saved indicator:
// The user rule: ONLY KEEP SAVED IF ITS ALREADY SAVED, ONLY KEEP SAVE IF NOT SAVED ALREADY.
// In the static showcase, the formula is saved. So only keep the Saved text indicator, remove redundant Save button.
const oldSaveSegmentRegex = /<span class="text-xs text-muted-foreground mr-1">Saved<\/span><button[^>]*>[\s\S]*?lucide-save[\s\S]*?Save<\/button>/;
if (oldSaveSegmentRegex.test(wsHtml)) {
  wsHtml = wsHtml.replace(oldSaveSegmentRegex, '<span class="text-xs text-muted-foreground font-medium px-2 py-1">Saved</span>');
  console.log('Updated Save / Saved status in 13-formula-workspace-detail.html');
}

// (b) Formula Settings button label: "Formula Settings & Danger Zone" -> "Formula Settings"
wsHtml = wsHtml.replace(' Formula Settings &amp; Danger Zone</button>', ' Formula Settings</button>');
wsHtml = wsHtml.replace(' Formula Settings & Danger Zone</button>', ' Formula Settings</button>');

// (c) Base Carrier Needed stat block: add "Auto-fill solvent" quick action
const oldCarrierSnippet = '<span class="text-[11px] text-muted-foreground block">Base Carrier Needed</span><span class="font-semibold text-foreground">800<!-- --> g (<!-- -->80<!-- -->%)</span>';
const newCarrierSnippet = '<div class="flex items-center justify-between gap-2"><span class="text-[11px] text-muted-foreground block">Base Carrier Needed</span><button type="button" class="text-[10px] text-primary hover:underline font-sans cursor-pointer" title="Auto-fill Perfumers Alcohol 96% to balance formula">Auto-fill solvent</button></div><span class="font-semibold text-foreground">800 g (80%)</span>';
if (wsHtml.includes(oldCarrierSnippet)) {
  wsHtml = wsHtml.replace(oldCarrierSnippet, newCarrierSnippet);
  console.log('Added Auto-fill solvent link to stats bar in 13-formula-workspace-detail.html');
}

// (d) Table row for Perfumers Alcohol 96%: add "Fill remainder: 800.00 g" button under/next to amount input
const oldPerfumersSnippetRegex = /<td class="px-4 py-2"><input type="number"[^>]*value="800"\s*\/?><\/td>/;
if (oldPerfumersSnippetRegex.test(wsHtml)) {
  wsHtml = wsHtml.replace(
    oldPerfumersSnippetRegex,
    `<td class="px-4 py-2">
      <div class="flex items-center gap-1.5">
        <div class="w-28">
          <input type="number" class="flex w-full rounded-md border border-input bg-transparent px-3 py-1 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 h-8 font-mono text-sm" step="0.01" min="0" placeholder="0.00" value="800"/>
        </div>
        <button type="button" class="text-[10px] font-mono text-primary bg-primary/10 hover:bg-primary/20 px-1.5 py-0.5 rounded border border-primary/20 transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap" title="Fill remaining batch balance: 800 g">
          <span>Fill remainder:</span>
          <span class="font-semibold">800.00 g</span>
        </button>
      </div>
    </td>`
  );
  console.log('Added Fill remainder button to Perfumers Alcohol in 13-formula-workspace-detail.html');
}

// (e) Filter by Market segmented tabs
const oldMarketBlockRegex = /<div class="flex flex-wrap gap-1\.5"><button type="button"[^>]*>All Markets[\s\S]*?<\/div><\/div><div class="p-4 space-y-2 border-b">/;
if (oldMarketBlockRegex.test(wsHtml)) {
  wsHtml = wsHtml.replace(
    oldMarketBlockRegex,
    `<div class="flex flex-wrap gap-1.5 p-1 bg-muted/40 rounded-lg border border-border/40">
      <button type="button" class="flex-1 min-w-[75px] inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer bg-card text-foreground font-semibold shadow-xs border border-border/80">
        <span>All Markets</span>
        <span class="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-normal bg-primary/10 text-primary font-bold">0</span>
      </button>
      <button type="button" class="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer text-muted-foreground hover:text-foreground hover:bg-card/50">
        <span>Global</span>
      </button>
    </div></div><div class="p-4 space-y-2 border-b">`
  );
  console.log('Updated Filter by Market segmented tabs in 13-formula-workspace-detail.html');
}

fs.writeFileSync(workspaceFile, wsHtml, 'utf8');
console.log('Successfully updated 13-formula-workspace-detail.html');

// 3. Specific updates for 15-ingredient-material-detail.html (Fix card grid spanning)
const materialDetailFile = path.join(designDir, '15-ingredient-material-detail.html');
if (fs.existsSync(materialDetailFile)) {
  let matHtml = fs.readFileSync(materialDetailFile, 'utf8');

  // Fix grid container: replace md:grid-cols-2 or older grid classes with grid grid-cols-12 gap-6
  matHtml = matHtml.replace('<div class="grid gap-6 md:grid-cols-2">', '<div class="grid grid-cols-12 gap-6">');

  // Fix each card in this grid to have col-span-12 lg:col-span-6 so they don't crush into 1 column or shrink
  // Card 1: Chemical & Physical Identity
  matHtml = matHtml.replace(
    '<div class="rounded-lg border bg-card text-card-foreground"><div class="flex flex-col space-y-1.5 p-5 pb-3 border-b bg-muted/20"><div class="tracking-tight text-sm font-semibold flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-flask-conical',
    '<div class="col-span-12 lg:col-span-6 rounded-lg border bg-card text-card-foreground"><div class="flex flex-col space-y-1.5 p-5 pb-3 border-b bg-muted/20"><div class="tracking-tight text-sm font-semibold flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-flask-conical'
  );

  // Card 2: Safety & Regulatory Rules
  matHtml = matHtml.replace(
    '<div class="rounded-lg border bg-card text-card-foreground"><div class="flex flex-col space-y-1.5 p-5 pb-3 border-b bg-muted/20"><div class="tracking-tight text-sm font-semibold flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-check',
    '<div class="col-span-12 lg:col-span-6 rounded-lg border bg-card text-card-foreground"><div class="flex flex-col space-y-1.5 p-5 pb-3 border-b bg-muted/20"><div class="tracking-tight text-sm font-semibold flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-check'
  );

  // Card 3: Sourcing & Suppliers
  matHtml = matHtml.replace(
    '<div class="rounded-lg border bg-card text-card-foreground"><div class="flex flex-col space-y-1.5 p-5 pb-3 border-b bg-muted/20"><div class="tracking-tight text-sm font-semibold flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building2 lucide-building-2',
    '<div class="col-span-12 lg:col-span-6 rounded-lg border bg-card text-card-foreground"><div class="flex flex-col space-y-1.5 p-5 pb-3 border-b bg-muted/20"><div class="tracking-tight text-sm font-semibold flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building2 lucide-building-2'
  );

  // Card 4: Used in Formulas
  matHtml = matHtml.replace(
    '<div class="rounded-lg border bg-card text-card-foreground"><div class="flex flex-col space-y-1.5 p-5 pb-3 border-b bg-muted/20"><div class="tracking-tight text-sm font-semibold flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layers',
    '<div class="col-span-12 lg:col-span-6 rounded-lg border bg-card text-card-foreground"><div class="flex flex-col space-y-1.5 p-5 pb-3 border-b bg-muted/20"><div class="tracking-tight text-sm font-semibold flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layers'
  );

  fs.writeFileSync(materialDetailFile, matHtml, 'utf8');
  console.log('Successfully updated 15-ingredient-material-detail.html grid layout');
}

// 4. Update Dashboard Overview screen button: "Create New Formula" to outline styling
const dashFile = path.join(designDir, '03-dashboard.html');
if (fs.existsSync(dashFile)) {
  let dashHtml = fs.readFileSync(dashFile, 'utf8');
  const oldDashBtn = 'class="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 h-8 rounded-md px-3 text-xs" href="/formulas/new"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus mr-1.5 h-4 w-4"';
  const newDashBtn = 'class="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 cursor-pointer border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 rounded-md px-3 text-xs" href="/formulas/new"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus mr-1.5 h-3.5 w-3.5"';
  
  if (dashHtml.includes(oldDashBtn)) {
    dashHtml = dashHtml.replace(oldDashBtn, newDashBtn);
    fs.writeFileSync(dashFile, dashHtml, 'utf8');
    console.log('Successfully updated 03-dashboard.html button styling to outline');
  }
}

// 5. Update all-screens.html master catalog
const allScreensFile = path.join(designDir, 'all-screens.html');
if (fs.existsSync(allScreensFile)) {
  let allHtml = fs.readFileSync(allScreensFile, 'utf8');
  const oldDashBtn = 'class="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 h-8 rounded-md px-3 text-xs" href="/formulas/new"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus mr-1.5 h-4 w-4"';
  const newDashBtn = 'class="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 cursor-pointer border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 rounded-md px-3 text-xs" href="/formulas/new"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus mr-1.5 h-3.5 w-3.5"';
  
  if (allHtml.includes(oldDashBtn)) {
    allHtml = allHtml.replace(oldDashBtn, newDashBtn);
    fs.writeFileSync(allScreensFile, allHtml, 'utf8');
    console.log('Successfully updated all-screens.html button styling to outline');
  }
}

