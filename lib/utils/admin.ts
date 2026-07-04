export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const adminEmails = (process.env.ADMIN_EMAIL || 'kryptopacy@gmail.com,pacy.labs@gmail.com')
    .split(',')
    .map(e => e.trim().toLowerCase())
  return adminEmails.includes(email.toLowerCase())
}
