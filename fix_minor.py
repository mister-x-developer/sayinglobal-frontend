import os

def replace_in_file(filepath, old_text, new_text):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace(old_text, new_text)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# ErrorBoundary
replace_in_file("components/providers/ErrorBoundary.tsx",
                "Kutilmagan xatolik yuz berdi.",
                "{t('error.unexpected') || 'Kutilmagan xatolik yuz berdi.'}")
replace_in_file("components/providers/ErrorBoundary.tsx",
                "<h2>Kutilmagan xatolik yuz berdi.</h2>",
                "<h2>{t('error.unexpected') || 'Kutilmagan xatolik yuz berdi.'}</h2>")

# AdminLayout
replace_in_file("components/layout/AdminLayout.tsx",
                "Saytga o&apos;tish (Kuzatuv)",
                "{t('admin.nav.visitSite') || 'Saytga o\\'tish (Kuzatuv)'}")

# Edit pages loading
replace_in_file("app/listings/detail/edit/page.tsx",
                "Yuklanmoqda...",
                "{t('common.loading') || 'Loading...'}")
replace_in_file("app/admin/listings/detail/edit/page.tsx",
                "Yuklanmoqda...",
                "{t('common.loading') || 'Loading...'}")

# admin page
replace_in_file("app/admin/page.tsx",
                "Overall view count and interactions across all listings.",
                "{t('admin.stats.overallViewDesc') || 'Barcha e\\'lonlar bo\\'yicha ko\\'rishlar soni.'}")
replace_in_file("app/admin/page.tsx",
                "Global Search",
                "{t('admin.search.title') || 'Global Qidiruv'}")
replace_in_file("app/admin/page.tsx",
                "Quickly find users, listings, or complaints.",
                "{t('admin.search.desc') || 'Foydalanuvchilar, e\\'lonlar yoki shikoyatlarni tez toping.'}")

# admin login
replace_in_file("app/admin/login/page.tsx",
                "placeholder=\"Username\"",
                "placeholder={t('auth.username') || 'Username'}")
replace_in_file("app/admin/login/page.tsx",
                "placeholder=\"Password\"",
                "placeholder={t('auth.password') || 'Password'}")
                
print("Replaced all minor strings.")
