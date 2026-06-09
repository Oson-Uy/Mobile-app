# Инструкция по сборке релизного приложения

## Требования (один раз)

| Инструмент | Версия | Как проверить |
|---|---|---|
| Node.js | 18+ | `node --version` |
| Ruby | 3.2+ | `ruby --version` |
| CocoaPods | 1.16+ | `pod --version` |
| Xcode | 15+ | App Store |
| Android Studio | Hedgehog+ | — |
| Java (JDK) | 17+ | `java --version` |

---

## ЧАСТЬ 1 — iOS (Xcode)

### 1.1 Установить правильный Ruby (один раз)

macOS идёт с Ruby 2.6 — он слишком старый для CocoaPods 1.16+.
Нужно установить Ruby 3.2 через `rbenv`:

```bash
# Установить rbenv
brew install rbenv ruby-build

# Добавить в ~/.zshrc
echo 'eval "$(rbenv init - zsh)"' >> ~/.zshrc
source ~/.zshrc

# Установить Ruby 3.2
rbenv install 3.2.2
rbenv global 3.2.2

# Проверить
ruby --version   # должно быть 3.2.x

# Установить CocoaPods для этого Ruby
gem install cocoapods
pod --version    # должно быть 1.16.x
```

### 1.2 Установить зависимости JS

```bash
cd /Users/sardor/Work/startap/Mobile-app
npm install
```

**Нижние вкладки покупателя (Каталог / Моя квартира)** — нативный tab bar через Expo Router `NativeTabs` (`app/(buyer)/_layout.tsx`). Это **не работает в Expo Go**: нужна dev-сборка или релиз (`npx expo run:ios` / Xcode Archive). Требуется `react-native-screens` 4.25+ (уже в `package.json`).

### 1.3 Установить поды (Pod Install)

```bash
cd ios
pod install --repo-update
```

Если команда зависает или падает:
```bash
# Очистить кеш и переустановить
pod cache clean --all
rm -rf Pods Podfile.lock
pod install --repo-update
```

### 1.4 Открыть Xcode

**Важно: открывать только `.xcworkspace`, не `.xcodeproj`!**

```bash
open ios/OsonUy.xcworkspace
```

### 1.5 Настроить Signing (один раз)

1. В Xcode → Project Navigator → `OsonUy` (корень)
2. Вкладка **Signing & Capabilities**
3. Target: `OsonUy`
4. Включить **Automatically manage signing**
5. Выбрать свой **Team** (Apple Developer аккаунт)
6. Bundle Identifier: `com.osonuy.app`

### 1.6 Собрать релизный IPA (Archive)

1. Вверху Xcode выбрать схему **OsonUy**
2. Устройство: **Any iOS Device (arm64)** (не симулятор!)
3. Меню **Product → Archive**
4. Дождаться окончания (5–15 минут)
5. Откроется **Organizer** — нажать **Distribute App**
6. Выбрать **App Store Connect** → **Upload** → Next → Next → Upload

> Для локального тестирования можно выбрать **Ad Hoc** вместо App Store Connect.

---

## ЧАСТЬ 2 — Android (Android Studio)

### 2.1 Сгенерировать Release Keystore (один раз!)

**Храни этот файл в безопасном месте. Без него нельзя будет обновить приложение в Play Store.**

```bash
cd /Users/sardor/Work/startap/Mobile-app/android

keytool -genkeypair -v \
  -keystore app/release.keystore \
  -alias osonuy-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Keytool спросит:
- **Enter keystore password** → придумай надёжный пароль (например `OsonUy2024!`)
- **Re-enter** → повтори
- Имя, организация — можно любые
- **Key password** → можно тот же пароль или другой

### 2.2 Создать файл `android/keystore.properties`

```bash
cp android/keystore.properties.example android/keystore.properties
```

Открыть `android/keystore.properties` и заполнить:

```
storeFile=app/release.keystore
storePassword=ТвойПарольОтKeystore
keyAlias=osonuy-key
keyPassword=ТвойПарольОтКлюча
```

### 2.3 Открыть проект в Android Studio

1. **File → Open** → выбрать папку `/Users/sardor/Work/startap/Mobile-app/android`
2. Дождаться Gradle sync (первый раз долго — скачивает зависимости)
3. Если Gradle sync завис — **File → Invalidate Caches → Invalidate and Restart**

### 2.4 Собрать APK (для тестирования)

**Вариант A — через Android Studio:**
1. Меню **Build → Generate Signed Bundle / APK**
2. Выбрать **APK** → Next
3. Key store path: выбрать `android/app/release.keystore`
4. Заполнить пароли и alias из шага 2.2
5. Build Variant: **release**
6. Destination Folder: любая
7. **Create** → подождать

**Вариант B — через терминал (быстрее):**
```bash
cd /Users/sardor/Work/startap/Mobile-app/android
./gradlew assembleRelease
```
APK будет в: `android/app/build/outputs/apk/release/app-release.apk`

### 2.5 Собрать AAB (для Google Play)

**Вариант A — через Android Studio:**
1. Меню **Build → Generate Signed Bundle / APK**
2. Выбрать **Android App Bundle** → Next
3. Заполнить keystore аналогично APK
4. **Create**

**Вариант B — через терминал:**
```bash
cd /Users/sardor/Work/startap/Mobile-app/android
./gradlew bundleRelease
```
AAB будет в: `android/app/build/outputs/bundle/release/app-release.aab`

---

## ЧАСТЬ 3 — Типичные ошибки и решения

### iOS: `pod install` падает или зависает

```bash
# Убедиться, что используется правильный Ruby
ruby --version   # должно быть 3.2+
which pod        # должен быть из rbenv, не /usr/bin/pod

# Полный сброс
cd ios
rm -rf Pods Podfile.lock
pod cache clean --all
pod install --repo-update
```

### iOS: Xcode — "No such module 'XYZ'"

После pod install всегда открывай `.xcworkspace`, а не `.xcodeproj`.
Затем в Xcode: **Product → Clean Build Folder** (Shift+Cmd+K), потом **Build**.

### iOS: "Signing requires a development team"

Xcode → Project → Signing & Capabilities → выбери свой Team.

### Android: "Gradle sync failed"

```bash
cd android
./gradlew clean
# Потом снова File → Sync Project with Gradle Files
```

### Android: "JAVA_HOME not set" или "SDK location not found"

1. Создать файл `android/local.properties`:
```
sdk.dir=/Users/ТВОЙ_USERNAME/Library/Android/sdk
```
(Android Studio создаёт его автоматически при открытии)

### Android: сборка падает с OutOfMemoryError

В `android/gradle.properties` уже выставлено `-Xmx4096m`.
Если всё ещё падает — закрыть Android Studio, убить Java процессы:
```bash
pkill -f java
cd android && ./gradlew clean && ./gradlew assembleRelease
```

### Android: "keystore.properties not found"

Убедись, что файл `android/keystore.properties` существует (не `.example`).
Без него приложение всё равно соберётся, но будет подписано debug-ключом.

---

## ЧАСТЬ 4 — Push-уведомления (TestFlight / App Store)

Приложение использует **Expo Push** (`ExponentPushToken[...]`). Разрешение в iOS ≠ рабочий push: нужны capability в сборке, APNs-ключ в Expo и токен на бэкенде.

### 4.1 После изменения `app.config.ts` (обязательно перед Archive)

```bash
cd /Users/sardor/Work/startap/Mobile-app
npx expo prebuild --platform ios --clean
cd ios && pod install
```

В Xcode → **Signing & Capabilities** → у target `OsonUy` должны быть:
- **Push Notifications**
- **Background Modes** → Remote notifications

### 4.2 APNs-ключ в Expo (без этого TestFlight молчит)

1. [Apple Developer](https://developer.apple.com) → Keys → **+** → Apple Push Notifications service (APNs) → скачать `.p8` (один раз).
2. На [expo.dev](https://expo.dev) → проект **oson-uy** → **Credentials** → iOS → загрузить APNs Key (Key ID, Team ID, `.p8`).

Или из терминала (нужен `eas login`):

```bash
eas credentials -p ios
```

### 4.3 Проверка на устройстве

1. Войти в **кабинет застройщика** (push только для ЛК, не для каталога покупателя).
2. Профиль → **«Синхронизировать push»** — должно появиться «Push-токен отправлен на сервер».
3. Бэкенд шлёт уведомления на `https://exp.host/--/api/v2/push/send` с этим Expo-токеном.

Если кнопка пишет ошибку — текст подскажет (нет projectId, отказ в разрешении, нет APNs в Expo).

---

## ЧАСТЬ 5 — Быстрый чеклист перед каждым релизом

- [ ] Обновить `version` в `app.config.ts` (например `"1.0.1"`)
- [ ] Увеличить `buildNumber` в `ios` (например `"2"`)
- [ ] Увеличить `versionCode` в `android` (например `2`)
- [ ] `npm install` — убедиться что зависимости актуальны
- [ ] `cd ios && pod install` — синхронизировать поды
- [ ] Проверить что `.env` содержит правильный `EXPO_PUBLIC_API_URL`
- [ ] `npx expo prebuild --platform ios` (если меняли plugins / bundle id)
- [ ] APNs-ключ загружен в Expo Credentials
- [ ] Сборка iOS через Xcode Archive
- [ ] Сборка Android AAB через `./gradlew bundleRelease`
- [ ] Push: вход в ЛК → «Синхронизировать push» на TestFlight-сборке
