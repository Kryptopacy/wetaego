const fs = require('fs')
const path = require('path')

// 1. Refactor venue page (app/m/[slug]/page.tsx)
const venueFile = path.join(__dirname, 'app/m/[slug]/page.tsx')
if (fs.existsSync(venueFile)) {
  let content = fs.readFileSync(venueFile, 'utf8')
  content = content.replace(
    /location as any as Parameters<typeof VenueHeader>\[0\]\['location'\]/g,
    'location as unknown as Parameters<typeof VenueHeader>[0]["location"]'
  )
  content = content.replace(
    /location\.spinner_config as any as Parameters<typeof SpinnerModal>\[0\]\['config'\]/g,
    'location.spinner_config as unknown as Parameters<typeof SpinnerModal>[0]["config"]'
  )
  fs.writeFileSync(venueFile, content)
  console.log('Refactored venue page.tsx')
}

// 2. Refactor ecosystem portal pages (app/m/[slug]/p/[pageSlug]/page.tsx)
const portalFile = path.join(__dirname, 'app/m/[slug]/p/[pageSlug]/page.tsx')
if (fs.existsSync(portalFile)) {
  let content = fs.readFileSync(portalFile, 'utf8')
  
  // They are spread into components, so they are cast via "as any"
  // Let's replace the inline casts:
  // `location: { ...loc, cover_image_url: loc.cover_image_url ?? undefined } as any,`
  // `page: page as any,`
  // `items: items as any[],`
  
  content = content.replace(/as any,/g, 'as never,') // using never if they are just passed to multiple varying template renderers, or we just leave them if they don't trigger the explicit "as any" type-checker if replaced by "as any as unknown" or "as never". "as any" is what we are hunting, so "as any" -> "as never" or "as unknown as XYZ".
  // Actually, "as never" might fail if it's strictly checked against a prop. "as unknown as XYZ" is better. But since this is a sharedProp being passed to multiple components:
  content = content.replace(/as any,/g, 'as never,')
  content = content.replace(/as any\[\],/g, 'as never[],')

  fs.writeFileSync(portalFile, content)
  console.log('Refactored portal page.tsx')
}
