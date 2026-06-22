const fs = require('fs');
const path = require('path');

// 1. admin/actions.ts
const adminActionsPath = path.join(__dirname, 'app', '(dashboard)', 'dashboard', 'admin', 'actions.ts');
let adminActions = fs.readFileSync(adminActionsPath, 'utf8');
adminActions = adminActions.replace(/\.from\('system_settings' as unknown as Record<string, unknown>\)/g, `.from('system_settings' as any)`);
fs.writeFileSync(adminActionsPath, adminActions, 'utf8');

// 2. admin/tenant-directory.tsx
const tenantDirPath = path.join(__dirname, 'app', '(dashboard)', 'dashboard', 'admin', 'tenant-directory.tsx');
let tenantDir = fs.readFileSync(tenantDirPath, 'utf8');
tenantDir = tenantDir.replace(/organizations: Record<string, unknown>\[\]/g, `organizations: { id: string; name: string; subscription_plan: string; subscription_status: string; purchased_credits: number; slug: string; settings: any; created_at: string }[]`);
tenantDir = tenantDir.replace(/org\.id as string/g, `org.id`);
tenantDir = tenantDir.replace(/org\.name as string/g, `org.name`);
tenantDir = tenantDir.replace(/org\.slug as string/g, `org.slug`);
tenantDir = tenantDir.replace(/\(org\.settings as \{ theme_color\?: string \}\)\?\.theme_color/g, `org.settings?.theme_color`);
tenantDir = tenantDir.replace(/org\.created_at as string/g, `org.created_at`);
fs.writeFileSync(tenantDirPath, tenantDir, 'utf8');

// 3. billing/verify/page.tsx
const billingVerifyPath = path.join(__dirname, 'app', '(dashboard)', 'dashboard', 'billing', 'verify', 'page.tsx');
let billingVerify = fs.readFileSync(billingVerifyPath, 'utf8');
billingVerify = billingVerify.replace(/const updateData: Record<string, unknown> = \{ subscription_status: 'active' \}/g, `const updateData: any = { subscription_status: 'active' }`);
fs.writeFileSync(billingVerifyPath, billingVerify, 'utf8');

// 4. bookings/actions.ts
const bookingsActionsPath = path.join(__dirname, 'app', '(dashboard)', 'dashboard', 'bookings', 'actions.ts');
let bookingsActions = fs.readFileSync(bookingsActionsPath, 'utf8');
bookingsActions = bookingsActions.replace(/\.from\('bookings' as unknown as Record<string, unknown>\)/g, `.from('bookings' as any)`);
fs.writeFileSync(bookingsActionsPath, bookingsActions, 'utf8');

// 5. settings/team/page.tsx
const teamPagePath = path.join(__dirname, 'app', '(dashboard)', 'dashboard', 'settings', 'team', 'page.tsx');
let teamPage = fs.readFileSync(teamPagePath, 'utf8');
teamPage = teamPage.replace(/members = rawMembers/g, `members = (rawMembers || []).map(m => ({ user_id: m.user_id || '', email: m.email || '', role: (m.role as any) || 'viewer', created_at: m.created_at || '' }))`);
fs.writeFileSync(teamPagePath, teamPage, 'utf8');

console.log('Fixed absolute final dashboard TS errors');
