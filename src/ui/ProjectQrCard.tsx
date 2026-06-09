import * as Clipboard from "expo-clipboard";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useI18n } from "../i18n/I18nProvider";
import { useAppTheme } from "../theme/AppThemeProvider";
import { spacing } from "../theme/tokens";
import { SectionCard } from "./SectionCard";
import { SectionTitle } from "./SectionTitle";

type Props = {
  imageUrl: string;
  shareUrl: string;
};

const QR_MAX = Platform.select({ ios: 256, android: 248, default: 252 })!;

export function ProjectQrCard({ imageUrl, shareUrl }: Props) {
  const { t } = useI18n();
  const { colors: c } = useAppTheme();
  const { width } = useWindowDimensions();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const size = useMemo(() => {
    const pad = spacing.lg * 4;
    return Math.min(QR_MAX, Math.floor(width - pad));
  }, [width]);

  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    [],
  );

  useEffect(() => {
    setLoading(true);
    setFailed(false);
  }, [imageUrl]);

  const onCopy = useCallback(async () => {
    await Clipboard.setStringAsync(shareUrl);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    setCopied(true);
    copyTimer.current = setTimeout(() => {
      setCopied(false);
      copyTimer.current = null;
    }, 2000);
  }, [shareUrl]);

  return (
    <SectionCard style={styles.section}>
      <SectionTitle title={t("projectDetails.qrTitle")} />
      <Text variant="bodySmall" style={[styles.hint, { color: c.labelSecondary }]}>
        {t("projectDetails.qrHint")}
      </Text>

      <View style={styles.qrWrap}>
        {loading && !failed ? (
          <ActivityIndicator color={c.brand} style={styles.loader} />
        ) : null}
        {failed ? (
          <MaterialCommunityIcons name="qrcode-remove" size={48} color={c.labelSecondary} />
        ) : (
          <Image
            source={{ uri: imageUrl }}
            style={{ width: size, height: size, opacity: loading ? 0 : 1 }}
            resizeMode="contain"
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setFailed(true);
            }}
          />
        )}
      </View>

      <Pressable
        onPress={() => void onCopy()}
        style={({ pressed }) => [
          styles.copyRow,
          { borderColor: c.separator, opacity: pressed ? 0.75 : 1 },
        ]}
      >
        <MaterialCommunityIcons name="link-variant" size={20} color={c.brand} />
        <Text variant="labelLarge" style={{ color: c.brand, fontWeight: "600" }}>
          {copied ? t("projectDetails.qrCopied") : t("projectDetails.qrCopyLink")}
        </Text>
      </Pressable>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.md },
  hint: { marginBottom: spacing.lg, lineHeight: 20 },
  qrWrap: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
    marginBottom: spacing.lg,
  },
  loader: { position: "absolute" },
  copyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: Platform.select({ ios: 14, android: 16, default: 14 }),
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
