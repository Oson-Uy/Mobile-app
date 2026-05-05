import React from "react";
import { Image, type ImageStyle, type StyleProp } from "react-native";

/** Тот же файл, что `frontend/public/osonuy-logo-removebg-preview.png` (скрипт `scripts/generate-brand-assets.py`). */
const SRC = require("../../assets/brand-logo.png");

const ASPECT = 513 / 486;

type Props = {
  /** Высота логотипа; ширина подбирается по пропорциям исходника. */
  size?: number;
  style?: StyleProp<ImageStyle>;
};

export function BrandLogo({ size = 64, style }: Props) {
  return (
    <Image
      source={SRC}
      accessibilityRole="image"
      accessibilityLabel="Oson Uy"
      style={[{ width: size * ASPECT, height: size }, style]}
      resizeMode="contain"
    />
  );
}
