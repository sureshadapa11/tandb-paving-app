import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Linking, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Animated, {
  useAnimatedScrollHandler, useSharedValue, useAnimatedStyle, interpolate, Extrapolation,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { C, S, R, SHADOW } from "@/src/theme";
import { Btn, Eyebrow, SectionTitle, Logo, Stars, MaxWidth } from "@/src/components/ui";
import { Tilt3D } from "@/src/components/Card3D";
import { BIZ, STATS, TRUST, SERVICES, STEPS, HERO_IMG, GALLERY, TESTIMONIALS } from "@/src/brand";
import { useResponsive } from "@/src/hooks/use-responsive";

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isDesktop, isTablet, hPad } = useResponsive();
  const { width } = useWindowDimensions();
  const goQuote = () => router.push("/(tabs)/quote");
  const call = () => Linking.openURL(`tel:${BIZ.mobile.replace(/\s/g, "")}`);

  const scrollY = useSharedValue(0);
  const contentH = useSharedValue(1);
  const viewH = useSharedValue(1);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
    viewH.value = e.layoutMeasurement.height;
    contentH.value = e.contentSize.height;
  });

  const headerShadow = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(scrollY.value, [0, 36], [0, 0.14], Extrapolation.CLAMP),
    elevation: interpolate(scrollY.value, [0, 36], [0, 6], Extrapolation.CLAMP),
  }));
  const headerBorder = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 36], [0, 1], Extrapolation.CLAMP),
  }));
  const progress = useAnimatedStyle(() => {
    const max = Math.max(contentH.value - viewH.value, 1);
    return { width: `${interpolate(scrollY.value, [0, max], [0, 100], Extrapolation.CLAMP)}%` };
  });

  const HEADER_PAD = insets.top + 6;
  const heroH = isDesktop ? 600 : isTablet ? 520 : 460;
  const heroTitleSize = isDesktop ? 48 : isTablet ? 40 : 34;
  const sectionPad = isDesktop ? S["2xl"] : S.xl;

  // Services grid: 2 cols on desktop, single col on smaller
  const svCols = isDesktop ? 2 : 1;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Frosted glass sticky header */}
      <Animated.View style={[styles.header, { paddingTop: HEADER_PAD }, headerShadow]}>
        <BlurView intensity={28} tint="light" style={StyleSheet.absoluteFill} />
        <View style={styles.headerTint} />
        <MaxWidth>
          <View style={styles.headerRow}>
            <Logo size={36} />
            <View style={styles.headerRight}>
              <View style={styles.ratingChip}>
                <Ionicons name="star" size={11} color={C.gold} />
                <Text style={styles.ratingText}>5.0</Text>
              </View>
              <Pressable testID="header-call-btn" onPress={call}>
                <LinearGradient colors={[C.brand, C.brandDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.callPill}>
                  <Ionicons name="call" size={14} color={C.onBrand} />
                  <Text style={styles.callPillText}>CALL NOW</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </MaxWidth>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, progress]} />
        </View>
        <Animated.View style={[styles.headerHairline, headerBorder]} />
      </Animated.View>

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: S["3xl"] }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={[styles.hero, { height: heroH }]}>
          <Image source={{ uri: HERO_IMG }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
          <LinearGradient colors={["rgba(20,15,10,0.3)", "rgba(20,15,10,0.88)"]} style={StyleSheet.absoluteFill} />
          <MaxWidth style={{ flex: 1, justifyContent: "flex-end" }}>
            <View style={[styles.heroContent, { paddingHorizontal: hPad }]}>
              <View style={styles.heroBadge}>
                <Ionicons name="shield-checkmark" size={13} color={C.accent} />
                <Text style={styles.heroBadgeText}>{BIZ.since.toUpperCase()}</Text>
              </View>
              <Text style={[styles.heroTitle, { fontSize: heroTitleSize }]}>{BIZ.headline}</Text>
              <Text style={styles.heroSub}>{BIZ.intro}</Text>
              <View style={[styles.heroBtns, isDesktop && { flexDirection: "row", gap: S.md }]}>
                <Btn testID="hero-quote-btn" label="Get a Free Quote" icon="calculator" onPress={goQuote} style={isDesktop ? { alignSelf: "flex-start", paddingHorizontal: 32 } : { flex: 1 }} />
                {isDesktop && (
                  <Pressable testID="hero-call-btn" onPress={call} style={styles.heroCTA2}>
                    <Ionicons name="call" size={16} color={C.surface} />
                    <Text style={styles.heroCTA2Text}>{BIZ.phone}</Text>
                  </Pressable>
                )}
              </View>
              <Pressable testID="hero-services-btn" onPress={() => router.push("/(tabs)/services")} style={styles.heroLink}>
                <Text style={styles.heroLinkText}>View Our Services</Text>
                <Ionicons name="arrow-forward" size={16} color={C.surface} />
              </Pressable>
            </View>
          </MaxWidth>
        </View>

        {/* Stats */}
        <View style={styles.statsBar}>
          <MaxWidth style={styles.statsRow}>
            {STATS.map((s) => (
              <View key={s.label} style={styles.stat}>
                <Text style={styles.statVal}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </MaxWidth>
        </View>

        {/* Trust badges */}
        <View style={[styles.section, { paddingHorizontal: hPad }]}>
          <MaxWidth>
            <View style={styles.trustWrap}>
              {TRUST.map((t) => (
                <View key={t.label} style={styles.trustChip}>
                  <Ionicons name={t.icon as any} size={16} color={C.brand} />
                  <Text style={styles.trustText}>{t.label}</Text>
                </View>
              ))}
            </View>
          </MaxWidth>
        </View>

        {/* Services preview */}
        <View style={[styles.section, { paddingHorizontal: hPad }]}>
          <MaxWidth>
            <Eyebrow>What We Offer</Eyebrow>
            <SectionTitle>Our Paving Services</SectionTitle>
            <View style={[
              { marginTop: S.lg },
              svCols > 1
                ? { flexDirection: "row", flexWrap: "wrap", gap: S.md }
                : { gap: S.md }
            ]}>
              {SERVICES.slice(0, isDesktop ? 6 : 4).map((sv) => (
                <Tilt3D
                  key={sv.id}
                  testID={`home-service-${sv.id}`}
                  style={[styles.svCard, svCols > 1 && { width: `${100 / svCols - 1.5}%` }]}
                  onPress={() => router.push("/(tabs)/services")}
                  max={10}
                >
                  <View style={styles.svIcon}><Ionicons name={sv.icon as any} size={22} color={C.brand} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.svTitle}>{sv.title}</Text>
                    <Text style={styles.svDesc} numberOfLines={2}>{sv.desc}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={C.muted} />
                </Tilt3D>
              ))}
            </View>
            <Btn testID="home-all-services" label="See All 11 Services" variant="outline" onPress={() => router.push("/(tabs)/services")} style={{ marginTop: S.lg, alignSelf: isDesktop ? "flex-start" : undefined }} />
          </MaxWidth>
        </View>

        {/* How it works */}
        <View style={[styles.section, styles.darkBand, { paddingHorizontal: hPad }]}>
          <MaxWidth>
            <Eyebrow>How It Works</Eyebrow>
            <SectionTitle light>Our Simple 4-Step Process</SectionTitle>
            <View style={[
              { marginTop: S.lg },
              isDesktop
                ? { flexDirection: "row", flexWrap: "wrap", gap: S.lg }
                : { gap: S.md }
            ]}>
              {STEPS.map((st) => (
                <View key={st.n} style={[styles.step, isDesktop && { width: "48%" }]}>
                  <View style={styles.stepNum}><Text style={styles.stepNumText}>{st.n}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepTitle}>{st.title}</Text>
                    <Text style={styles.stepDesc}>{st.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </MaxWidth>
        </View>

        {/* Work preview */}
        <View style={[styles.section, { paddingHorizontal: hPad }]}>
          <MaxWidth>
            <Eyebrow>Our Work</Eyebrow>
            <SectionTitle>Recent Projects</SectionTitle>
            {isDesktop ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: S.md, marginTop: S.lg }}>
                {GALLERY.slice(0, 4).map((g, i) => (
                  <Tilt3D key={i} testID={`home-gallery-${i}`} onPress={() => router.push("/(tabs)/gallery")} style={styles.workCardDesktop} max={12}>
                    <Image source={{ uri: g.img }} style={styles.workImgDesktop} contentFit="cover" transition={200} />
                    <Text style={styles.workLabel}>{g.label}</Text>
                    <Text style={styles.workTown}>{g.town}</Text>
                  </Tilt3D>
                ))}
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: S.md, paddingTop: S.lg }}>
                {GALLERY.slice(0, 5).map((g, i) => (
                  <Tilt3D key={i} testID={`home-gallery-${i}`} onPress={() => router.push("/(tabs)/gallery")} style={styles.workCard} max={12}>
                    <Image source={{ uri: g.img }} style={styles.workImg} contentFit="cover" transition={200} />
                    <Text style={styles.workLabel}>{g.label}</Text>
                    <Text style={styles.workTown}>{g.town}</Text>
                  </Tilt3D>
                ))}
              </ScrollView>
            )}
          </MaxWidth>
        </View>

        {/* Testimonials */}
        <View style={[styles.section, { paddingHorizontal: hPad }]}>
          <MaxWidth>
            {isDesktop ? (
              <View style={{ flexDirection: "row", gap: S.lg }}>
                {TESTIMONIALS.map((t, i) => (
                  <View key={i} style={[styles.quoteCard, { flex: 1 }]}>
                    <Stars n={5} size={16} />
                    <Text style={styles.quoteText}>"{t.text}"</Text>
                    <Text style={styles.quoteName}>{t.name} · {t.town}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.quoteCard}>
                <Stars n={5} size={18} />
                <Text style={styles.quoteText}>"{TESTIMONIALS[0].text}"</Text>
                <Text style={styles.quoteName}>{TESTIMONIALS[0].name} · {TESTIMONIALS[0].town}</Text>
                <Pressable testID="home-reviews-link" onPress={() => router.push("/(tabs)/reviews")}>
                  <Text style={styles.quoteLink}>Read more reviews →</Text>
                </Pressable>
              </View>
            )}
            {isDesktop && (
              <Pressable testID="home-reviews-link" onPress={() => router.push("/(tabs)/reviews")} style={{ marginTop: S.md }}>
                <Text style={styles.quoteLink}>Read more reviews →</Text>
              </Pressable>
            )}
          </MaxWidth>
        </View>

        {/* CTA band */}
        <View style={[styles.section, { paddingHorizontal: hPad }]}>
          <MaxWidth>
            <View style={styles.ctaBand}>
              <Text style={[styles.ctaTitle, isDesktop && { fontSize: 28 }]}>Ready for a free, no-obligation quote?</Text>
              <Text style={styles.ctaSub}>Covering {BIZ.area} · {BIZ.hours}</Text>
              <View style={[isDesktop && { flexDirection: "row", alignItems: "center", gap: S.xl, marginTop: S.md }]}>
                <Btn testID="cta-quote-btn" label="Get a Free Quote" icon="calculator" onPress={goQuote} variant="dark" style={!isDesktop && { marginTop: S.md }} />
                <Pressable testID="cta-call-btn" onPress={call} style={[styles.ctaCall, !isDesktop && { marginTop: S.md }]}>
                  <Ionicons name="call" size={16} color={C.ink} />
                  <Text style={styles.ctaCallText}>{BIZ.phone}  ·  {BIZ.mobile}</Text>
                </Pressable>
              </View>
            </View>
          </MaxWidth>
        </View>

        {/* Footer */}
        <View style={styles.footerOuter}>
          <MaxWidth style={{ paddingHorizontal: hPad }}>
            <View style={[styles.footer, isDesktop && styles.footerDesktop]}>
              <View style={isDesktop && { alignItems: "flex-start" }}>
                <Logo size={40} />
                <Text style={styles.footerText}>Expert driveways, patios & paths across {BIZ.area}. Trusted since 2009.</Text>
                <Text style={styles.footerMeta}>{BIZ.email}</Text>
              </View>
              {isDesktop && (
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.footerMeta}>{BIZ.phone}</Text>
                  <Text style={styles.footerMeta}>{BIZ.mobile}</Text>
                  <Text style={styles.footerMeta}>{BIZ.hours}</Text>
                </View>
              )}
            </View>
            <View style={styles.footerBottom}>
              <Pressable testID="admin-link" onPress={() => router.push("/admin")}>
                <Text style={styles.footerAdmin}>Staff Login</Text>
              </Pressable>
              <Text style={styles.footerCopy}>© 2026 T&B Paving. All rights reserved.</Text>
            </View>
          </MaxWidth>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 20, overflow: "hidden", backgroundColor: "transparent", shadowColor: "#3A2A1A", shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  headerTint: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(255,255,255,0.82)" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingBottom: 10 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: S.sm },
  ratingChip: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(0,0,0,0.05)", paddingHorizontal: 8, paddingVertical: 5, borderRadius: R.pill },
  ratingText: { fontSize: 12, fontWeight: "800", color: C.ink },
  callPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: S.md, paddingVertical: 9, borderRadius: R.pill },
  callPillText: { color: C.onBrand, fontWeight: "800", fontSize: 12, letterSpacing: 0.5 },
  progressTrack: { height: 3, backgroundColor: "rgba(0,0,0,0.06)" },
  progressFill: { height: 3, backgroundColor: C.brand },
  headerHairline: { position: "absolute", bottom: 0, left: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: C.border },
  hero: { justifyContent: "flex-end" },
  heroContent: { paddingBottom: S["2xl"] },
  heroBadge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.12)", paddingHorizontal: S.md, paddingVertical: 7, borderRadius: R.pill, marginBottom: S.md },
  heroBadgeText: { color: C.accent, fontWeight: "800", fontSize: 11, letterSpacing: 1.5 },
  heroTitle: { color: C.surface, fontWeight: "900", lineHeight: 1.1 * 34, letterSpacing: -0.8 },
  heroSub: { color: "rgba(255,255,255,0.88)", fontSize: 15, lineHeight: 22, marginTop: S.md, maxWidth: 560 },
  heroBtns: { marginTop: S.xl },
  heroLink: { flexDirection: "row", alignItems: "center", justifyContent: "flex-start", gap: 6, marginTop: S.md },
  heroLinkText: { color: C.surface, fontWeight: "700", fontSize: 14, textDecorationLine: "underline" },
  heroCTA2: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.5)", paddingHorizontal: S.lg, paddingVertical: 14, borderRadius: R.pill },
  heroCTA2Text: { color: C.surface, fontWeight: "700", fontSize: 14 },
  statsBar: { backgroundColor: C.ink },
  statsRow: { flexDirection: "row", paddingVertical: S.lg },
  stat: { flex: 1, alignItems: "center" },
  statVal: { color: C.accent, fontSize: 24, fontWeight: "900" },
  statLabel: { color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: "600", marginTop: 2, textAlign: "center" },
  section: { paddingVertical: S.xl },
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
  workCardDesktop: { width: "23.5%" },
  workImgDesktop: { width: "100%", height: 180, borderRadius: R.lg, backgroundColor: C.surfaceAlt },
  workLabel: { fontSize: 14, fontWeight: "800", color: C.ink, marginTop: S.sm },
  workTown: { fontSize: 12, color: C.muted },
  quoteCard: { backgroundColor: C.surface, borderRadius: R.xl, padding: S.xl, borderWidth: 1, borderColor: C.border, ...SHADOW.card },
  quoteText: { fontSize: 17, color: C.ink, lineHeight: 25, marginTop: S.md, fontStyle: "italic" },
  quoteName: { fontSize: 13, fontWeight: "800", color: C.brand, marginTop: S.md },
  quoteLink: { fontSize: 13, fontWeight: "700", color: C.inkSoft, marginTop: S.md },
  ctaBand: { backgroundColor: C.accentSoft, borderRadius: R.xl, padding: S.xl },
  ctaTitle: { fontSize: 22, fontWeight: "900", color: C.ink, letterSpacing: -0.5 },
  ctaSub: { fontSize: 13, color: C.inkSoft, marginTop: 6 },
  ctaCall: { flexDirection: "row", alignItems: "center", gap: 8 },
  ctaCallText: { fontSize: 14, fontWeight: "800", color: C.ink },
  footerOuter: { backgroundColor: C.ink },
  footer: { paddingVertical: S.xl, alignItems: "center" },
  footerDesktop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  footerText: { color: "rgba(255,255,255,0.75)", fontSize: 13, textAlign: "center", marginTop: S.md, lineHeight: 19, maxWidth: 400 },
  footerMeta: { color: C.accent, fontSize: 13, fontWeight: "700", marginTop: S.sm },
  footerBottom: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)", paddingVertical: S.md, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  footerAdmin: { color: "rgba(255,255,255,0.5)", fontSize: 12, textDecorationLine: "underline" },
  footerCopy: { color: "rgba(255,255,255,0.4)", fontSize: 11 },
});
