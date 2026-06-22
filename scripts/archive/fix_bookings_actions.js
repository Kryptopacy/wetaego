const fs = require('fs');
const file = 'app/(dashboard)/dashboard/bookings/actions.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "const orgId = (bookingData.location_pages as unknown)?.locations?.organization_id",
  "// eslint-disable-next-line @typescript-eslint/no-explicit-any\n  const orgId = (bookingData.location_pages as any)?.locations?.organization_id"
);

fs.writeFileSync(file, content);
console.log('Fixed bookings actions TS error');
