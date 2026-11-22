# Build APK Android lokal

Untuk menjalankan di Expo Go tidak perlu APK. Untuk menghasilkan APK standalone, folder android sudah disertakan.

Prasyarat: Android SDK (platform/build-tools sesuai Expo SDK 54), JDK yang kompatibel dengan Gradle 8.14.3 (misalnya JDK 17/21; build lokal ini menggunakan JDK 18), Node.js dan dependensi npm.

Pada Windows, gunakan lokasi project yang pendek (contoh C:/Users/NAMA/Downloads/cs). Folder bertingkat panjang dapat membuat Ninja/CMake gagal pada batas 260 karakter. Build yang diverifikasi menggunakan salinan pendek, tanpa memindahkan source utama.

1. Jalankan npm ci dari root.
2. Set JAVA_HOME ke JDK yang kompatibel; jangan mengubah Java sistem. Set ANDROID_HOME ke folder SDK Android pada sesi terminal tersebut.
3. Jika android/app/debug.keystore belum ada pada hasil clone, buat kunci debug standar dengan keytool. File ini sengaja tidak masuk Git:

```powershell
& "$env:JAVA_HOME/bin/keytool.exe" -genkeypair -storetype JKS -keystore android/app/debug.keystore -storepass android -alias androiddebugkey -keypass android -dname 'CN=Android Debug,O=Android,C=US' -keyalg RSA -keysize 2048 -validity 10000
```

4. Dari root jalankan:

```powershell
cd android
.\gradlew.bat :app:assembleRelease --no-daemon '-PreactNativeArchitectures=arm64-v8a,x86_64'
```

Hasil yang dicari: android/app/build/outputs/apk/release/app-release.apk. Build ini memuat JavaScript dan aset, sehingga tidak memerlukan Metro saat dibuka. Dua ABI mencakup Android ARM64 dan emulator x86_64; perangkat ARMv7 lama memerlukan build ABI tambahan.

APK ditandatangani dengan kunci debug untuk demonstrasi internal tugas. Ini bukan konfigurasi penandatanganan Play Store. Gunakan signing key pribadi untuk publikasi produksi.

Untuk API pada APK, deploy backend ke HTTPS lalu atur URL lewat Profil → Sumber Katalog. Tidak perlu membangun ulang APK ketika URL API berubah. Mode demo tersedia sebelum backend online.

Jangan memakai npm run check:bundle sebagai bukti APK; perintah tersebut hanya mengekspor bundle Metro. Bukti APK adalah file .apk hasil Gradle yang berhasil diverifikasi.
