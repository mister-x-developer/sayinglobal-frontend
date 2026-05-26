'use client'

/**
 * Admin Analytics Page — real data with charts.
 */

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users, Package, MessageCircle, Eye,
  TrendingUp, BarChart3, Loader2, Activity,
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

// ── Simple SVG bar chart ──────────────────────────────────────────────────────
function BarChart({ data, color = '#1f7a52' }: { data: { label: string; value: number }[]; color?: string }) {
  if (!data.length) return null
  const max = Math.max(...data.map((d) => d.value), 1)
  const w = 100 / data.length
  return (
    <div className="relative h-48 w-full">
      <svg viewBox={`0 0 ${data.length * 40} 160`} className="h-full w-full" preserveAspectRatio="none">
        {data.map((d, i) => {
          const barH = Math.max((d.value / max) * 140, 2)
          const x = i * 40 + 4
          const y = 150 - barH
          return (
            <g key={i}>
              <rect x={x} y={y} width={32} height={barH} rx={4} fill={color} opacity={0.85} />
              <title>{d.label}: {d.value}</title>
            </g>
          )
        })}
      </svg>
      {/* X-axis labels */}
      <div className="absolute bottom-0 left-0 right-0 flex">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[9px] text-fg-subtle truncate px-0.5">
            {d.label}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Simple SVG line chart ─────────────────────────────────────────────────────
function LineChart({ data, color = '#1f7a52' }: { data: { label: string; value: number }[]; color?: string }) {
  if (data.length < 2) return null
  const max = Math.max(...data.map((d) => d.value), 1)
  const W = 400
  const H = 120
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * W
    const y = H - (d.value / max) * (H - 10) - 5
    return `${x},${y}`
  })
  const polyline = pts.join(' ')
  // Area fill
  const area = `0,${H} ${polyline} ${W},${H}`

  return (
    <div className="relative h-36 w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polygon points={area} fill={`url(#grad-${color.replace('#','')})`} />
        <polyline points={polyline} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) => {
          const [x, y] = pts[i].split(',').map(Number)
          return <circle key={i} cx={x} cy={y} r="3" fill={color}><title>{d.label}: {d.value}</title></circle>
        })}
      </svg>
      {/* X labels — show first, middle, last */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1">
        <span className="text-[9px] text-fg-subtle">{data[0]?.label}</span>
        <span className="text-[9px] text-fg-subtle">{data[Math.floor(data.length / 2)]?.label}</span>
        <span className="text-[9px] text-fg-subtle">{data[data.length - 1]?.label}</span>
      </div>
    </div>
  )
}

// ── Donut chart ───────────────────────────────────────────────────────────────
function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  let offset = 0
  const R = 40
  const C = 2 * Math.PI * R

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 100 100" className="h-28 w-28 flex-shrink-0">
        {data.map((d, i) => {
          const pct = d.value / total
          const dash = pct * C
          const gap = C - dash
          const rotation = (offset / total) * 360 - 90
          offset += d.value
          return (
            <circle
              key={i}
              cx="50" cy="50" r={R}
              fill="none"
              stroke={d.color}
              strokeWidth="18"
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={0}
              transform={`rotate(${rotation} 50 50)`}
              opacity={0.9}
            >
              <title>{d.label}: {d.value} ({Math.round(pct * 100)}%)</title>
            </circle>
          )
        })}
        <text x="50" y="54" textAnchor="middle" className="text-xs font-bold" fill="currentColor" fontSize="10">
          {formatNumber(total)}
        </text>
      </svg>
      <div className="space-y-1.5 flex-1 min-w-0">
        {data.slice(0, 6).map((d) => (
          <div key={d.label} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: d.color }} />
            <span className="flex-1 truncate text-fg-muted">{d.label}</span>
            <span className="font-semibold text-fg">{Math.round((d.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const CHART_COLORS = ['#1f7a52', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899']

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
    return () => { cancelled = true }
  }, [days])

  const stats = dashboard ? [
    { label: 'Jami foydalanuvchilar', value: dashboard.users.total, sub: `+${dashboard.users.new_today} bugun`, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: "Faol e'lonlar", value: dashboard.listings.active, sub: `${formatNumber(dashboard.listings.total)} jami`, icon: Package, color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
    { label: "Ko'rishlar", value: dashboard.engagement.total_views, sub: `+${dashboard.engagement.views_today} bugun`, icon: Eye, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Xabarlar', value: dashboard.messages.total, sub: `+${dashboard.messages.today} bugun`, icon: MessageCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
  ] : []

  // Prepare chart data
  const dailyViewsData = (activity?.daily_activity ?? []).slice(-14).map((r) => ({
    label: r.date.slice(5), // MM-DD
    value: r.total_views,
  }))
  const dailyMsgData = (activity?.daily_activity ?? []).slice(-14).map((r) => ({
    label: r.date.slice(5),
    value: r.total_messages,
  }))
  const categoryDonutData = categories.slice(0, 8).map((c, i) => ({
    label: c.name_uz || c.name,
    value: c.total_listings ?? 0,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }))
  const eventBarData = (activity?.event_distribution ?? []).slice(0, 8).map((e) => ({
    label: e.event_type.replace(/_/g, ' '),
    value: e.count,
  }))

  return (
    <AdminLayout>
      <div className="container-page py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-fg">Analitika</h1>
              <p className="mt-1 text-fg-muted">Platforma statistikasi va hisobotlar</p>
            </div>
            <select value={days} onChange={(e) => setDays(Number(e.target.value))}
              className="h-10 rounded-xl border border-border bg-bg-elevated px-4 text-sm text-fg">
              <option value={7}>So'nggi 7 kun</option>
              <option value={30}>So'nggi 30 kun</option>
              <option value={90}>So'nggi 90 kun</option>
              <option value={365}>So'nggi yil</option>
            </select>
          </div>
        </motion.div>

        {error && <div className="mb-6 rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">{error}</div>}

        {loading && !dashboard && (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          </div>
        )}

        {dashboard && (
          <>
            {/* Stat cards */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-fg-muted">{s.label}</p>
                          <p className="mt-1.5 text-3xl font-bold text-fg">{formatNumber(s.value)}</p>
                          <p className="mt-1 text-xs text-fg-subtle">{s.sub}</p>
                        </div>
                        <div className={`rounded-2xl p-3 ${s.bg}`}>
                          <s.icon className={`h-6 w-6 ${s.color}`} strokeWidth={1.75} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Views line chart */}
              {dailyViewsData.length > 1 && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-brand-primary" strokeWidth={1.75} />Ko'rishlar (so'nggi {Math.min(days, 14)} kun)</CardTitle></CardHeader>
                    <CardContent className="pb-6">
                      <LineChart data={dailyViewsData} color="#1f7a52" />
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Messages line chart */}
              {dailyMsgData.length > 1 && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                  <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-blue-500" strokeWidth={1.75} />Xabarlar (so'nggi {Math.min(days, 14)} kun)</CardTitle></CardHeader>
                    <CardContent className="pb-6">
                      <LineChart data={dailyMsgData} color="#3b82f6" />
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Category donut */}
              {categoryDonutData.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4 text-amber-500" strokeWidth={1.75} />Kategoriyalar bo'yicha</CardTitle></CardHeader>
                    <CardContent>
                      <DonutChart data={categoryDonutData} />
                      {/* Also show progress bars */}
                      <div className="mt-4 space-y-2">
                        {categories.map((c, i) => {
                          const total = categories.reduce((s, x) => s + (x.total_listings ?? 0), 0) || 1
                          const pct = Math.round(((c.total_listings ?? 0) / total) * 100)
                          return (
                            <div key={c.name}>
                              <div className="mb-1 flex justify-between text-xs">
                                <span className="text-fg-muted">{c.name_uz || c.name}</span>
                                <span className="font-semibold text-fg">{c.total_listings} ({pct}%)</span>
                              </div>
                              <div className="h-1.5 overflow-hidden rounded-full bg-bg-subtle">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                  transition={{ delay: 0.5 + i * 0.04, duration: 0.5 }}
                                  className="h-full rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Event bar chart */}
              {eventBarData.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
                  <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-purple-500" strokeWidth={1.75} />Eventlar taqsimoti</CardTitle></CardHeader>
                    <CardContent className="pb-6">
                      <BarChart data={eventBarData} color="#8b5cf6" />
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {(activity?.event_distribution ?? []).slice(0, 8).map((ev) => (
                          <div key={ev.event_type} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-xs">
                            <span className="text-fg-muted truncate">{ev.event_type}</span>
                            <span className="ml-2 font-bold text-brand-primary">{formatNumber(ev.count)}</span>
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
