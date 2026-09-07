const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'design-html', '14-formula-version-compare.html');
let content = fs.readFileSync(file, 'utf8');

const needle = 'Version Comparison:';
const endIdx = content.indexOf(needle);
if (endIdx !== -1) {
  const h1Idx = content.lastIndexOf('<h1', endIdx);
  const startIdx = content.lastIndexOf('<svg', h1Idx);
  if (startIdx !== -1 && h1Idx - startIdx < 600) {
    console.log('Found SVG between', startIdx, 'and', h1Idx);
    console.log('Snippet to cut:', content.substring(startIdx, h1Idx));
    content = content.substring(0, startIdx) + content.substring(h1Idx);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Successfully removed icon from 14-formula-version-compare.html');
  }
}
