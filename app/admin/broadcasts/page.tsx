'use client'

/**
 * Admin Broadcasts Page - Send Notifications
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Send, Users, MessageCircle, Calendar, CheckCircle, Clock
} from 'lucide-react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { toast } from '@/components/ui/Toast'
import { formatDate, formatRelativeTime } from '@/lib/utils/format'

export default function AdminBroadcastsPage() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [targetAudience, setTargetAudience] = useState('all')
  const [isScheduled, setIsScheduled] = useState(false)
  const [scheduledDate, setScheduledDate] = useState('')
  const [isSending, setIsSending] = useState(false)

  // Demo broadcast history
  const broadcasts = [
    {
      id: '1',
      title: 'Yangi xususiyatlar',
      message: 'Platformaga yangi qidiruv filtrlari qo\'shildi. Endi mollarni yosh va vazn bo\'yicha ham qidirishingiz mumkin.',
      target: 'all',
      sent_to: 12458,
      status: 'sent',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: '2',
      title: 'Texnik ishlar',
      message: 'Bugun kechqurun 23:00 dan 01:00 gacha texnik ishlar olib boriladi. Platformada qisqa muddatli uzilishlar bo\'lishi mumkin.',
      target: 'all',
      sent_to: 12458,
      status: 'sent',
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: '3',
      title: 'Yangi qoidalar',
      message: 'E\'lon berish qoidalari yangilandi. Iltimos, yangi qoidalar bilan tanishing.',
      target: 'sellers',
      sent_to: 3247,
      status: 'sent',
      created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    },
  ]

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Ma\'lumot to\'liq emas', 'Sarlavha va xabar matnini kiriting')
      return
    }

    if (isScheduled && !scheduledDate) {
      toast.error('Sana tanlanmagan', 'Yuborish sanasini tanlang')
      return
    }

    setIsSending(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      if (isScheduled) {
        toast.success('Xabar rejalashtirildi', `${scheduledDate} da yuboriladi`)
      } else {
        toast.success('Xabar yuborildi', 'Barcha foydalanuvchilarga yetkazildi')
      }
      
      // Reset form
      setTitle('')
      setMessage('')
      setTargetAudience('all')
      setIsScheduled(false)
      setScheduledDate('')
    } catch (error) {
      toast.error('Xatolik', 'Xabarni yuborishda xatolik yuz berdi')
    } finally {
      setIsSending(false)
    }
  }

  const getTargetLabel = (target: string) => {
    switch (target) {
      case 'all':
        return 'Barcha foydalanuvchilar'
      case 'sellers':
        return 'Sotuvchilar'
      case 'buyers':
        return 'Xaridorlar'
      default:
        return target
    }
  }

  return (
    <AdminLayout>

      <div className="container-page py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Xabar yuborish
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Foydalanuvchilarga bildirishnoma yuborish
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Send Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Yangi xabar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Title */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Sarlavha *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 transition-colors focus:border-brand-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800"
                    placeholder="Xabar sarlavhasi"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Xabar matni *
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 transition-colors focus:border-brand-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800"
                    placeholder="Xabar matni..."
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    {message.length}/500 belgi
                  </p>
                </div>

                {/* Target Audience */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Kimga yuborish
                  </label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 transition-colors focus:border-brand-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800"
                  >
                    <option value="all">Barcha foydalanuvchilar</option>
                    <option value="sellers">Faqat sotuvchilar</option>
                    <option value="buyers">Faqat xaridorlar</option>
                  </select>
                </div>

                {/* Schedule */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="schedule"
                      checked={isScheduled}
                      onChange={(e) => setIsScheduled(e.target.checked)}
                      className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                    />
                    <label htmlFor="schedule" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Keyinroq yuborish
                    </label>
                  </div>

                  {isScheduled && (
                    <input
                      type="datetime-local"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 transition-colors focus:border-brand-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800"
                    />
                  )}
                </div>

                {/* Send Button */}
                <Button
                  size="lg"
                  fullWidth
                  onClick={handleSend}
                  disabled={isSending}
                >
                  {isSending ? (
                    <>
                      <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Yuborilmoqda...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      {isScheduled ? 'Rejalashtirish' : 'Yuborish'}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Stats & Info */}
          <div className="space-y-6">
            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Statistika</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/20">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Jami foydalanuvchilar
                      </p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        12,458
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/20">
                      <MessageCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Yuborilgan xabarlar
                      </p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {broadcasts.length}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Info */}
            <Card>
              <CardHeader>
                <CardTitle>Ma'lumot</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    • Xabarlar barcha foydalanuvchilarga push bildirishnoma sifatida yuboriladi
                  </p>
                  <p>
                    • Sarlavha qisqa va aniq bo'lishi kerak
                  </p>
                  <p>
                    • Xabar matni 500 belgidan oshmasligi kerak
                  </p>
                  <p>
                    • Rejalashtirilgan xabarlar belgilangan vaqtda avtomatik yuboriladi
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Broadcast History */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Yuborilgan xabarlar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {broadcasts.map((broadcast, index) => (
                  <motion.div
                    key={broadcast.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <Badge variant="success">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Yuborilgan
                          </Badge>
                          <Badge variant="primary">
                            {getTargetLabel(broadcast.target)}
                          </Badge>
                        </div>
                        <h4 className="mb-2 font-bold text-gray-900 dark:text-white">
                          {broadcast.title}
                        </h4>
                        <p className="mb-3 text-sm text-gray-700 dark:text-gray-300">
                          {broadcast.message}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{broadcast.sent_to.toLocaleString()} ta foydalanuvchi</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatRelativeTime(broadcast.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
