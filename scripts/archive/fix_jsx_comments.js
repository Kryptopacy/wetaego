const fs = require('fs');

const files = [
  'app/(dashboard)/dashboard/pages/[pageId]/edit/page.tsx',
  'app/(dashboard)/dashboard/settings/page.tsx',
  'app/(dashboard)/dashboard/team-performance/page.tsx',
  'app/components/share-modal.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  // Fix JSX comments
  content = content.replace(/^[ \t]*\/\/ eslint-disable-next-line react\/no-unescaped-entities/gm, (match) => {
    // Preserve leading whitespace
    const spaces = match.replace(/\/\/.*$/, '');
    return `${spaces}{/* eslint-disable-next-line react/no-unescaped-entities */}`;
  });
  
  if (file.includes('share-modal.tsx')) {
    content = content.replace(/, Mail/, '');
  }

  fs.writeFileSync(file, content);
}
console.log('Fixed JSX comments');
