'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Star, MessageSquare, User, Search } from 'lucide-react'

export interface Review {
  id: string
  orderId: string
  customerName: string
  staffId: string | null
  staffName: string | null
  staffRating: number
  staffFeedback: string | null
  businessRating: number | null
  businessFeedback: string | null
  createdAt: string
}

export interface StaffMember {
  id: string
  name: string
}

export function FeedbackInboxClient({
  reviews,
  staffList
}: {
  reviews: Review[]
  staffList: StaffMember[]
}) {
  const [filterType, setFilterType] = useState<'all' | 'business' | 'staff'>('all')
  const [staffFilter, setStaffFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Filter logic
  const filteredReviews = reviews.filter(r => {
    // Type filter
    if (filterType === 'business' && !r.businessFeedback) return false
    if (filterType === 'staff' && !r.staffFeedback) return false

    // Staff filter
    if (staffFilter !== 'all' && r.staffId !== staffFilter) return false

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matchesBiz = r.businessFeedback?.toLowerCase().includes(q)
      const matchesStaff = r.staffFeedback?.toLowerCase().includes(q)
      const matchesName = r.customerName?.toLowerCase().includes(q)
      
      if (!matchesBiz && !matchesStaff && !matchesName) return false
    }

    // Must have at least some written feedback to show in the inbox
    if (!r.businessFeedback && !r.staffFeedback) return false

    return true
  })

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between bg-[#0a0a0a] p-4 rounded-xl border border-white/5">
        <div className="flex flex-wrap gap-2">
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'business' | 'staff')}
            className="bg-zinc-900 border border-zinc-800 text-sm text-white rounded-lg px-3 py-2 outline-none focus:border-emerald-500"
          >
            <option value="all">All Feedback</option>
            <option value="business">Business Reviews</option>
            <option value="staff">Staff Reviews</option>
          </select>

          <select 
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-sm text-white rounded-lg px-3 py-2 outline-none focus:border-emerald-500"
          >
            <option value="all">All Staff</option>
            {staffList.map(staff => (
              <option key={staff.id} value={staff.id}>{staff.name}</option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text"
            placeholder="Search keywords or names..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-64 bg-zinc-900 border border-zinc-800 text-sm text-white rounded-lg pl-9 pr-3 py-2 outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Inbox List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12 bg-[#0a0a0a] border border-white/5 rounded-xl">
            <MessageSquare className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400">No written feedback matches your filters.</p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div key={review.id} className="bg-[#0a0a0a] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                <div>
                  <p className="font-bold text-white">{review.customerName}</p>
                  <p className="text-xs text-zinc-500">Order #{review.orderId.slice(0, 8).toUpperCase()} • {format(new Date(review.createdAt), 'MMM d, yyyy h:mm a')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Business Feedback Block */}
                {review.businessFeedback && (
                  <div className="bg-zinc-900/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-zinc-300">Restaurant Feedback</h4>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`w-3.5 h-3.5 ${star <= (review.businessRating || 0) ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'}`} 
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-zinc-400 italic">&quot;{review.businessFeedback}&quot;</p>
                  </div>
                )}

                {/* Staff Feedback Block */}
                {review.staffFeedback && (
                  <div className="bg-zinc-900/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-zinc-400" />
                        <h4 className="text-sm font-bold text-zinc-300">{review.staffName || 'Staff'}</h4>
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`w-3.5 h-3.5 ${star <= review.staffRating ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'}`} 
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-zinc-400 italic">&quot;{review.staffFeedback}&quot;</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
