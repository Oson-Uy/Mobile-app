import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Button, Divider, Modal, Portal, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useI18n } from "../../i18n/I18nProvider";
import type { ApiFloor } from "../../types/project";
import { formatUzs } from "../../lib/currency";
import { palette, radii, spacing } from "../../theme/tokens";

type Props = {
  visible: boolean;
  floor: ApiFloor | null;
  onDismiss: () => void;
  onRequestLead: () => void;
};

const localeFor = (l: string) =>
  l === "uz" ? "uz-UZ" : l === "en" ? "en-US" : "ru-RU";

export function FloorLayoutsModal({
  visible,
  floor,
  onDismiss,
  onRequestLead,
}: Props) {
  const { t, locale } = useI18n();
  const loc = localeFor(locale);
  const width = Dimensions.get("window").width - spacing.lg * 2;
  const layouts = floor?.layouts?.filter((l) => l.imageUrl) ?? [];
  const [active, setActive] = useState(0);
  const listRef = useRef<FlatList<(typeof layouts)[0]>>(null);

  useEffect(() => {
    if (visible) setActive(0);
  }, [visible, floor?.id]);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    setActive(Math.round(x / width));
  };

  const scrollTo = (i: number) => {
    listRef.current?.scrollToIndex({ index: i, animated: true });
    setActive(i);
  };

  if (!floor) return null;

  const areas = (floor.areaOptions ?? []).map((o) => o.areaSqm).filter((n) => n > 0);

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.sheet}
      >
        <View style={styles.header}>
          <Text variant="titleLarge" style={styles.title}>
            {t("floorTower.floorLabel", { n: floor.floor })}
          </Text>
          <Pressable onPress={onDismiss} hitSlop={12} accessibilityRole="button">
            <MaterialCommunityIcons name="close" size={24} color={palette.text} />
          </Pressable>
        </View>

        <Text variant="bodyMedium" style={styles.priceLine}>
          {t("floorTower.pricePerM2")}:{" "}
          <Text style={styles.bold}>
            {formatUzs(floor.pricePerM2, loc)} {t("common.sum")}/{t("common.m2")}
          </Text>
        </Text>

        {areas.length ? (
          <Text variant="bodySmall" style={styles.areas}>
            {t("floorTower.areaVariants")}: {areas.join(", ")} {t("floorTower.areaVariantsShort")}
          </Text>
        ) : null}

        <Divider style={styles.divider} />

        {layouts.length ? (
          <>
            <FlatList
              ref={listRef}
              data={layouts}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, idx) => String(item.id ?? idx)}
              onMomentumScrollEnd={onScrollEnd}
              getItemLayout={(_, index) => ({
                length: width,
                offset: width * index,
                index,
              })}
              renderItem={({ item }) => (
                <View style={{ width }}>
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={[styles.layoutImg, { width }]}
                    resizeMode="contain"
                  />
                  {item.title ? (
                    <Text variant="labelMedium" style={styles.layoutTitle}>
                      {item.title}
                    </Text>
                  ) : null}
                </View>
              )}
            />
            {layouts.length > 1 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbs}
              >
                {layouts.map((item, idx) => (
                  <Pressable key={String(item.id ?? idx)} onPress={() => scrollTo(idx)}>
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={[
                        styles.thumb,
                        active === idx && styles.thumbActive,
                      ]}
                    />
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}
          </>
        ) : (
          <Text style={styles.empty}>{t("floorTower.noLayouts")}</Text>
        )}

        <Button mode="contained" style={styles.cta} onPress={onRequestLead}>
          {t("floorTower.cta")}
        </Button>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: "#fff",
    marginHorizontal: spacing.md,
    marginTop: 40,
    marginBottom: 40,
    borderRadius: radii.xl,
    padding: spacing.lg,
    maxHeight: "92%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  title: { fontWeight: "900", flex: 1, color: palette.primary },
  priceLine: { marginBottom: 4 },
  bold: { fontWeight: "800", color: palette.primary },
  areas: { opacity: 0.75, marginBottom: spacing.sm },
  divider: { marginVertical: spacing.md },
  layoutImg: {
    height: 220,
    backgroundColor: palette.surfaceMuted,
    borderRadius: radii.md,
  },
  layoutTitle: { textAlign: "center", marginTop: 6 },
  thumbs: { gap: 8, paddingVertical: spacing.sm },
  thumb: {
    width: 56,
    height: 44,
    borderRadius: radii.sm,
    borderWidth: 2,
    borderColor: "transparent",
  },
  thumbActive: {
    borderColor: palette.secondary,
  },
  empty: { padding: spacing.lg, textAlign: "center", opacity: 0.7 },
  cta: { marginTop: spacing.lg },
});
