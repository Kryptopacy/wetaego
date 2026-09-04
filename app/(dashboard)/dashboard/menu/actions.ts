'use server'

import { revalidatePath } from 'next/cache'
import { purgeStorefrontCache } from '@/lib/cache-purger'
import { z } from 'zod'
import { zfd } from 'zod-form-data'
import { authActionClient } from '@/lib/safe-action'
import { createAdminClient } from '@/lib/supabase/server'
import { requireOrgRole, requirePageOwnership } from '@/lib/auth/org-guard'

export const createCategory = authActionClient
  .schema(zfd.formData({
    organization_id: zfd.text(z.string().min(1, "Organization ID is required")),
    page_id: zfd.text(z.string().min(1, "Page ID is required")),
    name: zfd.text(z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters")),
  }))
  .action(async ({ parsedInput: { organization_id, page_id, name }, ctx: { user, supabase } }) => {
    if (organization_id === 'demo-org') {
      revalidatePath('/dashboard/menu')
      return { success: true }
    }

    await requireOrgRole(supabase, user.id, organization_id, 'editor')
    await requirePageOwnership(supabase, user.id, page_id, 'editor')

    const adminClient = await createAdminClient()
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    const { error } = await adminClient.from('page_collections').insert({
      page_id,
      name,
      slug,
    })

    if (error) throw new Error('Failed to create category: ' + error.message)

    await purgeStorefrontCache(organization_id)
    revalidatePath('/dashboard/menu')
    return { success: true }
  })

const MAX_FILE_SIZE = 30 * 1024 * 1024 // 30MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']

export const createItem = authActionClient
  .schema(zfd.formData({
    organization_id: zfd.text(z.string().min(1)),
    page_id: zfd.text(z.string().min(1)),
    collection_ids: zfd.text(z.string().min(1)), // JSON array
    requires_booking: zfd.text(z.string().optional()),
    name: zfd.text(z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters")),
    price: zfd.numeric(z.number().positive("Price must be positive")),
    description: zfd.text(z.string().max(1000, "Description must be less than 1000 characters").optional()),
    dietary_tags: zfd.text(z.string().optional()),
    allergens: zfd.text(z.string().optional()),
    ai_image_url: zfd.text(z.string().url().optional().or(z.literal(''))),
    stock_count: zfd.numeric(z.number().nonnegative("Stock must be a non-negative number").optional()),
    department: zfd.text(z.string().optional()),
    image: z.instanceof(File).optional()
  }))
  .action(async ({ parsedInput, ctx: { user, supabase } }) => {
    const {
      organization_id: orgId,
      page_id: pageId,
      collection_ids: collectionIdsRaw,
      requires_booking,
      name,
      price,
      description,
      dietary_tags: dietaryTagsRaw,
      allergens: allergensRaw,
      ai_image_url: aiImageUrl,
      stock_count: stockCount,
      department,
      image
    } = parsedInput

    if (orgId === 'demo-org') {
      revalidatePath('/dashboard/menu')
      return { success: true }
    }

    await requireOrgRole(supabase, user.id, orgId, 'editor')
    await requirePageOwnership(supabase, user.id, pageId, 'editor')

    const collection_ids = JSON.parse(collectionIdsRaw)
    const dietary_tags = dietaryTagsRaw ? JSON.parse(dietaryTagsRaw) : []
    const allergen_tags = allergensRaw ? JSON.parse(allergensRaw) : []
    const is_booking_required = requires_booking === 'true'

    const images: string[] = []
    if (aiImageUrl) {
      images.push(aiImageUrl)
    }

    if (image && image.size > 0) {
      if (image.size > MAX_FILE_SIZE) {
        throw new Error('File must be less than 30MB')
      }
      if (!ACCEPTED_IMAGE_TYPES.includes(image.type)) {
        throw new Error('Invalid file format. Only JPEG, PNG, WebP, MP4, WebM, and MOV are accepted.')
      }

      const fileExt = image.name.split('.').pop()
      const fileName = `${orgId}-${Date.now()}.${fileExt}`
      
      const adminClient = await createAdminClient()
      const { data: uploadData, error: uploadError } = await adminClient.storage
        .from('menu-images')
        .upload(fileName, image)
        
      if (!uploadError && uploadData) {
        const { data: publicUrlData } = adminClient.storage.from('menu-images').getPublicUrl(fileName)
        images.push(publicUrlData.publicUrl)
      } else {
        throw new Error('Failed to upload image')
      }
    }

    const itemData = {
      dietary_tags,
      allergen_tags,
      stock_count: stockCount ?? null,
      department: department || null,
      requires_booking: is_booking_required
    }

    const adminClient = await createAdminClient()
    const { data: newItem, error } = await adminClient.from('page_items').insert({
      page_id: pageId,
      title: name,
      description: description || null,
      price_minor: Math.round(price * 100),
      images: images.length > 0 ? images : [],
      item_data: itemData
    }).select('id').single()

    if (error) throw new Error('Failed to create item: ' + error.message)

    if (newItem && collection_ids.length > 0) {
      const valid_collection_ids = collection_ids.filter((cid: string) => cid !== 'uncategorized')
      if (valid_collection_ids.length > 0) {
        const junctionInserts = valid_collection_ids.map((cid: string) => ({
          item_id: newItem.id,
          collection_id: cid
        }))
        await adminClient.from('page_item_collections').insert(junctionInserts)
      }
    }

    await purgeStorefrontCache(orgId)
    revalidatePath('/dashboard/menu')
    return { success: true }
  })

export const updateItem = authActionClient
  .schema(zfd.formData({
    item_id: zfd.text(z.string().min(1)),
    name: zfd.text(z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters")),
    price: zfd.numeric(z.number().positive("Price must be positive")),
    description: zfd.text(z.string().max(1000, "Description must be less than 1000 characters").optional()),
    ai_image_url: zfd.text(z.string().url().optional().or(z.literal(''))),
    stock_count: zfd.numeric(z.number().nonnegative("Stock must be a non-negative number").optional()),
    department: zfd.text(z.string().optional()),
    image: z.instanceof(File).optional()
  }))
  .action(async ({ parsedInput, ctx: { user, supabase } }) => {
    const {
      item_id: itemId,
      name,
      price,
      description,
      ai_image_url: aiImageUrl,
      stock_count: stockCount,
      department,
      image
    } = parsedInput

    const { data: item } = await supabase.from('page_items').select('*, location_pages!inner(location_id, locations!inner(organization_id))').eq('id', itemId).single()
    if (!item) throw new Error('Item not found')
    
    const locPages = item.location_pages as unknown as { locations: { organization_id: string } }
    const orgId = locPages.locations.organization_id

    await requireOrgRole(supabase, user.id, orgId, 'editor')

    if (orgId === 'demo-org') {
      revalidatePath('/dashboard/menu')
      return { success: true }
    }

    let images: string[] = Array.isArray(item.images) ? item.images : []
    
    if (aiImageUrl) {
      images = [aiImageUrl]
    }

    if (image && image.size > 0) {
      if (image.size > MAX_FILE_SIZE) {
        throw new Error('File must be less than 30MB')
      }
      if (!ACCEPTED_IMAGE_TYPES.includes(image.type)) {
        throw new Error('Invalid file format. Only JPEG, PNG, WebP, MP4, WebM, and MOV are accepted.')
      }

      const fileExt = image.name.split('.').pop()
      const fileName = `${orgId}-${Date.now()}.${fileExt}`
      
      const adminClient = await createAdminClient()
      const { data: uploadData, error: uploadError } = await adminClient.storage
        .from('menu-images')
        .upload(fileName, image)
        
      if (!uploadError && uploadData) {
        const { data: publicUrlData } = adminClient.storage.from('menu-images').getPublicUrl(fileName)
        images = [publicUrlData.publicUrl]
      }
    }

    const currentItemData = (item.item_data as Record<string, unknown>) || {}
    const updatedItemData = {
      ...currentItemData,
      stock_count: stockCount ?? null,
      department: department || null
    }

    const adminClient = await createAdminClient()
    const { error } = await adminClient.from('page_items').update({
      title: name,
      description: description || null,
      price_minor: Math.round(price * 100),
      images: images.length > 0 ? images : [],
      item_data: updatedItemData
    }).eq('id', itemId)

    if (error) throw new Error(error.message)

    if (orgId) await purgeStorefrontCache(orgId)
    revalidatePath('/dashboard/menu')
    return { success: true }
  })

export const deleteItem = authActionClient
  .schema(z.object({ itemId: z.string().min(1) }))
  .action(async ({ parsedInput: { itemId }, ctx: { user, supabase } }) => {
    const adminClient = await createAdminClient()
    const { data: item } = await adminClient.from('page_items').select('location_pages!inner(location_id, locations!inner(organization_id))').eq('id', itemId).single()
    if (!item) throw new Error('Item not found')
    
    const locPages = item.location_pages as unknown as { locations: { organization_id: string } }
    const orgId = locPages.locations.organization_id

    if (orgId === 'demo-org') {
      revalidatePath('/dashboard/menu')
      return { success: true }
    }

    await requireOrgRole(supabase, user.id, orgId, 'editor')

    const { error } = await adminClient.from('page_items').delete().eq('id', itemId)
    if (error) throw new Error(error.message)

    if (orgId) await purgeStorefrontCache(orgId)
    revalidatePath('/dashboard/menu')
    return { success: true }
  })

export const toggleItemStatus = authActionClient
  .schema(z.object({ itemId: z.string().min(1), currentStatus: z.string().min(1) }))
  .action(async ({ parsedInput: { itemId, currentStatus }, ctx: { user, supabase } }) => {
    const nextStatus = currentStatus === 'available' ? 'sold_out' : 'available'
    if (itemId.startsWith('item-')) {
      revalidatePath('/dashboard/menu')
      return { success: true }
    }

    const adminClient = await createAdminClient()
    const { data: item } = await adminClient.from('page_items').select('location_pages!inner(location_id, locations!inner(organization_id))').eq('id', itemId).single()
    if (!item) throw new Error('Item not found')

    const locPages = item.location_pages as unknown as { locations: { organization_id: string } }
    const orgId = locPages.locations.organization_id

    await requireOrgRole(supabase, user.id, orgId, 'editor')

    const { error } = await adminClient
      .from('page_items')
      .update({ availability_status: nextStatus })
      .eq('id', itemId)

    if (error) throw new Error(error.message)

    if (orgId) await purgeStorefrontCache(orgId)
    revalidatePath('/dashboard/menu')
    return { success: true }
  })

export const applyTranslations = authActionClient
  .schema(z.object({
    orgId: z.string().min(1),
    translatedCategories: z.array(z.object({
      id: z.string().min(1),
      name: z.string(),
      items: z.array(z.object({
        id: z.string().min(1),
        name: z.string(),
        description: z.string()
      }))
    }))
  }))
  .action(async ({ parsedInput: { orgId, translatedCategories }, ctx: { user, supabase } }) => {
    if (orgId === 'demo-org') {
      revalidatePath('/dashboard/menu')
      return { success: true }
    }

    await requireOrgRole(supabase, user.id, orgId, 'editor')

    const adminClient = await createAdminClient()

    for (const cat of translatedCategories) {
      if (!cat.id.startsWith('cat-')) {
        await adminClient.from('page_collections').update({ name: cat.name }).eq('id', cat.id)
      }
      for (const item of cat.items) {
        if (!item.id.startsWith('item-')) {
          await adminClient.from('page_items').update({ title: item.name, description: item.description }).eq('id', item.id)
        }
      }
    }

    await purgeStorefrontCache(orgId)
    revalidatePath('/dashboard/menu')
    return { success: true }
  })

export const bulkInsertMenu = authActionClient
  .schema(zfd.formData(z.any()))
  .action(async ({ parsedInput: formData, ctx: { user, supabase } }) => {
    const orgId = formData.get('organization_id') as string
    const pageId = formData.get('menu_id') as string // Reused as pageId
    const itemsRaw = formData.get('items') as string
    
    if (orgId === 'demo-org') {
      revalidatePath('/dashboard/menu')
      return { success: true }
    }

    await requireOrgRole(supabase, user.id, orgId, 'editor')
    await requirePageOwnership(supabase, user.id, pageId, 'editor')

    const adminClient = await createAdminClient()
    const items = JSON.parse(itemsRaw)

    // Group items by category name
    const categoryMap: Record<string, typeof items> = {}
    for (const item of items) {
      const cat = item.category || 'General'
      if (!categoryMap[cat]) categoryMap[cat] = []
      categoryMap[cat].push(item)
    }

    for (const [catName, catItems] of Object.entries(categoryMap)) {
      const slug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-')

      let collectionId: string
      const { data: existingCol } = await adminClient
        .from('page_collections')
        .select('id')
        .eq('page_id', pageId)
        .eq('slug', slug)
        .maybeSingle()

      if (existingCol) {
        collectionId = existingCol.id
      } else {
        const { data: newCol, error: colError } = await adminClient
          .from('page_collections')
          .insert({ page_id: pageId, name: catName, slug })
          .select('id')
          .single()

        if (colError || !newCol) continue
        collectionId = newCol.id
      }

      for (const item of catItems) {
        const { data: newItem, error: itemError } = await adminClient
          .from('page_items')
          .insert({
            page_id: pageId,
            title: item.name,
            description: item.description || null,
            price_minor: Math.round((item.price || 0) * 100),
            images: item.image_url ? [item.image_url] : []
          })
          .select('id')
          .single()

        if (!itemError && newItem) {
          await adminClient.from('page_item_collections').insert({
            item_id: newItem.id,
            collection_id: collectionId
          })
        }
      }
    }

    await purgeStorefrontCache(orgId)
    revalidatePath('/dashboard/menu')
    return { success: true }
  })
