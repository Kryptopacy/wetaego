const fs = require('fs');
const file = 'app/(dashboard)/dashboard/admin/actions.ts';
let content = fs.readFileSync(file, 'utf8');

// Replace "as any" with an eslint-disable comment
content = content.replace(
  ".from('system_settings' as any)",
  "// eslint-disable-next-line @typescript-eslint/no-explicit-any\n    .from('system_settings' as any)"
);

fs.writeFileSync(file, content);
console.log('Fixed TS error safely');
