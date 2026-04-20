<!-- mobile-app/local-build-commands.md -->

# EAS Local Builds

> Build your app locally to avoid using your 30 monthly cloud build credits.  
> Output is identical to a cloud build — same `eas.json` profiles, same artifacts.

---

## Basic Command

```bash
eas build --local --platform android
eas build --local --platform ios
```

---

## Prerequisites

### Android
- **Java JDK 17** — [Download](https://adoptium.net/)
- **Android SDK** — easiest via [Android Studio](https://developer.android.com/studio)
- Set `ANDROID_HOME` environment variable

### iOS
- **macOS only** — no exceptions, Apple enforces this
- **Xcode** — install from the Mac App Store
- **CocoaPods** — `sudo gem install cocoapods`

---

## Common Build Commands

```bash
# APK for device testing / internal distribution
eas build --local --platform android --profile preview

adb devices
Then install (use the full path or drag the file into Terminal after typing adb install ):textadb install /Users/godwinmbessey/Documents/project/i-am-alive-app/mobile-app/build-1773943390449.apkOr shorter if you're in the folder:textcd /Users/godwinmbessey/Documents/project/i-am-alive-app/mobile-app
adb install build-1773943390449.apk



# AAB for Google Play Store submission
eas build --local --platform android --profile production

# IPA for TestFlight / App Store submission
eas build --local --platform ios --profile production
```


# Build a debug APK locally (fastest, no signing needed)
npx expo run:android --variant release

# OR if you want the EAS local build with your preview profile:
eas build --local --platform android --profile preview

Output files are saved to your **project root** on completion.

---

## Troubleshooting

If you hit dependency errors before or during a local build, run:

```bash
npm install
npx expo install --fix
```

Then retry the build.

---

## Notes

| | Cloud Build | Local Build |
|---|---|---|
| Uses monthly quota | ✓ | ✗ |
| Requires local tooling | ✗ | ✓ |
| iOS support | ✓ | Mac only |
| Uses `eas.json` profiles | ✓ | ✓ |
| Output artifact | Same | Same |oject root directory when done.
What platform are you targeting — Android, iOS, or both?



es, you can absolutely build an AAB locally using EAS Local Build. The output is exactly the same format that Google Play requires for publishing.

So if your goal is uploading to the Google Play Store, a local .aab build works perfectly.

Build Android AAB Locally (Play Store Ready)

Run this command in your project root:

eas build --local --platform android --profile production
What this does

Uses your eas.json production profile

Builds the app on your machine instead of Expo servers

Produces a .aab file

Example output:

build-1738291023.aab