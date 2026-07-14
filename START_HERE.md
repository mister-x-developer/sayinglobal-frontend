# 🚀 BOSHLASH - Mobil Ilovalar Uchun

## BIRINCHI QADAM: BU FAYLNI OʻQING! ⚠️

Sizda **2ta alohida mobil ilova** mavjud:
1. **Sayin Global** - Foydalanuvchilar uchun (yashil rang)
2. **Admin SA** - Administratorlar uchun (koʻk rang)

---

## ⚡ TEZ BOSHLASH (5 DAQIQA)

```bash
# 1. Frontendga oʻtish
cd frontend

# 2. Barcha ilovalarni yaratish
./BUILD_APPS.sh
```

**VA TAYYOR!** ✅

---

## 📱 ILOVALARNI OCHISH

### User App (Sayin Global)
```bash
npm run android:user    # Android Studio
npm run ios:user        # Xcode (macOS)
```

### Admin App (Admin SA)
```bash
npm run android:admin   # Android Studio
npm run ios:admin       # Xcode (macOS)
```

---

## 📚 TOʻLIQ QOLLANMALAR

Har bir bosqich uchun batafsil ma'lumot:

1. **MOBILE_APPS.md** - Ishlab chiqish qoʻllanmasi
2. **../MOBILE_DEPLOYMENT_GUIDE.md** - Deploy qilish qoʻllanmasi
3. **../MOBILE_APPS_README.md** - Umumiy ma'lumot
4. **../FINAL_MOBILE_SUMMARY.md** - Yakuniy summary

---

## 🎯 MUAMMOLAR?

### Agar biror narsa ishlamasa:

```bash
# Hamma narsani tozalash
rm -rf node_modules out .next android android-admin ios ios-admin

# Qaytadan oʻrnatish
npm install

# Assetlarni qayta yaratish
npm run generate:assets

# Setup qayta ishlatish
npm run setup:user-app
npm run setup:admin-app
```

---

## ✅ KEYINGI QADAMLAR

1. ✅ `./BUILD_APPS.sh` ishlatish
2. ✅ Android Studio / Xcode'da ochish
3. ✅ Test qilish
4. ✅ APK/IPA build qilish
5. ✅ Store'larga yuklash

---

## 🎨 APP MA'LUMOTLARI

**Sayin Global (User):**
- Package: com.sayinglobal.user
- Rang: Yashil (#10b981)
- Logo: /logo.png

**Admin SA (Admin):**
- Package: com.sayinglobal.admin
- Rang: Koʻk (#3b82f6)
- Logo: /logo.png

---

**OMAD! 🚀**
