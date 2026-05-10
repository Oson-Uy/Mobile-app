import * as Clipboard from "expo-clipboard";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Button, Text } from "react-native-paper";

import { useI18n } from "../i18n/I18nProvider";
import { useAppTheme } from "../theme/AppThemeProvider";
import { radii, spacing } from "../theme/tokens";
import { SectionCard } from "./SectionCard";
import { SectionTitle } from "./SectionTitle";

type Props = {
  /** URL или другая строка, закодированная в QR (как на сайте oson-uy.uz). */
  value: string;
};

const QR_SIZE = 176;

export function ProjectQrCard({ value }: Props) {
  const { t } = useI18n();
  const { palette: p } = useAppTheme();
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    [],
  );

  const onCopy = useCallback(async () => {
    await Clipboard.setStringAsync(value);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    setCopied(true);
    copyTimer.current = setTimeout(() => {
      setCopied(false);
      copyTimer.current = null;
    }, 2000);
  }, [value]);

  return (
    <SectionCard style={styles.section}>
      <SectionTitle title={t("projectDetails.qrTitle")} />
      <Text variant="bodySmall" style={[styles.hint, { color: p.textMuted }]}>
        {t("projectDetails.qrHint")}
      </Text>
      <View
        style={[
          styles.qrFrame,
          {
            borderColor: p.outline,
            backgroundColor: "#FFFFFF",
          },
        ]}
      >
        <QRCode value={value} size={QR_SIZE} color="#000000" backgroundColor="#FFFFFF" />
      </View>
      <Button mode="outlined" onPress={() => void onCopy()} style={styles.copyBtn}>
        {t("projectDetails.qrCopyLink")}
      </Button>
      {copied ? (
        <Text variant="labelSmall" style={[styles.copied, { color: p.secondary }]}>
          {t("projectDetails.qrCopied")}
        </Text>
      ) : null}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.md },
  hint: { marginBottom: spacing.md, lineHeight: 20 },
  qrFrame: {
    alignSelf: "center",
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.md,
  },
  copyBtn: { alignSelf: "stretch" },
  copied: { textAlign: "center", marginTop: spacing.sm, fontWeight: "700" },
});
