'use client'

/**
 * Admin Analytics Page — real data from backend (IsPlatformAdmin only).
 */

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users, Package, MessageCircle, Eye,
  TrendingUp, BarChart3, Loader2,
} from 'lucide-react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatNumber } from '@/lib/utils/format'
import {
  analyticsApi,
  type DashboardStats,
  type CategoryStat,
  type ActivityAnalytics,
} from '@/lib/api/analytics'

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null)
  const [categories, setCategories] = useState<CategoryStat[]>([])
  const [activity, setActivity] = useState<ActivityAnalytics | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([
      analyticsApi.dashboard(),
      analyticsApi.listingsByCategory(),
      analyticsApi.activity(days),
    ])
      .then(([d, c, a]) => {
        if (cancelled) return
        setDashboard(d)
        setCategories(c)
        setActivity(a)
      })
      .catch((e: any) => {
        if (cancelled) return
        setError(e?.response?.data?.detail || e?.message || 'Failed to load analytics')
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [days])

  const totalCategoryCount =
    categories.reduce((sum, c) => sum + (c.total_listings ?? 0), 0) || 1

  const stats = dashboard
    ? [
        {
          label: 'Jami foydalanuvchilar',
          value: dashboard.users.total,
          subtext: `+${dashboard.users.new_today} bugun`,
          icon: Users,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100 dark:bg-blue-900/20',
        },
        {
          label: "Faol e'lonlar",
          value: dashboard.listings.active,
          subtext: `${formatNumber(dashboard.listings.total)} jami`,
          icon: Package,
          color: 'text-brand-primary',
          bgColor: 'bg-brand-primary/10',
        },
        {
          label: "Ko'rishlar",
          value: dashboard.engagement.total_views,
          subtext: `+${dashboard.engagement.views_today} bugun`,
          icon: Eye,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100 dark:bg-purple-900/20',
        },
        {
          label: 'Xabarlar',
          value: dashboard.messages.total,
          subtext: `+${dashboard.messages.today} bugun`,
          icon: MessageCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-100 dark:bg-green-900/20',
        },
      ]
    : []

  return (
    <AdminLayout>
      <div className="container-page py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Analitika
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Platforma statistikasi va hisobotlar (real-time, DB asosida)
              </p>
            </div>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="h-12 rounded-xl border-2 border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-800"
            >
              <option value={7}>So'nggi 7 kun</option>
              <option value={30}>So'nggi 30 kun</option>
              <option value={90}>So'nggi 90 kun</option>
              <option value={365}>So'nggi yil</option>
            </select>
          </div>
        </motion.div>

        {error && (
          <div className="mb-6 rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
            {error}
          </div>
        )}

        {loading && !dashboard && (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          </div>
        )}

        {dashboard && (
          <>
            {/* Main stats */}
            <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <Card className="transition-all hover:shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {stat.label}
                          </p>
                          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                            {formatNumber(stat.value)}
                          </p>
                          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            {stat.subtext}
                          </p>
                        </div>
                        <div className={`rounded-full p-3 ${stat.bgColor}`}>
                          <stat.icon className={`h-6 w-6 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              {/* Categories */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Kategoriyalar bo'yicha taqsimot</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {categories.length === 0 ? (
                      <p className="py-6 text-center text-sm text-gray-500">
                        Hozircha ma'lumot yo'q
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {categories.map((category, index) => {
                          const pct = Math.round(
                            ((category.total_listings ?? 0) /
                              totalCategoryCount) *
                              100
                          )
                          return (
                            <div key={category.name}>
                              <div className="mb-2 flex items-center justify-between text-sm">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {category.name_uz || category.name}
                                </span>
                                <span className="text-gray-600 dark:text-gray-400">
                                  {formatNumber(category.total_listings)} ({pct}%)
                                </span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ delay: 0.5 + index * 0.05, duration: 0.5 }}
                                  className="h-full bg-brand-primary"
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Daily activity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Kunlik faollik (so'nggi {days} kun)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!activity || activity.daily_activity.length === 0 ? (
                      <div className="flex h-48 flex-col items-center justify-center text-gray-500">
                        <BarChart3 className="mb-3 h-12 w-12" />
                        <p className="text-sm">
                          Bu davr uchun aggregatlangan ma'lumotlar yetarli emas.
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                        {activity.daily_activity.map((row) => (
                          <div
                            key={row.date}
                            className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-sm dark:border-gray-700"
                          >
                            <span className="font-medium">{row.date}</span>
                            <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                              <span title="Views">
                                <Eye className="mr-1 inline h-3.5 w-3.5" />
                                {formatNumber(row.total_views)}
                              </span>
                              <span title="Messages">
                                <MessageCircle className="mr-1 inline h-3.5 w-3.5" />
                                {formatNumber(row.total_messages)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Event distribution */}
              {activity && activity.event_distribution.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="lg:col-span-2"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Eventlar taqsimoti (so'nggi {days} kun)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {activity.event_distribution.slice(0, 9).map((ev) => (
                          <div
                            key={ev.event_type}
                            className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-700"
                          >
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {ev.event_type}
                            </span>
                            <span className="font-display text-lg font-bold text-brand-primary">
                              {formatNumber(ev.count)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
