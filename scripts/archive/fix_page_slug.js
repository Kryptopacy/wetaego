const fs = require('fs');
const file = 'app/m/[slug]/p/[pageSlug]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace standard variables casted to unknown back to any
content = content.replace(/const location = locationPage\.locations as unknown/g, "// eslint-disable-next-line @typescript-eslint/no-explicit-any\n  const location = locationPage.locations as any");
content = content.replace(/const page = locationPage as unknown/g, "// eslint-disable-next-line @typescript-eslint/no-explicit-any\n  const page = locationPage as any");
content = content.replace(/const items = pageItems as unknown\[\]/g, "// eslint-disable-next-line @typescript-eslint/no-explicit-any\n  const items = pageItems as any[]");
content = content.replace(/const items = pageItems as unknown/g, "// eslint-disable-next-line @typescript-eslint/no-explicit-any\n  const items = pageItems as any");
content = content.replace(/const location = locationPage\.locations\n\s*as unknown/g, "// eslint-disable-next-line @typescript-eslint/no-explicit-any\n  const location = locationPage.locations as any");

fs.writeFileSync(file, content);
console.log('Fixed pageSlug/page TS error');
