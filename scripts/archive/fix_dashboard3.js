const fs = require('fs');
const path = require('path');

// 1. Fix layout.tsx
const layoutPath = path.join(__dirname, 'app', '(dashboard)', 'layout.tsx');
let layout = fs.readFileSync(layoutPath, 'utf8');
layout = layout.replace(/icon: Record<string, unknown>/g, 'icon: React.ElementType');
layout = layout.replace(`(member?.organizations as unknown as Record<string, unknown>)?.name`, `(member?.organizations as { name: string })?.name`);
layout = layout.replace(`(member.organizations as unknown as Record<string, unknown>).name`, `(member.organizations as { name: string }).name`);
layout = layout.replace(`(member?.organizations as unknown as Record<string, unknown>)?.id`, `(member?.organizations as { id: string })?.id`);
layout = layout.replace(`(l: Record<string, unknown>) => l.id ===`, `(l: { id: string }) => l.id ===`);
fs.writeFileSync(layoutPath, layout, 'utf8');

// 2. Fix notification-center.tsx
const notifPath = path.join(__dirname, 'app', '(dashboard)', 'notification-center.tsx');
let notif = fs.readFileSync(notifPath, 'utf8');
notif = notif.replace(`({ data }: Record<string, unknown>) =>`, `({ data }) =>`);
fs.writeFileSync(notifPath, notif, 'utf8');

// 3. Fix team-performance/page.tsx
const tpPath = path.join(__dirname, 'app', '(dashboard)', 'dashboard', 'team-performance', 'page.tsx');
let tp = fs.readFileSync(tpPath, 'utf8');
tp = tp.replace(`const orgId = (member?.organizations as unknown as Record<string, unknown>)?.id`, `const orgId = (member?.organizations as { id: string })?.id`);
tp = tp.replace(`const reviews: Record<string, unknown>[] = reviewsRaw || []`, `const reviews: { id: string; rating: number; review_text: string; created_at: string }[] = reviewsRaw || []`);
tp = tp.replace(`const ordersWithTips: Record<string, unknown>[] = ordersWithTipsRaw || []`, `const ordersWithTips: { id: string; tip_amount_minor: number; created_at: string }[] = ordersWithTipsRaw || []`);
fs.writeFileSync(tpPath, tp, 'utf8');

// 4. Fix team/page.tsx
const teamPagePath = path.join(__dirname, 'app', '(dashboard)', 'dashboard', 'settings', 'team', 'page.tsx');
let teamPage = fs.readFileSync(teamPagePath, 'utf8');
teamPage = teamPage.replace(`let members: Record<string, unknown>[] = []`, `let members: { user_id: string; email: string; role: string; created_at: string }[] = []`);
teamPage = teamPage.replace(`let invites: Record<string, unknown>[] = []`, `let invites: { id: string; email: string; role: string; token: string; expires_at: string }[] = []`);
fs.writeFileSync(teamPagePath, teamPage, 'utf8');

// 5. Fix qr/actions.ts
const qrActionsPath = path.join(__dirname, 'app', '(dashboard)', 'dashboard', 'settings', 'qr', 'actions.ts');
let qrActions = fs.readFileSync(qrActionsPath, 'utf8');
qrActions = qrActions.replace(`const updatePayload: Record<string, unknown> = {`, `const updatePayload: Record<string, any> = {`); // Using any here because it maps to Supabase update payload perfectly
fs.writeFileSync(qrActionsPath, qrActions, 'utf8');

console.log('Fixed dashboard specific strict types');
