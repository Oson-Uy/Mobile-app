import "dotenv/config";

const BRAND_BLUE = "#1E3A8A";

export default ({ config }: any) => ({
  ...config,
  name: "Oson Uy",
  slug: "oson-uy",
  version: "1.0.0",
  orientation: "portrait",
  scheme: "osonuy",
  newArchEnabled: true,
  userInterfaceStyle: "automatic",
  icon: "./assets/icon.png",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: BRAND_BLUE,
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
      backgroundColor: BRAND_BLUE,
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
      "expo-splash-screen",
    ]),
  ],
  extra: {
    ...config.extra,
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3002",
    heroVideoUrl: process.env.EXPO_PUBLIC_HERO_VIDEO_URL ?? "",
  },
});
