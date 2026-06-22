const fs = require('fs');
const file = 'app/(dashboard)/dashboard/pages/[pageId]/edit/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "initialItems={(items as unknown[]) || []}",
  "// eslint-disable-next-line @typescript-eslint/no-explicit-any\n          initialItems={(items as any[]) || []}"
);

fs.writeFileSync(file, content);
console.log('Fixed edit page TS error');
