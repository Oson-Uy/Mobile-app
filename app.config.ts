import "dotenv/config";

/** Android adaptive icon: белый фон под foreground (лого). */
const ADAPTIVE_ICON_BG = "#FFFFFF";
/** Splash: белый фон — тёмно-синее лого не теряется на синей подложке. */
const SPLASH_BG = "#FFFFFF";

export default ({ config }: any) => ({
  ...config,
  name: "Oson Uy",
  slug: "oson-uy",
  version: "1.0.0",
  orientation: "portrait",
  scheme: "osonuy",
  /** На части Android-устройств New Arch + Fabric давали «вечный» нативный splash без первого кадра RN. */
  newArchEnabled: false,
  userInterfaceStyle: "automatic",
  icon: "./assets/icon.png",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: SPLASH_BG,
    dark: {
      image: "./assets/splash.png",
      backgroundColor: SPLASH_BG,
    },
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.osonuy.app",
    buildNumber: "1",
    infoPlist: {
      UIBackgroundModes: ["remote-notification"],
    },
  },
  android: {
    package: "com.osonuy.app",
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
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
      "expo-secure-store",
      "expo-font",
      "expo-video",
      [
        "expo-splash-screen",
        {
          image: "./assets/splash.png",
          resizeMode: "contain",
          backgroundColor: SPLASH_BG,
          dark: {
            image: "./assets/splash.png",
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
  },
});
