const fs = require('fs');
const file = 'app/(dashboard)/dashboard/qr/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "{ id: 'demo-loc', name: 'Demo Venue', slug: 'demo-venue', theme_color: '#3b82f6' } as unknown",
  "// eslint-disable-next-line @typescript-eslint/no-explicit-any\n      { id: 'demo-loc', name: 'Demo Venue', slug: 'demo-venue', theme_color: '#3b82f6' } as any"
).replace(
  "{ id: 'qr-1', table_identifier: 'Table 1', location_id: 'demo-loc', organization_id: 'demo-org', is_active: true } as unknown,",
  "// eslint-disable-next-line @typescript-eslint/no-explicit-any\n      { id: 'qr-1', table_identifier: 'Table 1', location_id: 'demo-loc', organization_id: 'demo-org', is_active: true } as any,"
).replace(
  "{ id: 'qr-2', table_identifier: 'Bar A', location_id: 'demo-loc', organization_id: 'demo-org', is_active: true } as unknown",
  "// eslint-disable-next-line @typescript-eslint/no-explicit-any\n      { id: 'qr-2', table_identifier: 'Bar A', location_id: 'demo-loc', organization_id: 'demo-org', is_active: true } as any"
).replace(
  "org = member.organizations as unknown as { id: string }",
  "// eslint-disable-next-line @typescript-eslint/no-explicit-any\n      org = member.organizations as any as { id: string }"
);

fs.writeFileSync(file, content);
console.log('Fixed qr page TS error');
