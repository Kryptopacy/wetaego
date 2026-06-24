const fs = require('fs');
const files = [
  'apps/web/app/(dashboard)/dashboard/settings/actions.ts',
  'apps/web/app/(dashboard)/dashboard/settings/payment-actions.ts',
  'apps/web/app/login/actions.ts'
];
for (const f of files) {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/return \{ error:\s* \}/g, "return { error: 'Unknown error' }");
  fs.writeFileSync(f, c);
}
console.log('Fixed empty errors');
