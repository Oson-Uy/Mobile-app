import React, { useMemo, useState } from "react";
import { ActivityIndicator, Dimensions, Platform, StyleSheet, View } from "react-native";
import WebView from "react-native-webview";

import { buildLeafletMapHtml, PROJECT_MAP_HEIGHT } from "../lib/projectMap";
import { useAppTheme } from "../theme/AppThemeProvider";
import { spacing } from "../theme/tokens";

type Props = {
  lat: number;
  lon: number;
  /** Ширина с учётом горизонтальных отступов экрана (spacing.lg × 2). */
  horizontalPadding?: number;
};

export function ProjectMapWebView({ lat, lon, horizontalPadding = spacing.lg * 2 }: Props) {
  const { palette: p } = useAppTheme();
  const [webReady, setWebReady] = useState(false);
  const width = Dimensions.get("window").width - horizontalPadding;
  const html = useMemo(() => buildLeafletMapHtml(lat, lon), [lat, lon]);

  return (
    <View style={[styles.wrap, { width, height: PROJECT_MAP_HEIGHT, backgroundColor: p.surfaceMuted }]}>
      {!webReady ? (
        <View style={styles.loader}>
          <ActivityIndicator color={p.primary} />
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
