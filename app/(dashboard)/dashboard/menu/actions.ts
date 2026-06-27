'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { purgeStorefrontCache } from '@/lib/cache-purger'
import { z } from 'zod'
import { authActionClient } from '@/lib/safe-action'

// Helper to validate user
async function requireAuth() {
  const supabase = await createClient()
  const { data: userData, error } = await supabase.auth.getUser()
  if (error || !userData?.user) {
    throw new Error('Not authenticated')
  }
  return { supabase, user: userData.user }
}

const createCategorySchema = z.object({
  organization_id: z.string().min(1, "Organization ID is required"),
  menu_id: z.string().min(1, "Menu ID is required"),
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
})

export const createCategorySafe = authActionClient
  .schema(createCategorySchema)
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


export async function createCategory(formData: FormData) {
  try {
    const { supabase } = await requireAuth()

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
  } catch (e) {
    return { error: (e as Error).message }
  }
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
  stock_count: z.string().optional().transform(val => val ? parseInt(val, 10) : null).refine(val => val === null || (!isNaN(val) && val >= 0), "Stock must be a non-negative number")
})

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export async function createItem(formData: FormData) {
  try {
    const { supabase } = await requireAuth()

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
      ai_image_url: aiImageUrl,
      stock_count: stockCount
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
      if (image.size > MAX_FILE_SIZE) {
        return { error: 'Image must be less than 5MB' }
      }
      if (!ACCEPTED_IMAGE_TYPES.includes(image.type)) {
        return { error: 'Invalid image format. Only JPEG, PNG, and WebP are accepted.' }
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
      allergen_tags,
      stock_count: stockCount
    })

    if (error) return { error: (error as Error).message }

    await purgeStorefrontCache(orgId)
    revalidatePath('/dashboard/menu')
    return { success: true }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

const updateItemSchema = z.object({
  item_id: z.string().min(1),
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format").transform(val => parseFloat(val)),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  ai_image_url: z.string().url().optional().or(z.literal('')),
  stock_count: z.string().optional().transform(val => val ? parseInt(val, 10) : null).refine(val => val === null || (!isNaN(val) && val >= 0), "Stock must be a non-negative number")
})

export async function updateItem(formData: FormData) {
  try {
    const { supabase } = await requireAuth()

    const parsed = updateItemSchema.safeParse({
      item_id: formData.get('item_id'),
      name: formData.get('name'),
      price: formData.get('price'),
      description: formData.get('description') || undefined,
      ai_image_url: formData.get('ai_image_url') || undefined,
      stock_count: formData.get('stock_count') || undefined,
    })

    if (!parsed.success) return { error: parsed.error.issues[0].message }

    const {
      item_id: itemId,
      name,
      price,
      description,
      ai_image_url: aiImageUrl,
      stock_count: stockCount
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
      if (image.size > MAX_FILE_SIZE) {
        return { error: 'Image must be less than 5MB' }
      }
      if (!ACCEPTED_IMAGE_TYPES.includes(image.type)) {
        return { error: 'Invalid image format. Only JPEG, PNG, and WebP are accepted.' }
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
      stock_count: stockCount
    }
    
    if (image_url) {
      updatePayload.image_url = image_url
    }

    const { error } = await supabase.from('menu_items').update(updatePayload).eq('id', itemId)

    if (error) return { error: (error as Error).message }

    if (item) await purgeStorefrontCache(item.organization_id)
    revalidatePath('/dashboard/menu')
    return { success: true }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function deleteItem(itemId: string) {
  try {
    const { supabase } = await requireAuth()
    
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
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function toggleItemStatus(itemId: string, currentStatus: string) {
  try {
    const { supabase } = await requireAuth()

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
  } catch (e) {
    console.error(e)
  }
}

export async function applyTranslations(orgId: string, translatedCategories: { id: string, name: string, items: { id: string, name: string, description: string }[] }[]) {
  try {
    const { supabase } = await requireAuth()

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
  } catch (e) {
    return { error: (e as Error).message }
  }
}
