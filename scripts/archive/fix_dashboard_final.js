const fs = require('fs');
const path = require('path');

// 1. orders/actions.ts
const ordersActionsPath = path.join(__dirname, 'app', '(dashboard)', 'dashboard', 'orders', 'actions.ts');
let ordersActions = fs.readFileSync(ordersActionsPath, 'utf8');
ordersActions = ordersActions.replace(/const orgName = \(order\.organizations as \{ name: string \}\)\?.name \|\| 'the restaurant'/g, `const orgName = (order.organizations as unknown as { name: string })?.name || 'the restaurant'`);
ordersActions = ordersActions.replace(/const orgSlug = \(order\.organizations as \{ slug: string \}\)\?.slug \|\| ''/g, `const orgSlug = (order.organizations as unknown as { slug: string })?.slug || ''`);
// Wait, the error was Type '{}' is not assignable to type 'string'. Where is that? line 48. Let's just fix it.
ordersActions = ordersActions.replace(/const orgName = \(order\.organizations as unknown as Record<string, unknown>\)\?\.name \|\| 'the restaurant'/g, `const orgName = (order.organizations as unknown as { name?: string })?.name || 'the restaurant'`);
ordersActions = ordersActions.replace(/const orgSlug = \(order\.organizations as unknown as Record<string, unknown>\)\?\.slug \|\| ''/g, `const orgSlug = (order.organizations as unknown as { slug?: string })?.slug || ''`);
fs.writeFileSync(ordersActionsPath, ordersActions, 'utf8');

// 2. orders/orders-client.tsx
const ordersClientPath = path.join(__dirname, 'app', '(dashboard)', 'dashboard', 'orders', 'orders-client.tsx');
let ordersClient = fs.readFileSync(ordersClientPath, 'utf8');
ordersClient = ordersClient.replace(/onClaimOrder=\{handleClaimOrder as unknown as Record<string, unknown>\}/g, 'onClaimOrder={handleClaimOrder}');
ordersClient = ordersClient.replace(/onToggleStock=\{toggleStock as unknown as Record<string, unknown>\}/g, 'onToggleStock={toggleStock}');
fs.writeFileSync(ordersClientPath, ordersClient, 'utf8');

// 3. pages/[pageId]/edit/page.tsx
const editPagePath = path.join(__dirname, 'app', '(dashboard)', 'dashboard', 'pages', '[pageId]', 'edit', 'page.tsx');
let editPage = fs.readFileSync(editPagePath, 'utf8');
editPage = editPage.replace(/\.from\('page_items' as unknown as Record<string, unknown>\)/g, `.from('page_items')`);
editPage = editPage.replace(/initialItems=\{\(items as unknown as Record<string, unknown>\[\]\) \|\| \[\]\}/g, `initialItems={(items as any[]) || []}`);
fs.writeFileSync(editPagePath, editPage, 'utf8');

// 4. pages/actions.ts & settings/qr/actions.ts (RejectExcessProperties)
const pagesActionsPath = path.join(__dirname, 'app', '(dashboard)', 'dashboard', 'pages', 'actions.ts');
let pagesActions = fs.readFileSync(pagesActionsPath, 'utf8');
pagesActions = pagesActions.replace(/const updatePayload: Record<string, unknown> = \{ title, subtitle/g, `const updatePayload: any = { title, subtitle`);
fs.writeFileSync(pagesActionsPath, pagesActions, 'utf8');

const qrActionsPath = path.join(__dirname, 'app', '(dashboard)', 'dashboard', 'settings', 'qr', 'actions.ts');
let qrActions = fs.readFileSync(qrActionsPath, 'utf8');
qrActions = qrActions.replace(/const updatePayload: Record<string, any> = \{/g, `const updatePayload: any = {`);
// Oh, it was already any but the error said `Record<string, any> is not assignable to RejectExcessProperties`. So just use `any`. Let's actually cast it inline if needed, or change it to `any`.
qrActions = qrActions.replace(/const updatePayload: Record<string, unknown> = \{/g, `const updatePayload: any = {`);
fs.writeFileSync(qrActionsPath, qrActions, 'utf8');

// 5. settings/team/page.tsx
const teamPagePath = path.join(__dirname, 'app', '(dashboard)', 'dashboard', 'settings', 'team', 'page.tsx');
let teamPage = fs.readFileSync(teamPagePath, 'utf8');
teamPage = teamPage.replace(/let members: \{ user_id: string; email: string; role: string; created_at: string \}\[\] = \[\]/g, `let members: { user_id: string | null; email: string | null; role: string | null; created_at: string | null }[] = []`);
fs.writeFileSync(teamPagePath, teamPage, 'utf8');

// 6. team-performance/page.tsx
const tpPagePath = path.join(__dirname, 'app', '(dashboard)', 'dashboard', 'team-performance', 'page.tsx');
let tpPage = fs.readFileSync(tpPagePath, 'utf8');
tpPage = tpPage.replace(/const reviews: \{ id: string; rating: number; review_text: string; created_at: string \}\[\] = reviewsRaw \|\| \[\]/g, `const reviews: { id: string; staff_id: string | null; staff_rating: number; staff_feedback: string | null; business_rating: number | null; business_feedback: string | null; created_at: string }[] = reviewsRaw as any || []`);
tpPage = tpPage.replace(/const ordersWithTips: \{ id: string; tip_amount_minor: number; created_at: string \}\[\] = ordersWithTipsRaw \|\| \[\]/g, `const ordersWithTips: { id: string; assigned_staff_id: string | null; tip_amount_minor: number | null; created_at: string }[] = ordersWithTipsRaw as any || []`);
fs.writeFileSync(tpPagePath, tpPage, 'utf8');

console.log('Fixed specific dashboard typescript errors');
