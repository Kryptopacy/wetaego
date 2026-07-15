export function getConditionBadgeStyles(condition: string): string {
  const normalized = condition.toLowerCase().trim()
  
  if (normalized.includes('new')) {
    return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
  }
  if (normalized.includes('uk used') || normalized.includes('foreign used')) {
    return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  }
  if (normalized.includes('refurbished')) {
    return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
  }
  if (normalized.includes('custom') || normalized.includes('handmade')) {
    return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
  }
  
  // Default fallback for any other condition
  return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
}
