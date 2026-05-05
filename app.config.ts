import "dotenv/config";

export default ({ config }: any) => ({
  ...config,
  name: config.name ?? "Oson Uy",
  slug: config.slug ?? "oson-uy",
  plugins: [
    ...new Set([...(config.plugins ?? []), "expo-secure-store", "expo-font"]),
  ],
  extra: {
    ...config.extra,
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3002",
    heroVideoUrl: process.env.EXPO_PUBLIC_HERO_VIDEO_URL ?? "",
  },
});

