'use server'

import { revalidatePath } from 'next/cache'
import { purgeStorefrontCache } from '@/lib/cache-purger'
import { z } from 'zod'
import { zfd } from 'zod-form-data'
import { authActionClient } from '@/lib/safe-action'

export const createCategory = authActionClient
  .schema(zfd.formData({
    organization_id: zfd.text(z.string().min(1, "Organization ID is required")),
    menu_id: zfd.text(z.string().min(1, "Menu ID is required")),
    name: zfd.text(z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters")),
  }))
  .action(async ({ parsedInput: { organization_id, menu_id, name }, ctx: { supabase } }) => {
    if (organization_id === 'demo-org') {
      revalidatePath('/dashboard/menu')
      return { success: true }
    }

    const { error } = await supabase.from('menu_categories').insert({
      organization_id,
      menu_id,
      name,
    })

    if (error) throw new Error(error.message)

    await purgeStorefrontCache(organization_id)
    revalidatePath('/dashboard/menu')
    return { success: true }
  })

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export const createItem = authActionClient
  .schema(zfd.formData({
    organization_id: zfd.text(z.string().min(1)),
    category_id: zfd.text(z.string().min(1)),
    name: zfd.text(z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters")),
    price: zfd.numeric(z.number().positive("Price must be positive")),
    description: zfd.text(z.string().max(1000, "Description must be less than 1000 characters").optional()),
    dietary_tags: zfd.text(z.string().optional()),
    allergens: zfd.text(z.string().optional()),
    ai_image_url: zfd.text(z.string().url().optional().or(z.literal(''))),
    stock_count: zfd.numeric(z.number().nonnegative("Stock must be a non-negative number").optional()),
    image: z.instanceof(File).optional()
  }))
  .action(async ({ parsedInput, ctx: { supabase } }) => {
    const {
      organization_id: orgId,
      category_id: categoryId,
      name,
      price,
      description,
      dietary_tags: dietaryTagsRaw,
      allergens: allergensRaw,
      ai_image_url: aiImageUrl,
      stock_count: stockCount,
      image
    } = parsedInput

    if (orgId === 'demo-org') {
      revalidatePath('/dashboard/menu')
      return { success: true }
    }

    const dietary_tags = dietaryTagsRaw ? JSON.parse(dietaryTagsRaw) : []
    const allergen_tags = allergensRaw ? JSON.parse(allergensRaw) : []

    let image_url = aiImageUrl || null

    if (image && image.size > 0) {
      if (image.size > MAX_FILE_SIZE) {
        throw new Error('Image must be less than 5MB')
      }
      if (!ACCEPTED_IMAGE_TYPES.includes(image.type)) {
        throw new Error('Invalid image format. Only JPEG, PNG, and WebP are accepted.')
      }

      const fileExt = image.name.split('.').pop()
      const fileName = `${orgId}-${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(fileName, image)
        
      if (!uploadError && uploadData) {
        const { data: publicUrlData } = supabase.storage.from('menu-images').getPublicUrl(fileName)
        image_url = publicUrlData.publicUrl
      } else {
        throw new Error('Failed to upload image')
      }
    }

    const { error } = await supabase.from('menu_items').insert({
      organization_id: orgId,
      category_id: categoryId,
      name,
      description: description || null,
      price_minor: Math.round(price * 100),
      image_url,
      dietary_tags,
      allergen_tags,
      stock_count: stockCount ?? null
    })

    if (error) throw new Error(error.message)

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
    image: z.instanceof(File).optional()
  }))
  .action(async ({ parsedInput, ctx: { supabase } }) => {
    const {
      item_id: itemId,
      name,
      price,
      description,
      ai_image_url: aiImageUrl,
      stock_count: stockCount,
      image
    } = parsedInput

    const { data: item } = await supabase.from('menu_items').select('organization_id').eq('id', itemId).single()
    if (!item) throw new Error('Item not found')
    
    if (item.organization_id === 'demo-org') {
      revalidatePath('/dashboard/menu')
      return { success: true }
    }

    let image_url = aiImageUrl || null

    if (image && image.size > 0) {
      if (image.size > MAX_FILE_SIZE) {
        throw new Error('Image must be less than 5MB')
      }
      if (!ACCEPTED_IMAGE_TYPES.includes(image.type)) {
        throw new Error('Invalid image format. Only JPEG, PNG, and WebP are accepted.')
      }

      const fileExt = image.name.split('.').pop()
      const fileName = `${item.organization_id}-${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(fileName, image)
        
      if (!uploadError && uploadData) {
        const { data: publicUrlData } = supabase.storage.from('menu-images').getPublicUrl(fileName)
        image_url = publicUrlData.publicUrl
      }
    }

    interface UpdatePayload {
      name: string
      description: string | null
      price_minor: number
      image_url?: string
      stock_count?: number | null
    }

    const updatePayload: UpdatePayload = {
      name,
      description: description || null,
      price_minor: Math.round(price * 100),
      stock_count: stockCount ?? null
    }
    
    if (image_url) {
      updatePayload.image_url = image_url
    }

    const { error } = await supabase.from('menu_items').update(updatePayload).eq('id', itemId)

    if (error) throw new Error(error.message)

    if (item) await purgeStorefrontCache(item.organization_id)
    revalidatePath('/dashboard/menu')
    return { success: true }
  })

export const deleteItem = authActionClient
  .schema(z.object({ itemId: z.string().min(1) }))
  .action(async ({ parsedInput: { itemId }, ctx: { supabase } }) => {
    const { data: item } = await supabase.from('menu_items').select('organization_id').eq('id', itemId).single()
    if (!item) throw new Error('Item not found')
    
    if (item.organization_id === 'demo-org') {
      revalidatePath('/dashboard/menu')
      return { success: true }
    }

    const { error } = await supabase.from('menu_items').delete().eq('id', itemId)
    if (error) throw new Error(error.message)

    if (item) await purgeStorefrontCache(item.organization_id)
    revalidatePath('/dashboard/menu')
    return { success: true }
  })

export const toggleItemStatus = authActionClient
  .schema(z.object({ itemId: z.string().min(1), currentStatus: z.string().min(1) }))
  .action(async ({ parsedInput: { itemId, currentStatus }, ctx: { supabase } }) => {
    const nextStatus = currentStatus === 'available' ? 'sold_out' : 'available'
    if (itemId.startsWith('item-')) {
      revalidatePath('/dashboard/menu')
      return { success: true }
    }

    const { data: item } = await supabase.from('menu_items').select('organization_id').eq('id', itemId).single()
    if (!item) throw new Error('Item not found')

    const { error } = await supabase
      .from('menu_items')
      .update({ availability_status: nextStatus })
      .eq('id', itemId)

    if (error) throw new Error(error.message)

    await purgeStorefrontCache(item.organization_id)
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
  .action(async ({ parsedInput: { orgId, translatedCategories }, ctx: { supabase } }) => {
    if (orgId === 'demo-org') {
      revalidatePath('/dashboard/menu')
      return { success: true }
    }

    for (const cat of translatedCategories) {
      if (!cat.id.startsWith('cat-')) {
        await supabase.from('menu_categories').update({ name: cat.name }).eq('id', cat.id).eq('organization_id', orgId)
      }
      for (const item of cat.items) {
        if (!item.id.startsWith('item-')) {
          await supabase.from('menu_items').update({ name: item.name, description: item.description }).eq('id', item.id).eq('organization_id', orgId)
        }
      }
    }

    await purgeStorefrontCache(orgId)
    revalidatePath('/dashboard/menu')
    return { success: true }
  })
