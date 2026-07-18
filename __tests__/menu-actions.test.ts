import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createCategory, createItem } from '../app/(dashboard)/dashboard/menu/actions'
import { revalidatePath } from 'next/cache'

// Mock dependencies
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/cache-purger', () => ({
  purgeStorefrontCache: vi.fn(),
}))

const mockGetUser = vi.fn()
const mockInsert = vi.fn()
const mockUpload = vi.fn()
const mockGetPublicUrl = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: vi.fn((table) => {
      if (table === 'page_collections' || table === 'page_items' || table === 'page_item_collections') {
        return { insert: mockInsert, update: vi.fn(), delete: vi.fn(), select: vi.fn() }
      }
      return {}
    }),
    storage: {
      from: vi.fn(() => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      })),
    },
  })),
  createAdminClient: vi.fn(() => ({
    from: vi.fn((table) => {
      if (table === 'page_collections' || table === 'page_items' || table === 'page_item_collections') {
        return { insert: mockInsert, update: vi.fn(), delete: vi.fn(), select: vi.fn() }
      }
      return {}
    }),
    storage: {
      from: vi.fn(() => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        remove: vi.fn(),
      })),
    },
  })),
}))


describe('Menu Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createCategory', () => {
    it('returns error when unauthenticated', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: new Error('Auth Error') })
      
      const formData = new FormData()
      const res = await createCategory(formData)
      
      expect(res).toEqual({ serverError: 'Unauthorized' })
    })

    it('creates category successfully', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user_123' } }, error: null })
      mockInsert.mockResolvedValueOnce({ error: null })
      
      const formData = new FormData()
      formData.append('organization_id', 'org_123')
      formData.append('menu_id', 'menu_123')
      formData.append('page_id', 'page_123')
      formData.append('name', 'Appetizers')
      
      const res = await createCategory(formData)
      
      expect(res).toEqual({ data: { success: true } })
      expect(mockInsert).toHaveBeenCalledWith({
        page_id: 'page_123',
        name: 'Appetizers',
        slug: 'appetizers'
      })
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/menu')
    })
  })

  describe('createItem', () => {
    it('rejects oversized images', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user_123' } }, error: null })
      
      const formData = new FormData()
      formData.append('organization_id', 'org_123')
      formData.append('category_id', 'cat_123')
      formData.append('page_id', 'page_123')
      formData.append('collection_ids', '["col_1"]')
      formData.append('name', 'Burger')
      formData.append('price', '15.99')
      
      // Mock a 31MB file
      const largeFile = new File(['x'.repeat(31 * 1024 * 1024)], 'huge.jpg', { type: 'image/jpeg' })
      formData.append('image', largeFile)
      
      const res = await createItem(formData)
      
      expect(res).toEqual({ serverError: 'File must be less than 30MB' })
    })

    it('rejects invalid mime types', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user_123' } }, error: null })
      
      const formData = new FormData()
      formData.append('organization_id', 'org_123')
      formData.append('category_id', 'cat_123')
      formData.append('page_id', 'page_123')
      formData.append('collection_ids', '["col_1"]')
      formData.append('name', 'Burger')
      formData.append('price', '15.99')
      
      const invalidFile = new File(['script content'], 'malicious.html', { type: 'text/html' })
      formData.append('image', invalidFile)
      
      const res = await createItem(formData)
      
      expect(res).toEqual({ serverError: 'Invalid file format. Only JPEG, PNG, WebP, MP4, WebM, and MOV are accepted.' })
    })
  })
})
