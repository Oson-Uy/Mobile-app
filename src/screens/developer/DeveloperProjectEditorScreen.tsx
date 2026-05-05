import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Button,
  Checkbox,
  Divider,
  Snackbar,
  Text,
  TextInput,
} from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { useRoute } from "@react-navigation/native";

import { apiFetch } from "../../api/client";
import { useI18n } from "../../i18n/I18nProvider";
import { Screen } from "../../ui/Screen";
import { SectionCard } from "../../ui/SectionCard";
import { SectionTitle } from "../../ui/SectionTitle";
import { uploadImageAsset } from "../../dev/uploadImage";
import { palette, radii, spacing } from "../../theme/tokens";

type ApiProject = any;

type RouteParams = { projectId?: number };

type FormState = {
  name: string;
  location: string;
  district: string;
  deliveryDate: string;
  description: string;
  advantages: string;
  materials: string;
  hasInstallment: boolean;
  buildingCount: string;
  corpusCount: string;
  ceilingHeightM: string;
  hasSurfaceParking: boolean;
  hasUndergroundParking: boolean;
  surfaceParkingSpaces: string;
  undergroundParkingSpaces: string;
  elevatorsCount: string;
  latitude: string;
  longitude: string;
  mapEmbedUrl: string;
  qrCodeUrl: string;
  totalFloors: string;
  totalUnits: string;
  imageUrl: string;
  videoUrl: string;
  imageUrls: string[];
};

const emptyForm = (): FormState => ({
  name: "",
  location: "",
  district: "",
  deliveryDate: "",
  description: "",
  advantages: "",
  materials: "",
  hasInstallment: false,
  buildingCount: "",
  corpusCount: "",
  ceilingHeightM: "",
  hasSurfaceParking: false,
  hasUndergroundParking: false,
  surfaceParkingSpaces: "",
  undergroundParkingSpaces: "",
  elevatorsCount: "",
  latitude: "",
  longitude: "",
  mapEmbedUrl: "",
  qrCodeUrl: "",
  totalFloors: "",
  totalUnits: "",
  imageUrl: "",
  videoUrl: "",
  imageUrls: [],
});

const splitCsv = (value: string) =>
  value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export function DeveloperProjectEditorScreen({ navigation }: any) {
  const { t } = useI18n();
  const route = useRoute();
  const { projectId } = (route.params ?? {}) as RouteParams;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [snack, setSnack] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const title = projectId
    ? t("developer.editProject")
    : t("developer.newProject");

  useLayoutEffect(() => {
    navigation.setOptions({ title });
  }, [navigation, title]);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setErr(null);
        if (!projectId) {
          setForm(emptyForm());
          return;
        }
        const p = await apiFetch<ApiProject>(`/projects/${projectId}/full`);
        setForm({
          name: p.name ?? "",
          location: p.location ?? "",
          district: p.district ?? "",
          deliveryDate: p.deliveryDate ?? "",
          description: p.description ?? "",
          advantages: (p.advantages ?? []).join(", "),
          materials: (p.materials ?? []).join(", "),
          hasInstallment: Boolean(p.hasInstallment),
          buildingCount: p.buildingCount != null ? String(p.buildingCount) : "",
          corpusCount: p.corpusCount != null ? String(p.corpusCount) : "",
          ceilingHeightM:
            p.ceilingHeightM != null ? String(p.ceilingHeightM) : "",
          hasSurfaceParking: Boolean(p.hasSurfaceParking),
          hasUndergroundParking: Boolean(p.hasUndergroundParking),
          surfaceParkingSpaces:
            p.surfaceParkingSpaces != null ? String(p.surfaceParkingSpaces) : "",
          undergroundParkingSpaces:
            p.undergroundParkingSpaces != null
              ? String(p.undergroundParkingSpaces)
              : "",
          elevatorsCount:
            p.elevatorsCount != null ? String(p.elevatorsCount) : "",
          latitude: p.latitude != null ? String(p.latitude) : "",
          longitude: p.longitude != null ? String(p.longitude) : "",
          mapEmbedUrl: p.mapEmbedUrl ?? "",
          qrCodeUrl: p.qrCodeUrl ?? "",
          totalFloors: p.totalFloors != null ? String(p.totalFloors) : "",
          totalUnits: p.totalUnits != null ? String(p.totalUnits) : "",
          imageUrl: p.imageUrl ?? "",
          videoUrl: p.videoUrl ?? "",
          imageUrls: Array.isArray(p.media)
            ? p.media.map((m: any) => m.imageUrl).filter(Boolean)
            : Array.isArray(p.imageUrls)
              ? p.imageUrls
              : [],
        });
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Load failed");
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId]);

  const canSave = useMemo(() => {
    return Boolean(form.name.trim() && form.location.trim() && form.deliveryDate.trim());
  }, [form.name, form.location, form.deliveryDate]);

  const pickAndUpload = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setSnack(t("developer.mediaPermission"));
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsEditing: true,
    });
    if (res.canceled || !res.assets?.[0]) return;
    try {
      setUploading(true);
      const url = await uploadImageAsset(res.assets[0]);
      setForm((f) => ({ ...f, imageUrls: [url, ...f.imageUrls] }));
      if (!form.imageUrl) setForm((f) => ({ ...f, imageUrl: url }));
    } catch (e) {
      setSnack(e instanceof Error ? e.message : t("developer.uploadError"));
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!canSave) {
      setSnack(t("developer.fillRequired"));
      return;
    }
    try {
      setSaving(true);
      setErr(null);

      const body: any = {
        name: form.name.trim(),
        location: form.location.trim(),
        district: form.district.trim() || undefined,
        deliveryDate: form.deliveryDate.trim(),
        description: form.description.trim() || undefined,
        advantages: splitCsv(form.advantages),
        materials: splitCsv(form.materials),
        hasInstallment: Boolean(form.hasInstallment),
        buildingCount: form.buildingCount ? Number(form.buildingCount) : undefined,
        corpusCount: form.corpusCount ? Number(form.corpusCount) : undefined,
        ceilingHeightM: form.ceilingHeightM ? Number(form.ceilingHeightM) : undefined,
        hasSurfaceParking: Boolean(form.hasSurfaceParking),
        hasUndergroundParking: Boolean(form.hasUndergroundParking),
        surfaceParkingSpaces: form.surfaceParkingSpaces ? Number(form.surfaceParkingSpaces) : undefined,
        undergroundParkingSpaces: form.undergroundParkingSpaces ? Number(form.undergroundParkingSpaces) : undefined,
        elevatorsCount: form.elevatorsCount ? Number(form.elevatorsCount) : undefined,
        latitude: form.latitude ? Number(form.latitude) : undefined,
        longitude: form.longitude ? Number(form.longitude) : undefined,
        mapEmbedUrl: form.mapEmbedUrl.trim() || undefined,
        qrCodeUrl: form.qrCodeUrl.trim() || undefined,
        totalFloors: form.totalFloors ? Number(form.totalFloors) : undefined,
        totalUnits: form.totalUnits ? Number(form.totalUnits) : undefined,
        imageUrl: form.imageUrl.trim() || undefined,
        videoUrl: form.videoUrl.trim() || undefined,
        imageUrls: form.imageUrls,
      };

      if (projectId) {
        await apiFetch(`/projects/${projectId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      } else {
        const dev = await apiFetch<{ id: number }>("/developers");
        body.developerId = dev.id;
        await apiFetch(`/projects`, {
          method: "POST",
          body: JSON.stringify(body),
        });
      }

      setSnack(t("developer.saved"));
      navigation.goBack();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <SectionCard>
          <SectionTitle title={title} subtitle={t("developer.projectEditorSubtitle")} />

          {err ? <Text style={styles.err}>{err}</Text> : null}

          <TextInput
            mode="outlined"
            label={t("developer.projectName")}
            value={form.name}
            onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
            style={styles.field}
          />
          <View style={styles.row}>
            <TextInput
              mode="outlined"
              label={t("developer.location")}
              value={form.location}
              onChangeText={(v) => setForm((f) => ({ ...f, location: v }))}
              style={[styles.field, styles.flex]}
            />
            <TextInput
              mode="outlined"
              label={t("developer.district")}
              value={form.district}
              onChangeText={(v) => setForm((f) => ({ ...f, district: v }))}
              style={[styles.field, styles.flex]}
            />
          </View>
          <TextInput
            mode="outlined"
            label={t("developer.deliveryDate")}
            value={form.deliveryDate}
            onChangeText={(v) => setForm((f) => ({ ...f, deliveryDate: v }))}
            style={styles.field}
          />

          <Divider style={styles.div} />

          <View style={styles.checkRow}>
            <Checkbox
              status={form.hasInstallment ? "checked" : "unchecked"}
              onPress={() =>
                setForm((f) => ({ ...f, hasInstallment: !f.hasInstallment }))
              }
            />
            <Text onPress={() => setForm((f) => ({ ...f, hasInstallment: !f.hasInstallment }))}>
              {t("projectCard.installment")}
            </Text>
          </View>

          <TextInput
            mode="outlined"
            label={t("developer.materials")}
            value={form.materials}
            onChangeText={(v) => setForm((f) => ({ ...f, materials: v }))}
            style={styles.field}
          />
          <TextInput
            mode="outlined"
            label={t("developer.advantages")}
            value={form.advantages}
            onChangeText={(v) => setForm((f) => ({ ...f, advantages: v }))}
            style={styles.field}
          />
          <TextInput
            mode="outlined"
            label={t("developer.description")}
            value={form.description}
            onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
            style={styles.field}
            multiline
          />

          <Divider style={styles.div} />

          <SectionTitle title={t("developer.media")} />
          <Button
            mode="contained-tonal"
            onPress={() => void pickAndUpload()}
            disabled={uploading}
          >
            {uploading ? t("developer.uploading") : t("developer.addImage")}
          </Button>
          {form.imageUrl ? (
            <View style={styles.mainImgWrap}>
              <Text style={styles.smallMuted}>{t("developer.mainImage")}</Text>
              <Image source={{ uri: form.imageUrl }} style={styles.mainImg} />
            </View>
          ) : null}
          {form.imageUrls.length ? (
            <View style={styles.gallery}>
              {form.imageUrls.slice(0, 8).map((u, idx) => (
                <View key={`${idx}-${u.slice(-12)}`} style={styles.thumbWrap}>
                  <Image source={{ uri: u }} style={styles.thumb} />
                  <Button
                    mode="text"
                    compact
                    onPress={() =>
                      setForm((f) => ({
                        ...f,
                        imageUrl: u,
                      }))
                    }
                  >
                    {t("developer.setAsMain")}
                  </Button>
                  <Button
                    mode="text"
                    compact
                    textColor={palette.error}
                    onPress={() =>
                      setForm((f) => ({
                        ...f,
                        imageUrls: f.imageUrls.filter((x) => x !== u),
                        imageUrl: f.imageUrl === u ? "" : f.imageUrl,
                      }))
                    }
                  >
                    {t("developer.remove")}
                  </Button>
                </View>
              ))}
            </View>
          ) : null}

          <Divider style={styles.div} />

          <SectionTitle title={t("developer.extra")} />
          <View style={styles.row}>
            <TextInput
              mode="outlined"
              label={t("developer.buildingCount")}
              value={form.buildingCount}
              onChangeText={(v) => setForm((f) => ({ ...f, buildingCount: v.replace(/[^\d]/g, "") }))}
              style={[styles.field, styles.flex]}
              keyboardType="number-pad"
            />
            <TextInput
              mode="outlined"
              label={t("developer.corpusCount")}
              value={form.corpusCount}
              onChangeText={(v) => setForm((f) => ({ ...f, corpusCount: v.replace(/[^\d]/g, "") }))}
              style={[styles.field, styles.flex]}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.row}>
            <TextInput
              mode="outlined"
              label={t("developer.ceilingHeight")}
              value={form.ceilingHeightM}
              onChangeText={(v) => setForm((f) => ({ ...f, ceilingHeightM: v.replace(/[^\d.]/g, "") }))}
              style={[styles.field, styles.flex]}
              keyboardType="decimal-pad"
            />
            <TextInput
              mode="outlined"
              label={t("developer.elevators")}
              value={form.elevatorsCount}
              onChangeText={(v) => setForm((f) => ({ ...f, elevatorsCount: v.replace(/[^\d]/g, "") }))}
              style={[styles.field, styles.flex]}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.row}>
            <TextInput
              mode="outlined"
              label={t("developer.latitude")}
              value={form.latitude}
              onChangeText={(v) => setForm((f) => ({ ...f, latitude: v.replace(/[^\d.-]/g, "") }))}
              style={[styles.field, styles.flex]}
              keyboardType="decimal-pad"
            />
            <TextInput
              mode="outlined"
              label={t("developer.longitude")}
              value={form.longitude}
              onChangeText={(v) => setForm((f) => ({ ...f, longitude: v.replace(/[^\d.-]/g, "") }))}
              style={[styles.field, styles.flex]}
              keyboardType="decimal-pad"
            />
          </View>

          <TextInput
            mode="outlined"
            label={t("developer.mapEmbedUrl")}
            value={form.mapEmbedUrl}
            onChangeText={(v) => setForm((f) => ({ ...f, mapEmbedUrl: v }))}
            style={styles.field}
          />
          <TextInput
            mode="outlined"
            label={t("developer.qrCodeUrl")}
            value={form.qrCodeUrl}
            onChangeText={(v) => setForm((f) => ({ ...f, qrCodeUrl: v }))}
            style={styles.field}
          />
          <TextInput
            mode="outlined"
            label={t("developer.videoUrl")}
            value={form.videoUrl}
            onChangeText={(v) => setForm((f) => ({ ...f, videoUrl: v }))}
            style={styles.field}
          />

          <View style={styles.row}>
            <TextInput
              mode="outlined"
              label={t("developer.totalFloors")}
              value={form.totalFloors}
              onChangeText={(v) => setForm((f) => ({ ...f, totalFloors: v.replace(/[^\d]/g, "") }))}
              style={[styles.field, styles.flex]}
              keyboardType="number-pad"
            />
            <TextInput
              mode="outlined"
              label={t("developer.totalUnits")}
              value={form.totalUnits}
              onChangeText={(v) => setForm((f) => ({ ...f, totalUnits: v.replace(/[^\d]/g, "") }))}
              style={[styles.field, styles.flex]}
              keyboardType="number-pad"
            />
          </View>

          <Divider style={styles.div} />

          <Button
            mode="contained"
            disabled={!canSave || saving}
            loading={saving}
            onPress={() => void save()}
            style={styles.saveBtn}
            contentStyle={styles.saveBtnIn}
          >
            {t("developer.save")}
          </Button>
        </SectionCard>
      </ScrollView>
      <Snackbar visible={snack != null} onDismiss={() => setSnack(null)} duration={3000}>
        {snack ?? ""}
      </Snackbar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  field: { marginBottom: spacing.md },
  row: { flexDirection: "row", gap: spacing.sm },
  flex: { flex: 1 },
  div: { marginVertical: spacing.md },
  err: { color: palette.error, marginBottom: spacing.md, fontWeight: "700" },
  checkRow: { flexDirection: "row", alignItems: "center", marginLeft: -8, marginBottom: spacing.sm },
  smallMuted: { opacity: 0.7, fontSize: 12, marginBottom: 6 },
  mainImgWrap: { marginTop: spacing.md },
  mainImg: { width: "100%", height: 200, borderRadius: radii.md, backgroundColor: palette.surfaceMuted },
  gallery: { marginTop: spacing.md, gap: spacing.md },
  thumbWrap: { backgroundColor: palette.surfaceMuted, borderRadius: radii.md, padding: spacing.md },
  thumb: { width: "100%", height: 160, borderRadius: radii.md, backgroundColor: "#ddd" },
  saveBtn: { marginTop: spacing.lg, borderRadius: radii.lg },
  saveBtnIn: { paddingVertical: 6 },
});

