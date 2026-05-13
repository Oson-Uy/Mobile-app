import React from "react";
import { Image, type ImageStyle, type StyleProp } from "react-native";

/** Совпадает с `frontend/public/osonuy-logo-mini-removedbg.png` — только в приложении (не в веб-шапке). */
const SRC = require("../../assets/osonuy-logo-mini-removedbg.png");

const ASPECT = 214 / 213;

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
