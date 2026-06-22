const fs = require('fs');
const file = 'app/(dashboard)/dashboard/settings/qr/actions.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "const updatePayload: unknown = {}",
  "// eslint-disable-next-line @typescript-eslint/no-explicit-any\n  const updatePayload: any = {}"
).replace(
  "let updatePayload: unknown = {}",
  "// eslint-disable-next-line @typescript-eslint/no-explicit-any\n  let updatePayload: any = {}"
);

fs.writeFileSync(file, content);
console.log('Fixed settings/qr/actions TS error');
