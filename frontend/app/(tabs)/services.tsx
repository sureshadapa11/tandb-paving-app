import React from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { C, S, R, SHADOW } from "@/src/theme";
import { Eyebrow, Btn } from "@/src/components/ui";
import { FlipCard } from "@/src/components/Card3D";
import { SERVICES } from "@/src/brand";

const CARD_H = 180;

export default function Services() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + S.md }]}>
        <Eyebrow>What We Offer</Eyebrow>
        <Text style={styles.title}>Our Services</Text>
        <Text style={styles.sub}>Tap any card to flip it for details. All work backed by our 10-year guarantee.</Text>
      </View>
      <FlatList
        data={SERVICES}
        keyExtractor={(i) => i.id}
        numColumns={2}
        removeClippedSubviews
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={5}
        columnWrapperStyle={{ gap: S.md, paddingHorizontal: S.lg }}
        contentContainerStyle={{ paddingTop: S.md, paddingBottom: S["3xl"], gap: S.md }}
        renderItem={({ item }) => (
          <View style={{ flex: 1 }} testID={`service-${item.id}`}>
            <FlipCard
              height={CARD_H}
              testID={`flip-${item.id}`}
              front={
                <View style={[styles.face, styles.front]}>
                  <View style={styles.iconBox}><Ionicons name={item.icon as any} size={26} color={C.brand} /></View>
                  <Text style={styles.frontTitle}>{item.title}</Text>
                  <View style={styles.flipHint}>
                    <Ionicons name="sync" size={12} color={C.muted} />
                    <Text style={styles.flipHintText}>TAP FOR DETAILS</Text>
                  </View>
                </View>
              }
              back={
                <LinearGradient colors={[C.brand, C.brandDark]} style={[styles.face, styles.back]}>
                  <Text style={styles.backTitle}>{item.title}</Text>
                  <Text style={styles.backDesc}>{item.desc}</Text>
                  <View style={styles.backHint}>
                    <Ionicons name="arrow-undo" size={12} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.backHintText}>TAP TO FLIP BACK</Text>
                  </View>
                </LinearGradient>
              }
            />
          </View>
        )}
        ListFooterComponent={
          <View style={{ paddingHorizontal: S.lg, paddingTop: S.xl }}>
            <View style={styles.ctaCard}>
              <Text style={styles.ctaTitle}>Not sure which option suits you?</Text>
              <Text style={styles.ctaSub}>Get a free site survey and honest advice — no pressure, no obligation.</Text>
              <Btn testID="services-quote-btn" label="Get a Free Quote" icon="calculator" onPress={() => router.push("/(tabs)/quote")} style={{ marginTop: S.md }} />
            </View>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: S.lg, paddingBottom: S.md, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  title: { fontSize: 30, fontWeight: "900", color: C.ink, letterSpacing: -0.8 },
  sub: { fontSize: 14, color: C.muted, marginTop: 6, lineHeight: 20 },
  face: { flex: 1, borderRadius: R.lg, ...SHADOW.card },
  front: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, padding: S.lg, justifyContent: "space-between" },
  iconBox: { width: 52, height: 52, borderRadius: R.md, backgroundColor: C.accentSoft, alignItems: "center", justifyContent: "center" },
  frontTitle: { fontSize: 16, fontWeight: "800", color: C.ink, marginTop: S.sm },
  flipHint: { flexDirection: "row", alignItems: "center", gap: 4 },
  flipHintText: { fontSize: 9.5, fontWeight: "800", letterSpacing: 0.8, color: C.muted },
  back: { padding: S.lg, justifyContent: "space-between" },
  backTitle: { fontSize: 16, fontWeight: "900", color: "#fff" },
  backDesc: { fontSize: 13, color: "rgba(255,255,255,0.92)", lineHeight: 19, flex: 1, marginTop: 6 },
  backHint: { flexDirection: "row", alignItems: "center", gap: 4 },
  backHintText: { fontSize: 9.5, fontWeight: "800", letterSpacing: 0.8, color: "rgba(255,255,255,0.8)" },
  ctaCard: { backgroundColor: C.ink, borderRadius: R.xl, padding: S.xl },
  ctaTitle: { fontSize: 19, fontWeight: "900", color: C.surface, letterSpacing: -0.3 },
  ctaSub: { fontSize: 13.5, color: "rgba(255,255,255,0.72)", marginTop: 8, lineHeight: 20 },
});
