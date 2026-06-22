const fs = require('fs')
const path = require('path')

const notifyFile = path.join(__dirname, 'app/(dashboard)/notification-center.tsx')
if (fs.existsSync(notifyFile)) {
  let content = fs.readFileSync(notifyFile, 'utf8')
  
  // Replace the `data as any as ...` casting with standard unknown assertions
  content = content.replace(
    /\(data as any as \{ location_pages\?: \{ locations\?: \{ organization_id\?: string \} \} \} \)\?\.location_pages\?\.locations\?\.organization_id/g,
    "(data as unknown as { location_pages?: { locations?: { organization_id?: string } } })?.location_pages?.locations?.organization_id"
  )

  // There is another one for the app badge cast
  content = content.replace(
    /\(navigator as any as \{ setAppBadge: \(v: number\) => Promise<void> \}\)\.setAppBadge/g,
    "(navigator as unknown as { setAppBadge: (v: number) => Promise<void> }).setAppBadge"
  )
  content = content.replace(
    /\(navigator as any as \{ clearAppBadge: \(\) => Promise<void> \}\)\.clearAppBadge/g,
    "(navigator as unknown as { clearAppBadge: () => Promise<void> }).clearAppBadge"
  )

  fs.writeFileSync(notifyFile, content)
  console.log('Refactored notification-center.tsx')
}
