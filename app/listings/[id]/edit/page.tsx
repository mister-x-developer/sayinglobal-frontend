'use client'

/**
 * Edit Listing Page
 */

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Upload, X, MapPin, DollarSign, Package, FileText,
  Image as ImageIcon, Save, AlertCircle, Trash2
} from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { toast } from '@/components/ui/Toast'

export default function EditListingPage() {
  const params = useParams<{ id: string }>()
  const publicId = Number(params?.id ?? 0)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [images, setImages] = useState<Array<{ id: string; preview: string; file?: File; existing?: boolean }>>([
    // Demo existing images
    { id: '1', preview: '/placeholder-cow-1.jpg', existing: true },
    { id: '2', preview: '/placeholder-cow-2.jpg', existing: true },
  ])

  const [formData, setFormData] = useState({
    category: 'cattle',
    title: 'Sog\'lom qoramol, 3 yoshli',
    description: 'Juda sog\'lom va kuchli qoramol. Barcha emlashlar o\'tkazilgan.',
    price: '15000000',
    currency: 'UZS',
    is_negotiable: true,
    
    age_years: '3',
    age_months: '0',
    weight_kg: '450',
    gender: 'male',
    breed: 'Mahalliy nasl',
    health_status: 'A\'lo',
    vaccination_status: 'Barcha emlashlar o\'tkazilgan',
    
    region: 'Toshkent',
    district: 'Chirchiq',
    location: 'Toshkent viloyati, Chirchiq tumani',
  })

  const categories = [
    { id: 'cattle', name: 'Qoramol' },
    { id: 'sheep', name: 'Qo\'y' },
    { id: 'goats', name: 'Echki' },
    { id: 'horses', name: 'Ot' },
    { id: 'camels', name: 'Tuya' },
    { id: 'poultry', name: 'Parranda' },
  ]

  const regions = [
    'Toshkent',
    'Samarqand',
    'Buxoro',
    'Andijon',
    'Farg\'ona',
    'Namangan',
    'Qashqadaryo',
    'Surxondaryo',
    'Jizzax',
    'Navoiy',
    'Sirdaryo',
    'Xorazm',
    'Qoraqalpog\'iston',
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked,
      })
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    if (images.length + files.length > 10) {
      toast.error('Maksimal rasm soni', 'Eng ko\'pi bilan 10 ta rasm yuklash mumkin')
      return
    }

    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Fayl hajmi', `${file.name} hajmi 5MB dan oshmasligi kerak`)
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setImages((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substr(2, 9),
            preview: reader.result as string,
            file,
          },
        ])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (images.length === 0) {
      toast.error('Rasm talab qilinadi', 'Kamida bitta rasm yuklang')
      return
    }

    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success('E\'lon yangilandi', 'O\'zgarishlar saqlandi')
      router.push(`/listings/${publicId}`)
    } catch (error) {
      toast.error('Xatolik', 'E\'lonni yangilashda xatolik yuz berdi')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success('E\'lon o\'chirildi')
      router.push('/profile')
    } catch (error) {
      toast.error('Xatolik', 'E\'lonni o\'chirishda xatolik yuz berdi')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <div className="container-premium py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-4xl"
        >
          {/* Header */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                E'lonni tahrirlash
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                E'lon ma'lumotlarini yangilang
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(true)}
              className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              O'chirish
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Images Upload */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-brand-primary/10 p-2">
                    <ImageIcon className="h-5 w-5 text-brand-primary" />
                  </div>
                  <CardTitle>Rasmlar</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {images.map((image) => (
                    <div key={image.id} className="group relative aspect-square overflow-hidden rounded-xl">
                      <img
                        src={image.preview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(image.id)}
                        className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {image.existing && (
                        <div className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white">
                          Mavjud
                        </div>
                      )}
                    </div>
                  ))}

                  {images.length < 10 && (
                    <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 transition-colors hover:border-brand-primary hover:bg-brand-primary/5 dark:border-gray-600">
                      <Upload className="mb-2 h-8 w-8 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Rasm yuklash
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {images.length}/10 rasm. Har biri 5MB dan oshmasligi kerak.
                </p>
              </CardContent>
            </Card>

            {/* Category */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/20">
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle>Kategoriya</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-3">
                  {categories.map((category) => (
                    <label
                      key={category.id}
                      className={`cursor-pointer rounded-xl border-2 p-4 text-center transition-all ${
                        formData.category === category.id
                          ? 'border-brand-primary bg-brand-primary/5'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="category"
                        value={category.id}
                        checked={formData.category === category.id}
                        onChange={handleChange}
                        className="hidden"
                        required
                      />
                      <span className="font-medium">{category.name}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/20">
                    <FileText className="h-5 w-5 text-green-600" />
                  </div>
                  <CardTitle>Asosiy ma'lumotlar</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Sarlavha *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 transition-colors focus:border-brand-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tavsif *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 transition-colors focus:border-brand-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Narx *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        required
                        min="0"
                        className="h-12 w-full rounded-xl border-2 border-gray-200 bg-white pl-12 pr-4 transition-colors focus:border-brand-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Valyuta
                    </label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className="h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 transition-colors focus:border-brand-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800"
                    >
                      <option value="UZS">UZS (so'm)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_negotiable"
                    name="is_negotiable"
                    checked={formData.is_negotiable}
                    onChange={handleChange}
                    className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                  />
                  <label htmlFor="is_negotiable" className="text-sm text-gray-700 dark:text-gray-300">
                    Narx kelishiladi
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Animal Details */}
            <Card>
              <CardHeader>
                <CardTitle>Hayvon haqida</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Yoshi (yil)
                    </label>
                    <input
                      type="number"
                      name="age_years"
                      value={formData.age_years}
                      onChange={handleChange}
                      min="0"
                      className="h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 transition-colors focus:border-brand-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Yoshi (oy)
                    </label>
                    <input
                      type="number"
                      name="age_months"
                      value={formData.age_months}
                      onChange={handleChange}
                      min="0"
                      max="11"
                      className="h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 transition-colors focus:border-brand-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Vazni (kg)
                    </label>
                    <input
                      type="number"
                      name="weight_kg"
                      value={formData.weight_kg}
                      onChange={handleChange}
                      min="0"
                      className="h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 transition-colors focus:border-brand-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Jinsi
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 transition-colors focus:border-brand-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800"
                    >
                      <option value="">Tanlang</option>
                      <option value="male">Erkak</option>
                      <option value="female">Urg'ochi</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nasl
                    </label>
                    <input
                      type="text"
                      name="breed"
                      value={formData.breed}
                      onChange={handleChange}
                      className="h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 transition-colors focus:border-brand-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Sog'ligi
                  </label>
                  <input
                    type="text"
                    name="health_status"
                    value={formData.health_status}
                    onChange={handleChange}
                    className="h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 transition-colors focus:border-brand-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Emlashlar
                  </label>
                  <input
                    type="text"
                    name="vaccination_status"
                    value={formData.vaccination_status}
                    onChange={handleChange}
                    className="h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 transition-colors focus:border-brand-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900/20">
                    <MapPin className="h-5 w-5 text-purple-600" />
                  </div>
                  <CardTitle>Joylashuv</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Viloyat *
                    </label>
                    <select
                      name="region"
                      value={formData.region}
                      onChange={handleChange}
                      required
                      className="h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 transition-colors focus:border-brand-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800"
                    >
                      <option value="">Viloyatni tanlang</option>
                      {regions.map((region) => (
                        <option key={region} value={region}>
                          {region}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tuman/Shahar *
                    </label>
                    <input
                      type="text"
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      required
                      className="h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 transition-colors focus:border-brand-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    To'liq manzil
                  </label>
                  <textarea
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    rows={2}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 transition-colors focus:border-brand-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                type="submit"
                size="lg"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saqlanmoqda...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-5 w-5" />
                    Saqlash
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Bekor qilish
              </Button>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="E'lonni o'chirish"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Haqiqatan ham bu e'lonni o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.
          </p>

          <div className="flex gap-3">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setShowDeleteModal(false)}
            >
              Bekor qilish
            </Button>
            <Button
              fullWidth
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              O'chirish
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
