import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { C, S, R, SHADOW } from "@/src/theme";
import { Btn, Eyebrow, SectionTitle, Logo, Stars } from "@/src/components/ui";
import { Tilt3D } from "@/src/components/Card3D";
import { BIZ, STATS, TRUST, SERVICES, STEPS, HERO_IMG, GALLERY, TESTIMONIALS } from "@/src/brand";

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const goQuote = () => router.push("/(tabs)/quote");
  const call = () => Linking.openURL(`tel:${BIZ.mobile.replace(/\s/g, "")}`);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Sticky header */}
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <Logo size={36} />
        <Pressable testID="header-call-btn" onPress={call} style={styles.callPill}>
          <Ionicons name="call" size={15} color={C.onBrand} />
          <Text style={styles.callPillText}>CALL</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: S["3xl"] }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Image source={{ uri: HERO_IMG }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
          <LinearGradient colors={["rgba(20,15,10,0.35)", "rgba(20,15,10,0.85)"]} style={StyleSheet.absoluteFill} />
          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <Ionicons name="shield-checkmark" size={13} color={C.accent} />
              <Text style={styles.heroBadgeText}>{BIZ.since.toUpperCase()}</Text>
            </View>
            <Text style={styles.heroTitle}>{BIZ.headline}</Text>
            <Text style={styles.heroSub}>{BIZ.intro}</Text>
            <View style={styles.heroBtns}>
              <Btn testID="hero-quote-btn" label="Get a Free Quote" icon="calculator" onPress={goQuote} style={{ flex: 1 }} />
            </View>
            <Pressable testID="hero-services-btn" onPress={() => router.push("/(tabs)/services")} style={styles.heroLink}>
              <Text style={styles.heroLinkText}>View Our Services</Text>
              <Ionicons name="arrow-forward" size={16} color={C.surface} />
            </Pressable>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {STATS.map((s) => (
            <View key={s.label} style={styles.stat}>
              <Text style={styles.statVal}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Trust badges */}
        <View style={styles.section}>
          <View style={styles.trustWrap}>
            {TRUST.map((t) => (
              <View key={t.label} style={styles.trustChip}>
                <Ionicons name={t.icon as any} size={16} color={C.brand} />
                <Text style={styles.trustText}>{t.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Services preview */}
        <View style={styles.section}>
          <Eyebrow>What We Offer</Eyebrow>
          <SectionTitle>Our Paving Services</SectionTitle>
          <View style={{ marginTop: S.lg, gap: S.md }}>
            {SERVICES.slice(0, 4).map((sv) => (
              <Tilt3D key={sv.id} testID={`home-service-${sv.id}`} style={styles.svCard} onPress={() => router.push("/(tabs)/services")} max={10}>
                <View style={styles.svIcon}><Ionicons name={sv.icon as any} size={22} color={C.brand} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.svTitle}>{sv.title}</Text>
                  <Text style={styles.svDesc} numberOfLines={2}>{sv.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={C.muted} />
              </Tilt3D>
            ))}
          </View>
          <Btn testID="home-all-services" label="See All 11 Services" variant="outline" onPress={() => router.push("/(tabs)/services")} style={{ marginTop: S.lg }} />
        </View>

        {/* How it works */}
        <View style={[styles.section, styles.darkBand]}>
          <Eyebrow>How It Works</Eyebrow>
          <SectionTitle light>Our Simple 4-Step Process</SectionTitle>
          <View style={{ marginTop: S.lg, gap: S.md }}>
            {STEPS.map((st) => (
              <View key={st.n} style={styles.step}>
                <View style={styles.stepNum}><Text style={styles.stepNumText}>{st.n}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>{st.title}</Text>
                  <Text style={styles.stepDesc}>{st.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Work preview */}
        <View style={styles.section}>
          <Eyebrow>Our Work</Eyebrow>
          <SectionTitle>Recent Projects</SectionTitle>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: S.md, paddingTop: S.lg }}>
            {GALLERY.slice(0, 5).map((g, i) => (
              <Tilt3D key={i} testID={`home-gallery-${i}`} onPress={() => router.push("/(tabs)/gallery")} style={styles.workCard} max={12}>
                <Image source={{ uri: g.img }} style={styles.workImg} contentFit="cover" transition={200} />
                <Text style={styles.workLabel}>{g.label}</Text>
                <Text style={styles.workTown}>{g.town}</Text>
              </Tilt3D>
            ))}
          </ScrollView>
        </View>

        {/* Testimonial */}
        <View style={styles.section}>
          <View style={styles.quoteCard}>
            <Stars n={5} size={18} />
            <Text style={styles.quoteText}>“{TESTIMONIALS[0].text}”</Text>
            <Text style={styles.quoteName}>{TESTIMONIALS[0].name} · {TESTIMONIALS[0].town}</Text>
            <Pressable testID="home-reviews-link" onPress={() => router.push("/(tabs)/reviews")}>
              <Text style={styles.quoteLink}>Read more reviews →</Text>
            </Pressable>
          </View>
        </View>

        {/* CTA band */}
        <View style={[styles.section, styles.ctaBand]}>
          <Text style={styles.ctaTitle}>Ready for a free, no-obligation quote?</Text>
          <Text style={styles.ctaSub}>Covering {BIZ.area} · {BIZ.hours}</Text>
          <Btn testID="cta-quote-btn" label="Get a Free Quote" icon="calculator" onPress={goQuote} variant="dark" style={{ marginTop: S.md }} />
          <Pressable testID="cta-call-btn" onPress={call} style={styles.ctaCall}>
            <Ionicons name="call" size={16} color={C.ink} />
            <Text style={styles.ctaCallText}>{BIZ.phone}  ·  {BIZ.mobile}</Text>
          </Pressable>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Logo size={40} />
          <Text style={styles.footerText}>Expert driveways, patios & paths across {BIZ.area}. Trusted since 2009.</Text>
          <Text style={styles.footerMeta}>{BIZ.email}</Text>
          <Pressable testID="admin-link" onPress={() => router.push("/admin")}>
            <Text style={styles.footerAdmin}>Staff Login</Text>
          </Pressable>
          <Text style={styles.footerCopy}>© 2026 T&B Paving. All rights reserved.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: S.lg, paddingBottom: 10, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border, zIndex: 10 },
  callPill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: C.brand, paddingHorizontal: S.md, paddingVertical: 8, borderRadius: R.pill },
  callPillText: { color: C.onBrand, fontWeight: "800", fontSize: 12, letterSpacing: 0.5 },
  hero: { height: 460, justifyContent: "flex-end" },
  heroContent: { padding: S.xl, paddingBottom: S["2xl"] },
  heroBadge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.12)", paddingHorizontal: S.md, paddingVertical: 7, borderRadius: R.pill, marginBottom: S.md },
  heroBadgeText: { color: C.accent, fontWeight: "800", fontSize: 11, letterSpacing: 1.5 },
  heroTitle: { color: C.surface, fontSize: 34, fontWeight: "900", lineHeight: 39, letterSpacing: -0.8 },
  heroSub: { color: "rgba(255,255,255,0.88)", fontSize: 15, lineHeight: 22, marginTop: S.md },
  heroBtns: { flexDirection: "row", marginTop: S.xl },
  heroLink: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: S.md },
  heroLinkText: { color: C.surface, fontWeight: "700", fontSize: 14, textDecorationLine: "underline" },
  statsRow: { flexDirection: "row", backgroundColor: C.ink, paddingVertical: S.lg },
  stat: { flex: 1, alignItems: "center" },
  statVal: { color: C.accent, fontSize: 24, fontWeight: "900" },
  statLabel: { color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: "600", marginTop: 2, textAlign: "center" },
  section: { paddingHorizontal: S.lg, paddingVertical: S.xl },
  trustWrap: { flexDirection: "row", flexWrap: "wrap", gap: S.sm, justifyContent: "center" },
  trustChip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, paddingHorizontal: S.md, paddingVertical: 9, borderRadius: R.pill },
  trustText: { fontSize: 12, fontWeight: "700", color: C.ink },
  svCard: { flexDirection: "row", alignItems: "center", gap: S.md, backgroundColor: C.surface, borderRadius: R.lg, padding: S.md, borderWidth: 1, borderColor: C.border, ...SHADOW.card },
  svIcon: { width: 46, height: 46, borderRadius: R.md, backgroundColor: C.accentSoft, alignItems: "center", justifyContent: "center" },
  svTitle: { fontSize: 15, fontWeight: "800", color: C.ink },
  svDesc: { fontSize: 12.5, color: C.muted, marginTop: 2, lineHeight: 17 },
  darkBand: { backgroundColor: C.ink },
  step: { flexDirection: "row", gap: S.md, alignItems: "flex-start" },
  stepNum: { width: 44, height: 44, borderRadius: R.md, backgroundColor: C.brand, alignItems: "center", justifyContent: "center" },
  stepNumText: { color: C.onBrand, fontWeight: "900", fontSize: 16 },
  stepTitle: { color: C.surface, fontSize: 16, fontWeight: "800" },
  stepDesc: { color: "rgba(255,255,255,0.72)", fontSize: 13, marginTop: 3, lineHeight: 19 },
  workCard: { width: 220 },
  workImg: { width: 220, height: 150, borderRadius: R.lg, backgroundColor: C.surfaceAlt },
  workLabel: { fontSize: 14, fontWeight: "800", color: C.ink, marginTop: S.sm },
  workTown: { fontSize: 12, color: C.muted },
  quoteCard: { backgroundColor: C.surface, borderRadius: R.xl, padding: S.xl, borderWidth: 1, borderColor: C.border, ...SHADOW.card },
  quoteText: { fontSize: 17, color: C.ink, lineHeight: 25, marginTop: S.md, fontStyle: "italic" },
  quoteName: { fontSize: 13, fontWeight: "800", color: C.brand, marginTop: S.md },
  quoteLink: { fontSize: 13, fontWeight: "700", color: C.inkSoft, marginTop: S.md },
  ctaBand: { backgroundColor: C.accentSoft, margin: S.lg, borderRadius: R.xl, alignItems: "center" },
  ctaTitle: { fontSize: 22, fontWeight: "900", color: C.ink, textAlign: "center", letterSpacing: -0.5 },
  ctaSub: { fontSize: 13, color: C.inkSoft, marginTop: 6, textAlign: "center" },
  ctaCall: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: S.md },
  ctaCallText: { fontSize: 14, fontWeight: "800", color: C.ink },
  footer: { backgroundColor: C.ink, padding: S.xl, alignItems: "center" },
  footerText: { color: "rgba(255,255,255,0.75)", fontSize: 13, textAlign: "center", marginTop: S.md, lineHeight: 19 },
  footerMeta: { color: C.accent, fontSize: 13, fontWeight: "700", marginTop: S.sm },
  footerAdmin: { color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: S.lg, textDecorationLine: "underline" },
  footerCopy: { color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: S.md },
});
