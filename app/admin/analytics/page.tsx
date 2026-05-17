'use client'

/**
 * Admin Analytics Page
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users, Package, DollarSign, TrendingUp, TrendingDown,
  Eye, Heart, MessageCircle, Calendar
} from 'lucide-react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatNumber, formatPrice } from '@/lib/utils/format'

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30d')

  // Demo analytics data
  const stats = [
    {
      label: 'Jami foydalanuvchilar',
      value: 12458,
      change: '+12.5%',
      trend: 'up',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      label: 'Faol e\'lonlar',
      value: 3247,
      change: '+8.2%',
      trend: 'up',
      icon: Package,
      color: 'text-brand-primary',
      bgColor: 'bg-brand-primary/10',
    },
    {
      label: 'Jami savdo',
      value: '2.4M',
      change: '+15.3%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      label: 'Kunlik faol foydalanuvchilar',
      value: 4523,
      change: '-2.1%',
      trend: 'down',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
  ]

  const categoryStats = [
    { name: 'Qoramol', count: 1245, percentage: 38 },
    { name: 'Qo\'y', count: 892, percentage: 27 },
    { name: 'Echki', count: 654, percentage: 20 },
    { name: 'Ot', count: 312, percentage: 10 },
    { name: 'Tuya', count: 98, percentage: 3 },
    { name: 'Parranda', count: 46, percentage: 2 },
  ]

  const regionStats = [
    { name: 'Toshkent', users: 3245, listings: 892 },
    { name: 'Samarqand', users: 2156, listings: 654 },
    { name: 'Andijon', users: 1876, listings: 543 },
    { name: 'Farg\'ona', users: 1654, listings: 487 },
    { name: 'Namangan', users: 1234, listings: 398 },
  ]

  const activityData = [
    { label: 'Jami ko\'rishlar', value: 145678, icon: Eye, color: 'text-blue-600' },
    { name: 'Saralangan', value: 23456, icon: Heart, color: 'text-red-600' },
    { label: 'Xabarlar', value: 12345, icon: MessageCircle, color: 'text-green-600' },
  ]

  return (
    <AdminLayout>

      <div className="container-page py-8">
        {/* Header */}
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
                Platforma statistikasi va hisobotlar
              </p>
            </div>

            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="h-12 rounded-xl border-2 border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-800"
            >
              <option value="7d">So'nggi 7 kun</option>
              <option value="30d">So'nggi 30 kun</option>
              <option value="90d">So'nggi 90 kun</option>
              <option value="1y">So'nggi yil</option>
            </select>
          </div>
        </motion.div>

        {/* Main Stats */}
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
                        {typeof stat.value === 'number' ? formatNumber(stat.value) : stat.value}
                      </p>
                      <div className={`mt-2 flex items-center text-sm ${
                        stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.trend === 'up' ? (
                          <TrendingUp className="mr-1 h-4 w-4" />
                        ) : (
                          <TrendingDown className="mr-1 h-4 w-4" />
                        )}
                        <span>{stat.change}</span>
                      </div>
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
          {/* Category Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Kategoriyalar bo'yicha</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryStats.map((category, index) => (
                    <div key={category.name}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {category.name}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {formatNumber(category.count)} ({category.percentage}%)
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${category.percentage}%` }}
                          transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                          className="h-full bg-brand-primary"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Region Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Hududlar bo'yicha</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {regionStats.map((region, index) => (
                    <div
                      key={region.name}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                    >
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {region.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatNumber(region.users)} foydalanuvchi
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-brand-primary">
                          {formatNumber(region.listings)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          e'lon
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Activity Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Faollik</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activityData.map((activity) => (
                    <div
                      key={activity.label}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-gray-100 p-3 dark:bg-gray-700">
                          <activity.icon className={`h-5 w-5 ${activity.color}`} />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {activity.label}
                        </span>
                      </div>
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatNumber(activity.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Growth Chart Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>O'sish grafigi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <div className="text-center">
                    <Calendar className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Grafik ko'rinishi
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Chart.js yoki Recharts bilan amalga oshiriladi
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Additional Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>Qo'shimcha ko'rsatkichlar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    87%
                  </p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Foydalanuvchi qoniqishi
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    4.8
                  </p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    O'rtacha reyting
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    2.5 soat
                  </p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    O'rtacha javob vaqti
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    92%
                  </p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Muvaffaqiyatli bitimlar
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AdminLayout>
  )
}
