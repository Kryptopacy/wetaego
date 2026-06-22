const fs = require('fs');
const path = require('path');

// 1. admin/actions.ts
const adminActionsPath = path.join(__dirname, 'app', '(dashboard)', 'dashboard', 'admin', 'actions.ts');
let adminActions = fs.readFileSync(adminActionsPath, 'utf8');
adminActions = adminActions.replace(/\.from\('organization_settings' as unknown as Record<string, unknown>\)/g, `.from('organization_settings')`);
adminActions = adminActions.replace(/value: Record<string, unknown>/g, `value: any`);
fs.writeFileSync(adminActionsPath, adminActions, 'utf8');

// 2. admin/tenant-directory.tsx
const tenantDirPath = path.join(__dirname, 'app', '(dashboard)', 'dashboard', 'admin', 'tenant-directory.tsx');
let tenantDir = fs.readFileSync(tenantDirPath, 'utf8');
tenantDir = tenantDir.replace(/key=\{org\.id\}/g, `key={org.id as string}`);
tenantDir = tenantDir.replace(/\{org\.name\}/g, `{org.name as string}`);
tenantDir = tenantDir.replace(/\{org\.slug\}/g, `{org.slug as string}`);
tenantDir = tenantDir.replace(/\{org\.settings\.theme_color \|\| 'none'\}/g, `{(org.settings as { theme_color?: string })?.theme_color || 'none'}`);
tenantDir = tenantDir.replace(/\{new Date\(org\.created_at\)\.toLocaleDateString\(\)\}/g, `{new Date(org.created_at as string).toLocaleDateString()}`);
fs.writeFileSync(tenantDirPath, tenantDir, 'utf8');

// 3. billing/verify/page.tsx
const billingVerifyPath = path.join(__dirname, 'app', '(dashboard)', 'dashboard', 'billing', 'verify', 'page.tsx');
let billingVerify = fs.readFileSync(billingVerifyPath, 'utf8');
billingVerify = billingVerify.replace(/as unknown as Record<string, unknown>/g, `as any`);
fs.writeFileSync(billingVerifyPath, billingVerify, 'utf8');

// 4. bookings/actions.ts
const bookingsActionsPath = path.join(__dirname, 'app', '(dashboard)', 'dashboard', 'bookings', 'actions.ts');
let bookingsActions = fs.readFileSync(bookingsActionsPath, 'utf8');
bookingsActions = bookingsActions.replace(/\.from\('bookings' as unknown as Record<string, unknown>\)/g, `.from('bookings')`);
fs.writeFileSync(bookingsActionsPath, bookingsActions, 'utf8');

// 5. settings/team/page.tsx
const teamPagePath = path.join(__dirname, 'app', '(dashboard)', 'dashboard', 'settings', 'team', 'page.tsx');
let teamPage = fs.readFileSync(teamPagePath, 'utf8');
teamPage = teamPage.replace(/let members: \{ user_id: string \| null; email: string \| null; role: string \| null; created_at: string \| null \}\[\] = \[\]/g, `let members: { user_id: string; email: string; role: 'owner' | 'manager' | 'editor' | 'viewer'; created_at: string }[] = []`);
fs.writeFileSync(teamPagePath, teamPage, 'utf8');

// 6. team-performance/page.tsx
const tpPagePath = path.join(__dirname, 'app', '(dashboard)', 'dashboard', 'team-performance', 'page.tsx');
let tpPage = fs.readFileSync(tpPagePath, 'utf8');
tpPage = tpPage.replace(/o\.tip_amount_minor \/ 100/g, `(o.tip_amount_minor || 0) / 100`);
fs.writeFileSync(tpPagePath, tpPage, 'utf8');

console.log('Fixed final few errors');
