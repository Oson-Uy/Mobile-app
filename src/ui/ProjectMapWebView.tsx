import React, { useMemo, useState } from "react";
import { ActivityIndicator, Dimensions, Platform, StyleSheet, View } from "react-native";
import WebView from "react-native-webview";

import {
  buildEmbedIframeHtml,
  buildLeafletMapHtml,
  PROJECT_MAP_HEIGHT,
} from "../lib/projectMap";
import { useAppTheme } from "../theme/AppThemeProvider";
import { spacing } from "../theme/tokens";

type Props = {
  /** Координаты для Leaflet (приоритет). */
  lat?: number;
  lon?: number;
  /** Прямой Google embed-URL, если координаты недоступны. */
  embedUrl?: string;
  /** Ширина с учётом горизонтальных отступов экрана (spacing.lg × 2). */
  horizontalPadding?: number;
};

export function ProjectMapWebView({
  lat,
  lon,
  embedUrl,
  horizontalPadding = spacing.lg * 2,
}: Props) {
  const { colors: c } = useAppTheme();
  const [webReady, setWebReady] = useState(false);
  const width = Dimensions.get("window").width - horizontalPadding;

  const html = useMemo(() => {
    if (typeof lat === "number" && typeof lon === "number") {
      return buildLeafletMapHtml(lat, lon);
    }
    if (embedUrl) return buildEmbedIframeHtml(embedUrl);
    return null;
  }, [lat, lon, embedUrl]);

  if (!html) return null;

  return (
    <View style={[styles.wrap, { width, height: PROJECT_MAP_HEIGHT, backgroundColor: c.fill }]}>
      {!webReady ? (
        <View style={styles.loader}>
          <ActivityIndicator color={c.brand} />
        </View>
      ) : null}
      <WebView
        source={{ html, baseUrl: "https://oson-uy.uz/" }}
        style={{ width, height: PROJECT_MAP_HEIGHT, opacity: webReady ? 1 : 0 }}
        scrollEnabled={false}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        allowsInlineMediaPlayback
        nestedScrollEnabled={Platform.OS === "android"}
        androidLayerType="hardware"
        onLoadEnd={() => setWebReady(true)}
        onError={() => setWebReady(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 0,
    overflow: "hidden",
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});
