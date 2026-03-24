# Btaf Vpn (Flutter)

This project has been converted from a React Web Preview into a full-stack Flutter application.

## Project Structure

- `lib/main.dart`: The core application logic (Firebase, AdMob, VPN UI).
- `pubspec.yaml`: Project dependencies.
- `android/`: Android-specific configuration (Permissions, AdMob App ID).
- `.github/workflows/build.yml`: GitHub Actions workflow for building APK and AAB.

## How to Build

### Local Build

1.  Install Flutter SDK: [flutter.dev](https://docs.flutter.dev/get-started/install)
2.  Run `flutter pub get` to install dependencies.
3.  Connect an Android device or emulator.
4.  Run `flutter run`.

### GitHub Build (APK/AAB)

1.  Push this project to a GitHub repository.
2.  The `.github/workflows/build.yml` will automatically trigger.
3.  Go to the **Actions** tab on GitHub to download the generated **Debug APK** and **Release AAB**.

### Important Notes

- **Firebase**: You must add your `google-services.json` to `android/app/` for Firebase to work on Android.
- **Signing**: For the Release AAB to be accepted by the Play Store, you must set up `key.properties` and signing configurations in `android/app/build.gradle`.
- **VPN**: The current code includes the UI and logic for VPN. For real tunneling, you may need to integrate a native plugin like `flutter_vpn` or `wireguard_flutter` depending on your backend.
