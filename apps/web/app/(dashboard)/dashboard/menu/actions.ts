
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { purgeStorefrontCache } from '@/lib/cache-purger'
import { z } from 'zod'

const createCategorySchema = z.object({
  organization_id: z.string().min(1, "Organization ID is required"),
  menu_id: z.string().min(1, "Menu ID is required"),
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
})

export async function createCategory(formData: FormData) {
  const supabase = await createClient()

  const parsed = createCategorySchema.safeParse({
    organization_id: formData.get('organization_id'),
    menu_id: formData.get('menu_id'),
    name: formData.get('name'),
  })

  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const { organization_id: orgId, menu_id: menuId, name } = parsed.data
  if (orgId === 'demo-org') {
    revalidatePath('/dashboard/menu')
    return { success: true }
  }

  const { error } = await supabase.from('menu_categories').insert({
    organization_id: orgId,
    menu_id: menuId,
    name,
  })

  if (error) return { error: (error as Error).message }

  await purgeStorefrontCache(orgId)
  revalidatePath('/dashboard/menu')
  return { success: true }
}

const createItemSchema = z.object({
  organization_id: z.string().min(1),
  category_id: z.string().min(1),
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format").transform(val => parseFloat(val)),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  dietary_tags: z.string().optional(),
  allergens: z.string().optional(),
  ai_image_url: z.string().url().optional().or(z.literal('')),
})

export async function createItem(formData: FormData) {
  const supabase = await createClient()

  const parsed = createItemSchema.safeParse({
    organization_id: formData.get('organization_id'),
    category_id: formData.get('category_id'),
    name: formData.get('name'),
    price: formData.get('price'),
    description: formData.get('description') || undefined,
    dietary_tags: formData.get('dietary_tags') || undefined,
    allergens: formData.get('allergens') || undefined,
    ai_image_url: formData.get('ai_image_url') || undefined,
  })

  if (!parsed.success) return { error: parsed.error.issues[0].message }
  
  const { 
    organization_id: orgId, 
    category_id: categoryId, 
    name, 
    price, 
    description,
    dietary_tags: dietaryTagsRaw,
    allergens: allergensRaw,
    ai_image_url: aiImageUrl
  } = parsed.data

  const image = formData.get('image') as File | null
  if (orgId === 'demo-org') {
    revalidatePath('/dashboard/menu')
    return { success: true }
  }
  
  const dietary_tags = dietaryTagsRaw ? JSON.parse(dietaryTagsRaw) : []
  const allergen_tags = allergensRaw ? JSON.parse(allergensRaw) : []

  let image_url = aiImageUrl || null

  if (image && image.size > 0) {
    const fileExt = image.name.split('.').pop()
    const fileName = `${orgId}-${Date.now()}.${fileExt}`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('menu-images')
      .upload(fileName, image)
      
    if (!uploadError && uploadData) {
      const { data: publicUrlData } = supabase.storage.from('menu-images').getPublicUrl(fileName)
      image_url = publicUrlData.publicUrl
    } else {
      return { error: 'Failed to upload image' }
    }
  }

  const { error } = await supabase.from('menu_items').insert({
    organization_id: orgId,
    category_id: categoryId,
    name,
    description: description || null,
    price_minor: Math.round(price * 100), // price is already parsed to float
    image_url,
    dietary_tags,
    allergen_tags
  })

  if (error) return { error: (error as Error).message }

  await purgeStorefrontCache(orgId)
  revalidatePath('/dashboard/menu')
  return { success: true }
}

const updateItemSchema = z.object({
  item_id: z.string().min(1),
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format").transform(val => parseFloat(val)),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  ai_image_url: z.string().url().optional().or(z.literal('')),
})

export async function updateItem(formData: FormData) {
  const supabase = await createClient()

  const parsed = updateItemSchema.safeParse({
    item_id: formData.get('item_id'),
    name: formData.get('name'),
    price: formData.get('price'),
    description: formData.get('description') || undefined,
    ai_image_url: formData.get('ai_image_url') || undefined,
  })

  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const {
    item_id: itemId,
    name,
    price,
    description,
    ai_image_url: aiImageUrl
  } = parsed.data

  const image = formData.get('image') as File | null
  
  const { data: item } = await supabase.from('menu_items').select('organization_id').eq('id', itemId).single()
  if (!item) return { error: 'Item not found' }
  
  if (item.organization_id === 'demo-org') {
    revalidatePath('/dashboard/menu')
    return { success: true }
  }

  let image_url = aiImageUrl || null

  if (image && image.size > 0) {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatePayload: any = {
    name,
    description: description || null,
    price_minor: Math.round(price * 100)
  }
  
  if (image_url) {
    updatePayload.image_url = image_url
  }

  const { error } = await supabase.from('menu_items').update(updatePayload).eq('id', itemId)

  if (error) return { error: (error as Error).message }

  if (item) await purgeStorefrontCache(item.organization_id)
  revalidatePath('/dashboard/menu')
  return { success: true }
}

export async function deleteItem(itemId: string) {
  const supabase = await createClient()
  
  const { data: item } = await supabase.from('menu_items').select('organization_id').eq('id', itemId).single()
  if (!item) return { error: 'Item not found' }
  
  if (item.organization_id === 'demo-org') {
    revalidatePath('/dashboard/menu')
    return { success: true }
  }

  const { error } = await supabase.from('menu_items').delete().eq('id', itemId)
  
  if (error) return { error: (error as Error).message }

  if (item) await purgeStorefrontCache(item.organization_id)
  revalidatePath('/dashboard/menu')
  return { success: true }
}

export async function toggleItemStatus(itemId: string, currentStatus: string) {
  const supabase = await createClient()

  const nextStatus = currentStatus === 'available' ? 'sold_out' : 'available'
  if (itemId.startsWith('item-')) {
    revalidatePath('/dashboard/menu')
    return
  }

  const { data: item } = await supabase.from('menu_items').select('organization_id').eq('id', itemId).single()
  await supabase
    .from('menu_items')
    .update({ availability_status: nextStatus })
    .eq('id', itemId)

  if (item) await purgeStorefrontCache(item.organization_id)
  revalidatePath('/dashboard/menu')
}

export async function applyTranslations(orgId: string, translatedCategories: { id: string, name: string, items: { id: string, name: string, description: string }[] }[]) {
  const supabase = await createClient()

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
}
