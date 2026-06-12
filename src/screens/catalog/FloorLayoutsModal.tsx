import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Button, Divider, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useI18n } from "../../i18n/I18nProvider";
import type { ApiFloor } from "../../types/project";
import { formatUzs } from "../../lib/currency";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { radii, spacing } from "../../theme/tokens";

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
  const { colors: c } = useAppTheme();
  const loc = localeFor(locale);
  /** Ширина контента карусели = экран − padding модалки (`modalRoot`) − padding листа (`sheet`). */
  const slideWidth = Math.max(
    200,
    Dimensions.get("window").width - spacing.md * 2 - spacing.lg * 2,
  );
  const layouts = floor?.layouts?.filter((l) => l.imageUrl) ?? [];
  const [active, setActive] = useState(0);
  const [carouselW, setCarouselW] = useState(slideWidth);
  const listRef = useRef<FlatList<(typeof layouts)[0]>>(null);

  const pageW = carouselW > 0 ? carouselW : slideWidth;

  useEffect(() => {
    if (visible) setActive(0);
  }, [visible, floor?.id]);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    setActive(Math.round(x / pageW));
  };

  const scrollTo = (i: number) => {
    listRef.current?.scrollToOffset({ offset: i * pageW, animated: true });
    setActive(i);
  };

  if (!floor) return null;

  const areas = (floor.areaOptions ?? []).map((o) => o.areaSqm).filter((n) => n > 0);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={[styles.modalRoot, { backgroundColor: c.overlay }]}>
        <Pressable style={styles.backdrop} onPress={onDismiss} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: c.bgElevated,
              borderColor: c.separator,
            },
          ]}
        >
          <View style={styles.header}>
            <Text variant="titleLarge" style={[styles.title, { color: c.brand }]}>
              {t("floorTower.floorLabel", { n: floor.floor })}
            </Text>
            <Pressable onPress={onDismiss} hitSlop={12} accessibilityRole="button">
              <MaterialCommunityIcons name="close" size={24} color={c.labelSecondary} />
            </Pressable>
          </View>

          <Text variant="bodyMedium" style={[styles.priceLine, { color: c.label }]}>
            {t("floorTower.pricePerM2")}:{" "}
            <Text style={[styles.bold, { color: c.brand }]}>
              {formatUzs(floor.pricePerM2, loc)} {t("common.sum")}/{t("common.m2")}
            </Text>
          </Text>

          {areas.length ? (
            <Text variant="bodySmall" style={[styles.areas, { color: c.labelSecondary }]}>
              {t("floorTower.areaVariants")}: {areas.join(", ")}{" "}
              {t("floorTower.areaVariantsShort")}
            </Text>
          ) : null}

          <Divider style={[styles.divider, { backgroundColor: c.separator }]} />

          {layouts.length ? (
            <>
              <View
                onLayout={(e) => {
                  const w = Math.round(e.nativeEvent.layout.width);
                  if (w > 0 && w !== carouselW) setCarouselW(w);
                }}
              >
                <FlatList
                  ref={listRef}
                  data={layouts}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item, idx) => String(item.id ?? idx)}
                  onMomentumScrollEnd={onScrollEnd}
                  removeClippedSubviews={Platform.OS === "android"}
                  initialNumToRender={2}
                  windowSize={3}
                  getItemLayout={(_, index) => ({
                    length: pageW,
                    offset: pageW * index,
                    index,
                  })}
                  renderItem={({ item }) => (
                    <View style={{ width: pageW }}>
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={[
                          styles.layoutImg,
                          { width: pageW, backgroundColor: c.fill },
                        ]}
                        resizeMode="contain"
                      />
                    {item.title ? (
                      <Text variant="labelMedium" style={[styles.layoutTitle, { color: c.label }]}>
                        {item.title}
                      </Text>
                    ) : null}
                  </View>
                )}
                />
              </View>
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
                          { backgroundColor: c.fill },
                          active === idx && { borderColor: c.brandSecondary },
                        ]}
                      />
                    </Pressable>
                  ))}
                </ScrollView>
              ) : null}
            </>
          ) : (
            <Text style={[styles.empty, { color: c.labelSecondary }]}>{t("floorTower.noLayouts")}</Text>
          )}

          <Button
            mode="contained"
            style={styles.cta}
            buttonColor={c.brandSecondary}
            textColor={c.brandOn}
            onPress={onRequestLead}
          >
            {t("floorTower.cta")}
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.md,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    maxHeight: "92%",
    borderWidth: StyleSheet.hairlineWidth,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  title: { fontWeight: "900", flex: 1 },
  priceLine: { marginBottom: 4 },
  bold: { fontWeight: "800" },
  areas: { marginBottom: spacing.sm },
  divider: { marginVertical: spacing.md },
  layoutImg: {
    height: 220,
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
  empty: { padding: spacing.lg, textAlign: "center" },
  cta: { marginTop: spacing.lg, borderRadius: radii.lg },
});
