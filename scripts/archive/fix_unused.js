const fs = require('fs');

function replaceInFile(filePath, replacements) {
    let content = fs.readFileSync(filePath, 'utf8');
    for (const [searchValue, replaceValue] of replacements) {
        content = content.replace(searchValue, replaceValue);
    }
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
}

const basePath = 'D:/pacy_labs/ourmenu/apps/web';

replaceInFile(`${basePath}/__tests__/active-orders-grid.test.tsx`, [
    ["import { Database } from '@/lib/supabase/types'\n// eslint-disable-next-line @typescript-eslint/no-unused-vars\nimport { formatCurrency } from '@/lib/utils/currency'", ""]
]);

replaceInFile(`${basePath}/app/(dashboard)/dashboard/bookings/page.tsx`, [
    ["import { cookies } from 'next/headers'\n  // eslint-disable-next-line @typescript-eslint/no-unused-vars\nimport Link from 'next/link'", ""]
]);

replaceInFile(`${basePath}/app/(dashboard)/dashboard/customers/page.tsx`, [
    ["import { ExternalLink } from 'lucide-react'", ""]
]);

replaceInFile(`${basePath}/app/(dashboard)/dashboard/orders/components/active-orders-grid.tsx`, [
    ["import { Database } from '@/lib/supabase/types'", ""]
]);

replaceInFile(`${basePath}/app/(dashboard)/dashboard/pages/[pageId]/edit/page.tsx`, [
    ["const { data: { user }, error: userError } = await supabase.auth.getUser()", "const { error: userError } = await supabase.auth.getUser()"]
]);

replaceInFile(`${basePath}/app/(dashboard)/dashboard/pages/build/[businessType]/page.tsx`, [
    ["const { data: { user }, error: userError } = await supabase.auth.getUser()", "const { error: userError } = await supabase.auth.getUser()"]
]);

replaceInFile(`${basePath}/app/(dashboard)/dashboard/properties/page.tsx`, [
    ["import { cookies } from 'next/headers'", ""]
]);

replaceInFile(`${basePath}/app/(dashboard)/dashboard/quotes/page.tsx`, [
    ["import { cookies } from 'next/headers'\n  // eslint-disable-next-line @typescript-eslint/no-unused-vars\nimport Link from 'next/link'", ""]
]);

replaceInFile(`${basePath}/app/(dashboard)/dashboard/settings/page.tsx`, [
    ["import { CurrencySelector } from '@/components/currency-selector'", ""]
]);

replaceInFile(`${basePath}/app/(dashboard)/dashboard/team-performance/page.tsx`, [
    ["const { data: { user }, error: userError } = await supabase.auth.getUser()", "const { error: userError } = await supabase.auth.getUser()"]
]);

console.log("All fixes applied!");
