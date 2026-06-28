import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, Modal, useWindowDimensions, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Head from "expo-router/head";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { C, S, R } from "@/src/theme";
import { Eyebrow, MaxWidth } from "@/src/components/ui";
import { Tilt3D } from "@/src/components/Card3D";
import { GALLERY } from "@/src/brand";
import { useResponsive } from "@/src/hooks/use-responsive";

const BACKEND = process.env.EXPO_PUBLIC_BACKEND_URL ?? "";

type GalleryItem = { img: any; label: string; town: string; isUploaded?: boolean };

export default function Gallery() {
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState<number | null>(null);
  const { isDesktop, isTablet, numCols, hPad } = useResponsive();
  const { width } = useWindowDimensions();
  const imgH = isDesktop ? 200 : isTablet ? 170 : 140;
  const viewerSize = isDesktop ? Math.min(width * 0.7, 900) : width;

  const [uploaded, setUploaded] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BACKEND}/api/public/gallery`)
      .then(r => r.ok ? r.json() : [])
      .then((docs: any[]) => {
        setUploaded(docs.map(d => ({
          img: { uri: `data:image/jpeg;base64,${d.image_base64 || d.image}` },
          label: d.caption || "Project Photo",
          town: d.town || "",
          isUploaded: true,
        })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const allPhotos: GalleryItem[] = [...uploaded, ...GALLERY];
  const listData = [...allPhotos, { img: null, label: "coming-soon", town: "" }];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Head>
        <title>Project Gallery | T&B Paving — Driveways & Patios Essex</title>
        <meta name="description" content="Browse our gallery of completed driveways, patios and garden paths across Essex & Suffolk. Block paving, resin, natural stone and more." />
        <meta property="og:title" content="Project Gallery | T&B Paving" />
        <meta property="og:description" content="See our completed paving projects across Essex & Suffolk — driveways, patios, paths and more." />
      </Head>
      <View style={[styles.headerOuter, { paddingTop: insets.top + S.md }]}>
        <MaxWidth style={{ paddingHorizontal: hPad }}>
          <Eyebrow>Our Work</Eyebrow>
          <Text style={[styles.title, isDesktop && { fontSize: 38 }]}>Recent Projects</Text>
          <Text style={styles.sub}>A selection of driveways, patios and paths we've completed across Essex & Suffolk.</Text>
          {uploaded.length > 0 && (
            <View style={styles.uploadedBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.uploadedText}>{uploaded.length} new photo{uploaded.length !== 1 ? "s" : ""} added</Text>
            </View>
          )}
        </MaxWidth>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={C.brand} style={{ marginTop: S["2xl"] }} />
      ) : (
        <FlatList
          key={numCols}
          data={listData}
          keyExtractor={(_, i) => String(i)}
          numColumns={numCols}
          removeClippedSubviews
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={5}
          columnWrapperStyle={numCols > 1 ? { gap: S.md } : undefined}
          contentContainerStyle={{ paddingTop: S.md, paddingBottom: S["3xl"], gap: S.md, paddingHorizontal: hPad, alignSelf: "center", width: "100%", maxWidth: 1200 }}
          renderItem={({ item, index }) => {
            if (item.label === "coming-soon") {
              return (
                <View style={[styles.card, styles.comingSoon, { flex: 1, height: imgH + 46 }]}>
                  <Ionicons name="camera-outline" size={32} color={C.muted} />
                  <Text style={styles.comingSoonTitle}>More Photos Coming Soon</Text>
                  <Text style={styles.comingSoonSub}>New project photos added regularly</Text>
                </View>
              );
            }
            return (
              <Tilt3D testID={`gallery-item-${index}`} style={[styles.card, { flex: 1 }]} onPress={() => setActive(index)} max={10}>
                {(item as GalleryItem).isUploaded && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                )}
                <Image source={item.img} style={[styles.img, { height: imgH }]} contentFit="cover" transition={200} />
                <View style={styles.caption}>
                  <Text style={styles.label} numberOfLines={1}>{item.label}</Text>
                  {item.town ? <Text style={styles.town}>{item.town}</Text> : null}
                </View>
              </Tilt3D>
            );
          }}
        />
      )}

      <Modal visible={active !== null} transparent animationType="fade" onRequestClose={() => setActive(null)}>
        <View style={styles.viewer}>
          <Pressable testID="viewer-close" style={[styles.viewerClose, { top: insets.top + S.sm }]} onPress={() => setActive(null)}>
            <Ionicons name="close" size={26} color="#fff" />
          </Pressable>
          {active !== null && active < allPhotos.length && (
            <>
              <Image
                source={allPhotos[active].img}
                style={{ width: viewerSize, height: viewerSize * 0.65, borderRadius: isDesktop ? R.xl : 0 }}
                contentFit="contain"
              />
              <Text style={styles.viewerLabel}>{allPhotos[active].label}</Text>
              {allPhotos[active].town ? <Text style={styles.viewerTown}>{allPhotos[active].town}</Text> : null}
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerOuter: { paddingBottom: S.md, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  title: { fontSize: 30, fontWeight: "900", color: C.ink, letterSpacing: -0.8 },
  sub: { fontSize: 14, color: C.muted, marginTop: 6, lineHeight: 20, maxWidth: 600 },
  uploadedBadge: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: S.sm },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.success },
  uploadedText: { fontSize: 12, fontWeight: "700", color: C.success },
  card: { flex: 1, borderRadius: R.lg, overflow: "hidden", backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  newBadge: {
    position: "absolute", top: 8, left: 8, zIndex: 1,
    backgroundColor: "#B5651D", borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  newBadgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  img: { width: "100%", backgroundColor: C.surfaceAlt },
  caption: { padding: S.sm },
  label: { fontSize: 13, fontWeight: "800", color: C.ink },
  town: { fontSize: 11, color: C.muted, marginTop: 1 },
  viewer: { flex: 1, backgroundColor: "rgba(15,10,5,0.96)", alignItems: "center", justifyContent: "center" },
  viewerClose: { position: "absolute", right: S.lg, width: 44, height: 44, alignItems: "center", justifyContent: "center", zIndex: 2 },
  viewerLabel: { color: "#fff", fontSize: 17, fontWeight: "800", marginTop: S.lg },
  viewerTown: { color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 4 },
  comingSoon: { alignItems: "center", justifyContent: "center", gap: S.sm, borderStyle: "dashed" },
  comingSoonTitle: { fontSize: 14, fontWeight: "700", color: C.inkSoft, textAlign: "center" },
  comingSoonSub: { fontSize: 12, color: C.muted, textAlign: "center" },
});
