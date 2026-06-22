const fs = require('fs');
const file = 'app/(dashboard)/dashboard/pages/actions.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "let updatePayload: unknown = {",
  "// eslint-disable-next-line @typescript-eslint/no-explicit-any\n  let updatePayload: any = {"
);

fs.writeFileSync(file, content);
console.log('Fixed pages/actions TS error');
