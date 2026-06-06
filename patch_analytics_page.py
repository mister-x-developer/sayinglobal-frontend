import re

file_path = '/home/lochinbek/Desktop/sayinglobal/frontend/app/admin/analytics/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Make sure next-intl is imported
if 'useTranslations' not in content:
    content = content.replace("import { motion } from 'framer-motion'", "import { motion } from 'framer-motion'\nimport { useTranslations } from 'next-intl'")

# Add const t = useTranslations() if missing
if 'const t = useTranslations()' not in content:
    content = content.replace('export default function AdminAnalyticsPage() {', "export default function AdminAnalyticsPage() {\n  const t = useTranslations('adminAnalytics')")

# Replacements
replacements = [
    (r"label: 'Jami foydalanuvchilar'", "label: t('totalUsers')"),
    (r"sub: `\+\$\{dashboard.users.new_today\} bugun`", "sub: `+${dashboard.users.new_today} ${t('todaySuffix')}`"),
    (r"label: 'Faol foydalanuvchilar \(30 kun\)'", "label: t('activeUsers30')"),
    (r"sub: `\$\{Math\.round\(\(dashboard\.users\.active / Math\.max\(dashboard\.users\.total, 1\)\) \* 100\)\}% faol`", "sub: `${Math.round((dashboard.users.active / Math.max(dashboard.users.total, 1)) * 100)}${t('activePctSuffix')}`"),
    (r'label: "Faol e\'lonlar"', "label: t('activeListings')"),
    (r"sub: `\$\{formatNumber\(dashboard\.listings\.total\)\} jami`", "sub: `${formatNumber(dashboard.listings.total)} ${t('totalSuffix')}`"),
    (r'label: "Ko\'rishlar"', "label: t('views')"),
    (r"sub: `\+\$\{dashboard\.engagement\.views_today\} bugun`", "sub: `+${dashboard.engagement.views_today} ${t('todaySuffix')}`"),
    
    (r'<h1 className="text-3xl font-bold text-fg">Analitika</h1>', '<h1 className="text-3xl font-bold text-fg">{t(\'title\')}</h1>'),
    (r'<p className="mt-1 text-fg-muted">Platforma statistikasi va hisobotlar</p>', '<p className="mt-1 text-fg-muted">{t(\'subtitle\')}</p>'),
    
    (r'<option value=\{7\}>Soʻnggi 7 kun</option>', '<option value={7}>{t(\'last7Days\')}</option>'),
    (r'<option value=\{30\}>Soʻnggi 30 kun</option>', '<option value={30}>{t(\'last30Days\')}</option>'),
    (r'<option value=\{90\}>Soʻnggi 90 kun</option>', '<option value={90}>{t(\'last90Days\')}</option>'),
    (r'<option value=\{365\}>Soʻnggi yil</option>', '<option value={365}>{t(\'lastYear\')}</option>'),
    
    (r'Eʼlonlar holati boʻyicha', "{t('listingsStatus')}"),
    
    (r"const statusTranslations: Record<string, string> = \{ active: 'Faol', pending: 'Kutilmoqda', pending_review: 'Qayta ko\\'rib chiqish', rejected: 'Rad etilgan', sold: 'Sotilgan', expired: 'Muddati o\\'tgan' \}", ""),
    (r"statusTranslations\[s\.status\] \|\|", "t(`status.${s.status}` as any) ||"),
    
    (r'Foydalanuvchilar oʻsishi \(soʻnggi \{days\} kun\)', "{t('usersGrowth', { days })}"),
    (r'Eʼlonlar oʻsishi \(soʻnggi \{days\} kun\)', "{t('listingsGrowth', { days })}"),
    (r'Koʻrishlar \(soʻnggi \{Math\.min\(days, 14\)\} kun\)', "{t('viewsGrowth', { days: Math.min(days, 14) })}"),
    (r'Xabarlar \(soʻnggi \{Math\.min\(days, 14\)\} kun\)', "{t('messagesGrowth', { days: Math.min(days, 14) })}"),
    
    (r'Kategoriyalar boʻyicha', "{t('categoriesBreakdown')}"),
    (r'Eventlar taqsimoti', "{t('eventsDistribution')}"),
    
    (r"const EVENT_TRANSLATIONS: Record<string, string> = \{[^\}]+\}", ""),
    (r"EVENT_TRANSLATIONS\[e\.event_type\] \|\|", "t(`events.${e.event_type}` as any) ||"),
    (r"EVENT_TRANSLATIONS\[ev\.event_type\] \|\|", "t(`events.${ev.event_type}` as any) ||"),
]

for old, new in replacements:
    content = re.sub(old, new, content, flags=re.MULTILINE)

# Also fix the import if we need it
if "import { useTranslations } from 'next-intl'" not in content:
    content = "import { useTranslations } from 'next-intl'\n" + content

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated page.tsx")
