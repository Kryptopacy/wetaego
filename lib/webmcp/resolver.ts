/**
 * Unified Catalog Item Resolution Engine for WETAEGO
 * Polymorphically resolves catalog items, services, units, or appointments across all 6 verticals
 * by authoritative ID, slug, SKU, exact name, or multi-token fuzzy search.
 */

export interface ResolvableItem {
  id?: string
  itemId?: string
  name: string
  description?: string | null
  category?: string | null
  conceptSlug?: string | null
  [key: string]: any
}

export function resolveCatalogItem<T extends ResolvableItem>(
  items: T[],
  target: string | undefined | null
): T | undefined {
  if (!target || !items || items.length === 0) return undefined

  const raw = target.toString().trim()
  if (!raw) return undefined
  const rawLower = raw.toLowerCase()

  // 1. Authoritative direct ID match (exact case or lowercased)
  const byId = items.find(i => {
    const itemId = (i.id || i.itemId || '').toString()
    return itemId === raw || itemId.toLowerCase() === rawLower
  })
  if (byId) return byId

  // 2. Exact case-insensitive display name
  const byExactName = items.find(i => (i.name || '').toLowerCase() === rawLower)
  if (byExactName) return byExactName

  // 3. Normalized slug / SKU match (e.g. 'avocado-tartine' matches 'Avocado Tartine')
  const targetSlug = rawLower.replace(/[^a-z0-9]+/g, '-')
  const bySlug = items.find(i => {
    const slug = (i.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const sku = (i.sku || '').toString().toLowerCase()
    return slug === targetSlug || (sku && sku === rawLower)
  })
  if (bySlug) return bySlug

  // 4. Token match: all non-empty tokens in query appear in the item corpus
  const tokens = rawLower.split(/\s+/).filter(t => t.length > 1)
  if (tokens.length > 0) {
    const byTokens = items.find(i => {
      const corpus = [
        i.name,
        i.description,
        i.category,
        i.conceptSlug,
        i.brand,
        i.sku
      ].filter(Boolean).join(' ').toLowerCase()

      return tokens.every(token => corpus.includes(token))
    })
    if (byTokens) return byTokens
  }

  // 5. Partial substring match if query is at least 3 characters
  if (rawLower.length >= 3) {
    const bySubstring = items.find(i => (i.name || '').toLowerCase().includes(rawLower))
    if (bySubstring) return bySubstring
  }

  return undefined
}
