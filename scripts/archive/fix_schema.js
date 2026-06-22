const fs = require('fs')

// 1. Revert actions.ts
let actionsContent = fs.readFileSync('app/(dashboard)/dashboard/settings/actions.ts', 'utf8')

actionsContent = actionsContent.replace(
`const organizationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  currency_code: z.string().min(3).max(3).default('NGN'),
})`,
`const organizationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
})`)

actionsContent = actionsContent.replace(
`    const rawData = {
      name: formData.get('name'),
      slug: formData.get('slug'),
      currency_code: formData.get('currency_code') || 'NGN',
    }`,
`    const rawData = {
      name: formData.get('name'),
      slug: formData.get('slug'),
    }`)

actionsContent = actionsContent.replace(
`        .update({ 
          name: validatedData.name, 
          slug: validatedData.slug,
          currency_code: validatedData.currency_code 
        })`,
`        .update({ name: validatedData.name, slug: validatedData.slug })`)

actionsContent = actionsContent.replace(
`          referred_by_affiliate_id: referredByAffiliateId,
          currency_code: validatedData.currency_code
        })`,
`          referred_by_affiliate_id: referredByAffiliateId
        })`)

// Now add currency_code to saveLocationInfoSettings
actionsContent = actionsContent.replace(
`const locationInfoSchema = z.object({
  locationId: z.string().uuid(),`,
`const locationInfoSchema = z.object({
  locationId: z.string().uuid(),
  currencyCode: z.string().min(3).max(3).optional(),`)

actionsContent = actionsContent.replace(
`      locationId,
      wifiNetwork: formData.get('wifiNetwork') || null,`,
`      locationId,
      currencyCode: formData.get('currency_code') || null,
      wifiNetwork: formData.get('wifiNetwork') || null,`)

actionsContent = actionsContent.replace(
`      .update({
        wifi_network: validatedData.wifiNetwork,`,
`      .update({
        currency_code: validatedData.currencyCode || undefined,
        wifi_network: validatedData.wifiNetwork,`)

fs.writeFileSync('app/(dashboard)/dashboard/settings/actions.ts', actionsContent)


// 2. Fix page.tsx: Move CurrencySelector to Location Info tab
let pageContent = fs.readFileSync('app/(dashboard)/dashboard/settings/page.tsx', 'utf8')

// Remove it from the general form
pageContent = pageContent.replace(
`            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">Default Currency</label>
              <CurrencySelector defaultValue={organization?.currency_code || 'NGN'} />
              <p className="mt-1 text-xs text-zinc-500">This currency will be used across your venues and reports.</p>
            </div>`,
``)

// Insert it into the Venue Information form, right under the AI Cover Studio / form tag
pageContent = pageContent.replace(
`<form action={saveLocationInfoSettings} className="flex flex-col gap-4">
              <input type="hidden" name="locationId" value={location.id} />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">`,
`<form action={saveLocationInfoSettings} className="flex flex-col gap-4">
              <input type="hidden" name="locationId" value={location.id} />
              
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">Default Currency</label>
                <CurrencySelector defaultValue={location.currency_code || 'NGN'} />
                <p className="mt-1 text-xs text-zinc-500">This currency determines how prices are displayed for this venue.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">`)

fs.writeFileSync('app/(dashboard)/dashboard/settings/page.tsx', pageContent)

console.log('Fixed actions.ts and page.tsx')
