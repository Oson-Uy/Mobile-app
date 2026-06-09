import { Platform } from "react-native";

import { spacing } from "../theme/tokens";

export const listPadding = spacing.lg;

export const searchHeight = Platform.select({ ios: 44, android: 48, default: 44 })!;

export const primaryBtnHeight = Platform.select({ ios: 48, android: 52, default: 48 })!;

export const secondaryBtnHeight = Platform.select({ ios: 44, android: 48, default: 44 })!;

export const iconButtonSize = Platform.select({ ios: 44, android: 48, default: 44 })!;

export const touchTarget = Platform.select({ ios: 44, android: 48, default: 44 })!;

export const pillHeight = Platform.select({ ios: 36, android: 40, default: 36 })!;

export const fabRadius = Platform.select({ ios: 16, android: 18, default: 16 })!;
