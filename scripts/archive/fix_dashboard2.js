const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

const targetDir = path.join(__dirname, 'app', '(dashboard)');

walkDir(targetDir, (filePath) => {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    content = content.replace(/as unknown as never\)/g, 'as unknown as Record<string, unknown>)');
    content = content.replace(/as unknown as never\}/g, 'as unknown as Record<string, unknown>}');
    content = content.replace(/as unknown as never\]/g, 'as unknown as Record<string, unknown>]');
    content = content.replace(/as unknown as never /g, 'as unknown as Record<string, unknown> ');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed never cast:', filePath);
    }
  }
});
