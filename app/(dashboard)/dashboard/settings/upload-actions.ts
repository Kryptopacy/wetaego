'use server'

import { createClient } from '@/lib/supabase/server'

export async function uploadImage(formData: FormData): Promise<{ url?: string; error?: string }> {
  try {
    const file = formData.get('file') as File | null
    if (!file) {
      return { error: 'No file provided' }
    }

    // Basic validation
    if (!file.type.startsWith('image/')) {
      return { error: 'File must be an image' }
    }
    if (file.size > 5 * 1024 * 1024) {
      return { error: 'File size must be less than 5MB' }
    }

    const supabase = await createClient()
    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError || !userData?.user) {
      return { error: 'Not authenticated' }
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'png'
    const fileName = `uploads/${userData.user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

    // Upload to 'public-assets' bucket (assuming this bucket exists and is public)
    const { error: uploadError } = await supabase
      .storage
      .from('public-assets')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload Error:', uploadError)
      return { error: 'Failed to upload image to storage' }
    }

    const { data: publicUrlData } = supabase.storage.from('public-assets').getPublicUrl(fileName)
    
    return { url: publicUrlData.publicUrl }
  } catch (err: unknown) {
    console.error('Upload catch error:', err)
    return { error: (err as Error).message || 'An unexpected error occurred during upload' }
  }
}
