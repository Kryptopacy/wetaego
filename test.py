import re

with open('app/m/[slug]/page.tsx', 'r') as f:
    content = f.read()

start_marker = "    if (qrId) {"
end_marker = "  if (pageCount === 1 && locationPages) {"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    replacement = """  if (qrId) {
    const { data: qrCode } = await supabase
      .from('qr_codes')
      .select('table_identifier, destination_path, is_active')
      .eq('id', qrId)
      .eq('location_id', location.id)
      .single()

    if (!qrCode || !qrCode.is_active) {
      return <InvalidQrMessage />
    }

    if (qrCode.table_identifier) {
      tableIdentifier = qrCode.table_identifier
    }

    // If the QR code has a specific destination page, redirect directly to it
    const rootPath = `/m/${slug}`
    if (qrCode.destination_path && qrCode.destination_path !== rootPath) {
      const destWithQr = `${qrCode.destination_path}?qr_id=${qrId}`
      redirect(destWithQr)
    }
  }

  // 1.8 Fetch published location_pages for routing logic
  const fetchLocationPages = async () => {
    let query = supabase
      .from('location_pages')
      .select('id, slug, title, template_type, is_published')
      .eq('location_id', location.id)
      .order('created_at', { ascending: true })

    if (!isPreview) {
      query = query.eq('is_published', true)
    }

    const { data } = await query
    return data
  }
  
  const locationPages = isPreview
    ? await fetchLocationPages()
    : await unstable_cache(
        fetchLocationPages,
        [`location_pages_${location.id}`],
        { revalidate: 60, tags: [`location_pages_${location.id}`] }
      )()

  const pageCount = locationPages?.length ?? 0
  // ── Routing Decision Tree ───────────────────────────────────────────────────
  // 1 page  → redirect directly to it (e.g. a phone store with only one catalog)
  // >1 pages → render the Portal (becomes the business's branded landing page)
  // 0 pages → render empty state
  // ────────────────────────────────────────────────────────────────────────────

"""
    new_content = content[:start_idx] + replacement + content[end_idx:]
    with open('app/m/[slug]/page.tsx', 'w') as f:
        f.write(new_content)
    print("Fixed page.tsx!")
else:
    print("Markers not found!")
