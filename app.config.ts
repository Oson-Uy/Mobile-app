import "dotenv/config";

/** Android adaptive icon: белый фон — синяя круглая иконка смотрится как на iOS. */
const ADAPTIVE_ICON_BG = "#FFFFFF";
/** Splash: белый фон — тёмно-синее лого не теряется на синей подложке. */
const SPLASH_BG = "#FFFFFF";

export default ({ config }: any) => ({
  ...config,
  name: "Oson Uy",
  slug: "oson-uy",
  version: "1.2.0",
  orientation: "portrait",
  scheme: "osonuy",
  newArchEnabled: true,
  userInterfaceStyle: "automatic",
  icon: "./assets/osonuy-logo-mini-removedbg.png",
  splash: {
    image: "./assets/osonuy-logo-mini-removedbg.png",
    resizeMode: "contain",
    backgroundColor: SPLASH_BG,
    dark: {
      image: "./assets/osonuy-logo-mini-removedbg.png",
      backgroundColor: SPLASH_BG,
    },
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.osonuy.app",
    buildNumber: "3",
    infoPlist: {
      UIBackgroundModes: ["remote-notification"],
      NSPhotoLibraryUsageDescription:
        "Используется для загрузки фотографий проекта.",
      NSCameraUsageDescription:
        "Используется для съёмки фотографий проекта.",
    },
  },
  android: {
    package: "uz.osonuy.app",
    versionCode: 4,
    adaptiveIcon: {
      foregroundImage: "./assets/icon.png",
      backgroundColor: ADAPTIVE_ICON_BG,
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: "./assets/favicon.png",
    bundler: "metro",
  },
  plugins: [
    ...new Set([
      ...(config.plugins ?? []),
      "expo-router",
      [
        "expo-notifications",
        {
          enableBackgroundRemoteNotifications: true,
        },
      ],
      "expo-secure-store",
      "expo-font",
      "expo-video",
      [
        "expo-image-picker",
        {
          photosPermission: "Используется для загрузки фотографий проекта.",
          cameraPermission: "Используется для съёмки фотографий проекта.",
        },
      ],
      [
        "expo-splash-screen",
        {
          image: "./assets/osonuy-logo-mini-removedbg.png",
          resizeMode: "contain",
          backgroundColor: SPLASH_BG,
          dark: {
            image: "./assets/osonuy-logo-mini-removedbg.png",
            backgroundColor: SPLASH_BG,
          },
        },
      ],
    ]),
  ],
  extra: {
    ...config.extra,
    // Release APK из Android Studio часто собирается без .env — localhost на устройстве даёт «вечную» загрузку.
    apiUrl:
      process.env.EXPO_PUBLIC_API_URL?.trim() ||
      "https://api.oson-uy.uz",
    heroVideoUrl: process.env.EXPO_PUBLIC_HERO_VIDEO_URL ?? "",
    eas: {
      ...(config.extra?.eas ?? {}),
      projectId:
        config.extra?.eas?.projectId ??
        "b30a68b1-e29e-4779-b817-dc60054440a1",
    },
  },
});
