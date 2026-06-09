# 📱 Mobil Ilovalar - SAYIN GLOBAL

Bu loyihada ikkita mobil ilova mavjud:
1. **Sayin Global** - Foydalanuvchilar uchun asosiy ilova
2. **Admin SA** - Administratorlar uchun boshqaruv ilovasi

## 📋 Talab qilinadigan dasturlar

- Node.js 22.x
- npm 10+
- Android Studio (Android uchun)
- Xcode (iOS uchun, faqat macOS)

## 🚀 Ilovalarni yaratish

### 1. Mobile assetlarni yaratish (bir marta)

Barcha ikonlar va splash screenlarni yaratish uchun:

```bash
npm run generate:assets
```

Bu buyruq quyidagilarni yaratadi:
- User app ikoner (yashil rang, #10b981)
- Admin app ikoner (ko'k rang, #3b82f6)
- PWA ikoner
- Barcha o'lchamdagi splash screenlar

### 2. User App sozlash (Sayin Global)

```bash
npm run setup:user-app
```

Bu buyruq:
- Next.js dasturini export rejimida build qiladi
- Capacitor'ni sozlaydi
- Android va iOS platformalarini qo'shadi
- Barcha resurslarni (ikonlar, splash) nusxalaydi

### 3. Admin App sozlash (Admin SA)

```bash
npm run setup:admin-app
```

Bu buyruq:
- Next.js dasturini admin rejimida build qiladi
- Capacitor'ni alohida sozlaydi
- Android va iOS platformalarini alohida papkalarga qo'shadi
- Admin app resurslarini nusxalaydi

## 🛠️ Ishlab chiqish

### Android Studio'da ochish

**User App:**
```bash
npm run android:user
```

**Admin App:**
```bash
npm run android:admin
```

### Xcode'da ochish (macOS faqat)

**User App:**
```bash
npm run ios:user
```

**Admin App:**
```bash
npm run ios:admin
```

## 📦 Build qilish

### User App

1. Frontend o'zgarishlarini build qilish:
```bash
npm run build:user
```

2. Native loyihalarni yangilash:
```bash
npx cap sync
```

3. Android Studio yoki Xcode'da APK/IPA build qilish

### Admin App

1. Frontend o'zgarishlarini build qilish:
```bash
npm run build:admin
```

2. Capacitor config'ni almashtirish:
```bash
cp capacitor.config.admin.ts capacitor.config.ts
```

3. Native loyihalarni yangilash:
```bash
npx cap sync
```

4. Android Studio yoki Xcode'da APK/IPA build qilish

## 📱 App ma'lumotlari

### User App (Sayin Global)
- **App ID:** com.sayinglobal.user
- **App Nomi:** Sayin Global
- **Rang:** Yashil (#10b981)
- **Maqsad:** Foydalanuvchilar uchun e'lonlar, chat, profil

### Admin App (Admin SA)
- **App ID:** com.sayinglobal.admin
- **App Nomi:** Admin SA
- **Rang:** Ko'k (#3b82f6)
- **Maqsad:** Administratorlar uchun boshqaruv paneli

## 🔧 Muhim fayllar

- `capacitor.config.user.ts` - User app konfiguratsiyasi
- `capacitor.config.admin.ts` - Admin app konfiguratsiyasi
- `lib/capacitor.ts` - Capacitor utility funksiyalar
- `styles/mobile.css` - Mobil uchun maxsus CSS
- `components/providers/CapacitorApp.tsx` - App initialization

## 📝 Xususiyatlar

✅ Safe area support (notched qurilmalar uchun)
✅ Splash screen
✅ Status bar sozlamalari
✅ Back button boshqaruvi (Android)
✅ Deep linking support
✅ Hardware acceleration
✅ Pull-to-refresh o'chirilgan
✅ Touch optimizatsiyasi
✅ Native transitions

## 🎨 Dizayn

- Logo: `/logo.png` (1024x1024)
- User app ranglar: Yashil gradient
- Admin app ranglar: Ko'k gradient
- Responsive dizayn barcha qurilmalarda
- Dark mode support

## 🔍 Debugging

### Android

```bash
# Logcat ko'rish
adb logcat | grep -i capacitor

# Chrome DevTools
chrome://inspect
```

### iOS

```bash
# Safari Web Inspector ishlatish
# Safari > Develop > [Qurilma nomi] > [App]
```

## 📚 Qo'shimcha

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Studio Guide](https://developer.android.com/studio)
- [Xcode Guide](https://developer.apple.com/xcode/)

## ⚠️ E'tibor bering

1. Har safar frontend o'zgarganda `npm run build:user` yoki `npm run build:admin` ishlatish kerak
2. Yangi plugin qo'shganda `npx cap sync` bajarish kerak
3. Native kod o'zgarganda Android Studio/Xcode'da qayta build qilish kerak
4. Logo o'zgarganda `npm run generate:assets` qayta ishga tushirish kerak

## 🎯 Production uchun tayyorlash

1. ✅ Barcha assetlar yaratildi
2. ✅ Ikkala app sozlandi
3. ✅ Mobil optimizatsiyalar qo'shildi
4. ✅ Safe area support
5. ✅ Splash screens
6. ✅ App ikonlar

### Keyingi qadamlar:

1. Android Studio'da signed APK/AAB yaratish
2. Google Play Console'ga yuklash
3. iOS uchun App Store Connect'ga yuklash
4. Testing va QA
5. Production release

## 📞 Muammolar

Agar muammo bo'lsa:
1. `node_modules` va `out` papkalarini o'chiring
2. `npm install` qiling
3. `npm run generate:assets` qiling
4. Setup scriptlarni qayta ishga tushiring
