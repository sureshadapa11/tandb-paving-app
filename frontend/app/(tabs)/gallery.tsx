import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, Modal, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { C, S, R } from "@/src/theme";
import { Eyebrow, MaxWidth } from "@/src/components/ui";
import { Tilt3D } from "@/src/components/Card3D";
import { GALLERY } from "@/src/brand";
import { useResponsive } from "@/src/hooks/use-responsive";

export default function Gallery() {
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState<number | null>(null);
  const { isDesktop, isTablet, numCols, hPad } = useResponsive();
  const { width } = useWindowDimensions();
  const imgH = isDesktop ? 200 : isTablet ? 170 : 140;
  const viewerSize = isDesktop ? Math.min(width * 0.7, 900) : width;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={[styles.headerOuter, { paddingTop: insets.top + S.md }]}>
        <MaxWidth style={{ paddingHorizontal: hPad }}>
          <Eyebrow>Our Work</Eyebrow>
          <Text style={[styles.title, isDesktop && { fontSize: 38 }]}>Recent Projects</Text>
          <Text style={styles.sub}>A selection of driveways, patios and paths we've completed across the North West.</Text>
        </MaxWidth>
      </View>
      <FlatList
        key={numCols}
        data={GALLERY}
        keyExtractor={(_, i) => String(i)}
        numColumns={numCols}
        removeClippedSubviews
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        columnWrapperStyle={numCols > 1 ? { gap: S.md } : undefined}
        contentContainerStyle={{ paddingTop: S.md, paddingBottom: S["3xl"], gap: S.md, paddingHorizontal: hPad, alignSelf: "center", width: "100%", maxWidth: 1200 }}
        renderItem={({ item, index }) => (
          <Tilt3D testID={`gallery-item-${index}`} style={[styles.card, { flex: 1 }]} onPress={() => setActive(index)} max={10}>
            <Image source={item.img} style={[styles.img, { height: imgH }]} contentFit="cover" transition={200} />
            <View style={styles.caption}>
              <Text style={styles.label} numberOfLines={1}>{item.label}</Text>
              <Text style={styles.town}>{item.town}</Text>
            </View>
          </Tilt3D>
        )}
      />

      <Modal visible={active !== null} transparent animationType="fade" onRequestClose={() => setActive(null)}>
        <View style={styles.viewer}>
          <Pressable testID="viewer-close" style={[styles.viewerClose, { top: insets.top + S.sm }]} onPress={() => setActive(null)}>
            <Ionicons name="close" size={26} color="#fff" />
          </Pressable>
          {active !== null && (
            <>
              <Image source={GALLERY[active].img} style={{ width: viewerSize, height: viewerSize * 0.65, borderRadius: isDesktop ? R.xl : 0 }} contentFit="contain" />
              <Text style={styles.viewerLabel}>{GALLERY[active].label}</Text>
              <Text style={styles.viewerTown}>{GALLERY[active].town}</Text>
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
  card: { flex: 1, borderRadius: R.lg, overflow: "hidden", backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  img: { width: "100%", backgroundColor: C.surfaceAlt },
  caption: { padding: S.sm },
  label: { fontSize: 13, fontWeight: "800", color: C.ink },
  town: { fontSize: 11, color: C.muted, marginTop: 1 },
  viewer: { flex: 1, backgroundColor: "rgba(15,10,5,0.96)", alignItems: "center", justifyContent: "center" },
  viewerClose: { position: "absolute", right: S.lg, width: 44, height: 44, alignItems: "center", justifyContent: "center", zIndex: 2 },
  viewerLabel: { color: "#fff", fontSize: 17, fontWeight: "800", marginTop: S.lg },
  viewerTown: { color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 4 },
});
