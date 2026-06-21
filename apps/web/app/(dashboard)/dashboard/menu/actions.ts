
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCategory(formData: FormData) {
  const supabase = await createClient()

  const orgId = formData.get('organization_id') as string
  const menuId = formData.get('menu_id') as string
  const name = formData.get('name') as string

  if (!orgId || !menuId || !name) return { error: 'Missing required fields' }
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

  revalidatePath('/dashboard/menu')
  return { success: true }
}

export async function createItem(formData: FormData) {
  const supabase = await createClient()

  const orgId = formData.get('organization_id') as string
  const categoryId = formData.get('category_id') as string
  const name = formData.get('name') as string
  const price = formData.get('price') as string
  const description = formData.get('description') as string
  const dietaryTagsRaw = formData.get('dietary_tags') as string
  const allergensRaw = formData.get('allergens') as string
  const image = formData.get('image') as File | null
  const aiImageUrl = formData.get('ai_image_url') as string | null

  if (!orgId || !categoryId || !name || !price) return { error: 'Missing required fields' }
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
    description,
    price_minor: Math.round(parseFloat(price) * 100), // convert to minor units
    image_url,
    dietary_tags,
    allergen_tags
  })

  if (error) return { error: (error as Error).message }

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

  await supabase
    .from('menu_items')
    .update({ availability_status: nextStatus })
    .eq('id', itemId)

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

  revalidatePath('/dashboard/menu')
  return { success: true }
}
