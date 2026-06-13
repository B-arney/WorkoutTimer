# Mobil alkalmazásfejlesztés — Projektmunka

> **Projekt téma:** Időmérő alkalmazás edzésekhez  
> **Keretrendszer:** Expo React Native  

---

[workout selection screen](Screenshot_20260613_091553_Mobil_Alkalmazasfejlesztes.jpg)
[active workout](Screenshot_20260613_091535_Mobil_Alkalmazasfejlesztes.jpg)

---

## 🚀 A projekt indítása (lokális futtatás)

### Előfeltételek

> **TypeScript** for type safety
> **NativeWind (Tailwind CSS)** for styling
> **Expo Router** for file-based navigation
> **Expo SQLite** for local database management
> **Jest & React Native Testing Library** for testing

### Telepítés és futtatás

```bash
git clone projektmunka-B-arney
cd Mobil_Alkalmazasfejlesztes

npm install
npm run android
```

---

## 📱 Letöltés / Telepítés

- **APK Letöltés:** Az alkalmazás APK verziója (Android) letölthető a [Releases](https://github.com/b-arney/Mobil_Alkalmazasfejlesztes/releases) oldalon keresztül.
- A GitHub Release lépései:
  1. \`eas build -p android --profile preview\`
  2. A létrejött APK feltöltése a legújabb GitHub Release-hez.

## 🧪 E2E tesztelés és Autentikáció

A projekt Detox alapú End-to-End (E2E) teszteket használ a bejelentkezési és munkamenet (workout) létrehozási folyamatokhoz.

### E2E Tesztek Futtatása (Lokálisan)
1. Győződj meg róla, hogy az Android Emulator fut, vagy van csatlakozott eszközöd (\`adb devices\`).
2. Futtasd a teszt szkriptet:
   \`\`\`bash
   npm run e2e
   \`\`\`
Ez lefordítja az alkalmazást egy \`android.emu.debug\` build-ként, majd elindítja a teszteket a konfigurált emulátoron.

### Autentikáció
A Firebase Auth alapú bejelentkezés integrált. Regisztráció vagy bejelentkezés szükséges a "Workout Plans" oldal megtekintéséhez, valamint edzéstervek létrehozásához. Az app automatikusan \`auth/login\`-ra irányít, ha nincs bejelentkezve felhasználó.

---
