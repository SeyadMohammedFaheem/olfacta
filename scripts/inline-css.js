const http = require('http');
const fs = require('fs');
const path = require('path');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

async function main() {
  console.log('Fetching Next.js CSS stylesheet (97KB)...');
  const cssRes = await get('http://localhost:3000/_next/static/chunks/src_app_globals_162hn9o.css');
  
  if (cssRes.status !== 200 || !cssRes.body) {
    console.error('Failed to fetch CSS, status:', cssRes.status);
    return;
  }

  const css = cssRes.body;
  console.log('Successfully fetched CSS! Length:', css.length);

  const designDir = path.join(process.cwd(), 'design-html');
  const files = fs.readdirSync(designDir).filter(f => f.endsWith('.html') && f !== 'index.html');

  for (const f of files) {
    const filePath = path.join(designDir, f);
    let html = fs.readFileSync(filePath, 'utf8');

    // Remove any previous broken <style> block from previous run
    html = html.replace(/<style>\s*<\/style>/g, '');
    html = html.replace(/<link[^>]+stylesheet[^>]+>/gi, '');

    // Prepare complete standalone inline styles
    const fullStyleBlock = `
<style>
/* Inlined Full Olfacta Tailwind CSS Design System */
${css}

/* Standalone adjustments for local HTML viewing */
html, body {
  background-color: #ffffff;
  color: #0f172a;
  min-height: 100vh;
}
</style>
`;

    if (html.includes('</head>')) {
      html = html.replace('</head>', `${fullStyleBlock}\n</head>`);
    } else {
      html = fullStyleBlock + html;
    }

    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`Inlined CSS into ${f} (size: ${html.length} bytes)`);
  }

  console.log('Done! All HTML files now have self-contained styles.');
}

main().catch(console.error);
