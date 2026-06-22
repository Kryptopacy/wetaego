const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

const targetDir = path.join(__dirname, 'app', 'm', '[slug]');

walkDir(targetDir, (filePath) => {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Remove eslint-disable lines
    content = content.replace(/\/\* eslint-disable.*?\*\/\n/g, '');
    // Remove FIXME developer bypassed lines
    content = content.replace(/\/\/ FIXME: Developer bypassed types\/rules.*?(\n|$)/g, '');

    // Fix the specific 'as any' in feedback-verify/actions.ts
    if (filePath.includes('feedback-verify') && filePath.includes('actions.ts')) {
      content = content.replace(`.eq('feedback_pin' as any, pin)`, `.eq('feedback_pin', pin)`);
    }

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Cleaned up:', filePath);
    }
  }
});
