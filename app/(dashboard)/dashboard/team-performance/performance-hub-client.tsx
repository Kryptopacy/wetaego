'use client'

import { useState } from 'react'
import {
  Building2, Users, Star, MessageSquare, Search, Filter,
  TrendingUp, Shield, Lock, ThumbsUp, Heart, Award, Sparkles,
  Calendar, CheckCircle2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatCurrency } from '@/lib/utils/currency'

export interface StaffPerformanceItem {
  userId: string
  name: string
  role: string
  department?: string
  reviewCount: number
  avgRating: number
  totalTipsMinor: number // Used only for private individual viewing
  recentFeedback: string[]
}

export interface ReviewItem {
  id: string
  staffId: string | null
  staffName?: string
  customerName?: string
  staffRating: number | null
  staffFeedback: string | null
  businessRating: number | null
  businessFeedback: string | null
  createdAt: string
}

interface PerformanceHubClientProps {
  currentUserId: string
  isOwnerOrManager: boolean
  currencyCode: string
  staffStats: StaffPerformanceItem[]
  reviews: ReviewItem[]
  avgBizRating: number
  totalBizReviews: number
  totalTipsCollectedMinor: number
}

export function PerformanceHubClient({
  currentUserId,
  isOwnerOrManager,
  currencyCode,
  staffStats,
  reviews,
  avgBizRating,
  totalBizReviews,
  totalTipsCollectedMinor
}: PerformanceHubClientProps) {
  const [activeTab, setActiveTab] = useState<'business' | 'staff'>('business')
  const [searchQuery, setSearchQuery] = useState('')
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all')

  // Find the logged-in user's personal private stats
  const myStats = staffStats.find(s => s.userId === currentUserId)

  // Filter business reviews
  const filteredBizReviews = reviews.filter(r => {
    const hasContent = !!(r.businessFeedback || r.businessRating)
    if (!hasContent) return false

    if (ratingFilter !== 'all' && r.businessRating !== ratingFilter) {
      return false
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchText = r.businessFeedback?.toLowerCase().includes(q)
      const matchCustomer = r.customerName?.toLowerCase().includes(q)
      return matchText || matchCustomer
    }

    return true
  })

  // Calculate Satisfaction % (4 and 5 star ratings / total)
  const positiveBizReviews = reviews.filter(r => (r.businessRating || 0) >= 4).length
  const totalWithRating = reviews.filter(r => (r.businessRating || 0) > 0).length
  const satisfactionRate = totalWithRating > 0 ? Math.round((positiveBizReviews / totalWithRating) * 100) : 100

  // Staff leaderboard sorted purely by Rating (descending), then Review Count (descending)
  const leaderboardStaff = [...staffStats].sort((a, b) => {
    if (b.avgRating !== a.avgRating) {
      return b.avgRating - a.avgRating
    }
    return b.reviewCount - a.reviewCount
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Header & Tab Switcher ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
            Performance & Feedback
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-light mt-0.5">
            Live business reviews, customer sentiments, and staff service ratings
          </p>
        </div>

        {/* Master Tab Switcher */}
        <div className="inline-flex p-1 bg-black/60 border border-zinc-800 rounded-xl">
          <button
            onClick={() => setActiveTab('business')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'business'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Business Performance
          </button>

          <button
            onClick={() => setActiveTab('staff')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'staff'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Staff Leaderboard
          </button>
        </div>
      </div>

      {/* ── Tab 1: Business Performance & Customer Feedback ── */}
      {activeTab === 'business' && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                Overall Business Rating
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">
                  {avgBizRating > 0 ? avgBizRating.toFixed(1) : '-'}
                </span>
                <span className="text-yellow-400 text-xl font-bold">★</span>
                <span className="text-xs text-zinc-500 font-medium ml-1">
                  ({totalBizReviews} reviews)
                </span>
              </div>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                Customer Satisfaction
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-400">
                  {satisfactionRate}%
                </span>
                <span className="text-xs text-zinc-500 font-medium">
                  positive (4-5 ★)
                </span>
              </div>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                Total Written Reviews
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-blue-400">
                  {reviews.filter(r => r.businessFeedback).length}
                </span>
                <span className="text-xs text-zinc-500 font-medium">
                  feedback entries
                </span>
              </div>
            </div>
          </div>

          {/* Feedback Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-3">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none w-full sm:w-auto">
              <button
                onClick={() => setRatingFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  ratingFilter === 'all'
                    ? 'bg-zinc-800 border-zinc-700 text-white'
                    : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                All Ratings
              </button>
              {[5, 4, 3, 2, 1].map((stars) => (
                <button
                  key={stars}
                  onClick={() => setRatingFilter(stars)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1 ${
                    ratingFilter === stars
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                      : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <span>{stars}</span>
                  <span className="text-yellow-400">★</span>
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search feedback..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/50 border border-zinc-800 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Customer Reviews Feed */}
          {filteredBizReviews.length === 0 ? (
            <div className="py-16 text-center bg-zinc-900/20 border border-dashed border-zinc-800/80 rounded-2xl">
              <MessageSquare className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">No Customer Feedback Found</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 font-light">
                Customer ratings and written reviews collected from digital menus and post-checkout prompts will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBizReviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1 text-yellow-400 text-sm">
                        {Array.from({ length: review.businessRating || 5 }).map((_, i) => (
                          <span key={i}>★</span>
                        ))}
                      </div>
                      <span className="text-[11px] text-zinc-500 font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(review.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    {review.businessFeedback ? (
                      <p className="text-xs text-zinc-200 font-normal leading-relaxed mb-3">
                        &ldquo;{review.businessFeedback}&rdquo;
                      </p>
                    ) : (
                      <p className="text-xs text-zinc-500 italic mb-3">
                        Rated without written comment.
                      </p>
                    )}
                  </div>

                  {review.customerName && (
                    <div className="pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-400 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>{review.customerName}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 2: Staff Leaderboard & Ratings ── */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          {/* Private Individual Tips Card (Only visible to current logged-in staff member) */}
          {myStats && myStats.totalTipsMinor > 0 && (
            <div className="bg-gradient-to-r from-emerald-950/20 via-zinc-900/60 to-zinc-900/60 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Your Private Tips Earned</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                      Confidential to You
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-light mt-0.5">
                    Individual tip amounts are strictly private and never shared on team leaderboards.
                  </p>
                </div>
              </div>

              <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                {formatCurrency(myStats.totalTipsMinor, currencyCode)}
              </div>
            </div>
          )}

          {/* Staff Service Leaderboard */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-yellow-400" />
                  Service Quality Leaderboard
                </h3>
                <p className="text-xs text-zinc-400 font-light mt-0.5">
                  Ranked by verified customer service ratings and review volume
                </p>
              </div>
              <span className="text-xs text-zinc-500 font-mono">
                {leaderboardStaff.length} Team Members
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950/60 border-b border-zinc-800/80 text-zinc-400 uppercase tracking-wider font-semibold text-[10px]">
                  <tr>
                    <th className="px-5 py-3 w-16 text-center">Rank</th>
                    <th className="px-5 py-3">Team Member</th>
                    <th className="px-5 py-3 text-center">Average Rating</th>
                    <th className="px-5 py-3 text-center">Verified Reviews</th>
                    <th className="px-5 py-3">Latest Compliment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {leaderboardStaff.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-zinc-500">
                        No team members registered yet.
                      </td>
                    </tr>
                  ) : (
                    leaderboardStaff.map((staff, index) => {
                      const isTop1 = index === 0 && staff.avgRating > 0
                      const isTop2 = index === 1 && staff.avgRating > 0
                      const isTop3 = index === 2 && staff.avgRating > 0

                      return (
                        <tr
                          key={staff.userId}
                          className={`hover:bg-zinc-800/20 transition-colors ${
                            staff.userId === currentUserId ? 'bg-emerald-500/5' : ''
                          }`}
                        >
                          {/* Rank Medal */}
                          <td className="px-5 py-4 text-center font-bold">
                            {isTop1 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                🥇
                              </span>
                            ) : isTop2 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-zinc-400/20 text-zinc-300 border border-zinc-400/30">
                                🥈
                              </span>
                            ) : isTop3 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700/20 text-amber-500 border border-amber-700/30">
                                🥉
                              </span>
                            ) : (
                              <span className="text-zinc-500 font-mono">#{index + 1}</span>
                            )}
                          </td>

                          {/* Member Details */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">{staff.name}</span>
                              {staff.userId === currentUserId && (
                                <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-zinc-500 text-[11px] uppercase font-mono mt-0.5">
                              {staff.role} {staff.department ? `• ${staff.department}` : ''}
                            </div>
                          </td>

                          {/* Service Rating */}
                          <td className="px-5 py-4 text-center">
                            <div className="inline-flex items-center gap-1 font-bold text-white text-sm bg-black/40 px-2.5 py-1 rounded-xl border border-zinc-800">
                              <span>{staff.avgRating > 0 ? staff.avgRating.toFixed(1) : '-'}</span>
                              <span className="text-yellow-400">★</span>
                            </div>
                          </td>

                          {/* Review Count */}
                          <td className="px-5 py-4 text-center font-mono text-zinc-300">
                            {staff.reviewCount} {staff.reviewCount === 1 ? 'review' : 'reviews'}
                          </td>

                          {/* Latest Compliment */}
                          <td className="px-5 py-4 max-w-xs">
                            {staff.recentFeedback.length > 0 ? (
                              <p className="text-zinc-300 text-xs italic line-clamp-2">
                                &ldquo;{staff.recentFeedback[0]}&rdquo;
                              </p>
                            ) : (
                              <span className="text-zinc-600 text-xs italic">No written notes yet</span>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
