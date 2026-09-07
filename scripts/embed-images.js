const fs = require('fs');
const path = require('path');

const imgPath = path.join(process.cwd(), 'public', 'images', 'perfume-auth-hero.jpg');
const imgBase64 = fs.readFileSync(imgPath).toString('base64');
const dataUri = `data:image/jpeg;base64,${imgBase64}`;

console.log('Image Base64 length:', dataUri.length);

const designDir = path.join(process.cwd(), 'design-html');
const files = fs.readdirSync(designDir).filter(f => f.endsWith('.html'));

for (const f of files) {
  const p = path.join(designDir, f);
  let html = fs.readFileSync(p, 'utf8');

  let updated = false;

  // Replace relative /images/perfume-auth-hero.jpg with base64 data URI
  if (html.includes('/images/perfume-auth-hero.jpg')) {
    html = html.replace(/\/images\/perfume-auth-hero\.jpg/g, dataUri);
    updated = true;
  }

  // Also replace next/image optimized URLs e.g. /_next/image?url=%2Fimages...
  if (html.includes('%2Fimages%2Fperfume-auth-hero.jpg')) {
    html = html.replace(/src="\/_next\/image\?[^"]*url=%2Fimages%2Fperfume-auth-hero\.jpg[^"]*"/g, `src="${dataUri}"`);
    updated = true;
  }

  // Also replace srcset references
  if (html.includes('srcset="/_next/image?url=%2Fimages%2Fperfume-auth-hero.jpg')) {
    html = html.replace(/srcset="\/_next\/image\?[^"]*"/g, `srcset="${dataUri} 1x"`);
    updated = true;
  }

  if (updated) {
    fs.writeFileSync(p, html, 'utf8');
    console.log(`Embedded base64 image into ${f} (size: ${html.length} bytes)`);
  }
}

console.log('Done! All hero images are now permanently embedded as base64 in the HTML.');
