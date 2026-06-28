import React, { useRef, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable, Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { C, S, R, SHADOW } from "@/src/theme";
import { Btn, Eyebrow, SectionTitle, Logo, Stars, MaxWidth } from "@/src/components/ui";
import { Tilt3D } from "@/src/components/Card3D";
import {
  BIZ, STATS, TRUST, SERVICES, STEPS, HERO_IMG, ABOUT_IMG,
  GALLERY, TESTIMONIALS, AREAS, FAQS, REVIEW_PLATFORMS,
} from "@/src/brand";
import { useResponsive } from "@/src/hooks/use-responsive";

export default function Home() {
  const router = useRouter();
  const { scrollTo } = useLocalSearchParams<{ scrollTo?: string }>();
  const { isDesktop, isTablet, hPad } = useResponsive();

  const scrollRef = useRef<ScrollView>(null);
  const sectionY = useRef<Record<string, number>>({});

  const call = () => Linking.openURL(`tel:${BIZ.mobile.replace(/\s/g, "")}`);
  const goQuote = () => router.push("/(tabs)/quote" as any);

  const doScroll = useCallback((key: string) => {
    const y = sectionY.current[key];
    if (y !== undefined) {
      scrollRef.current?.scrollTo({ y: y - 16, animated: true });
    }
  }, []);

  useEffect(() => {
    if (!scrollTo) return;
    const timer = setTimeout(() => doScroll(scrollTo), 300);
    return () => clearTimeout(timer);
  }, [scrollTo, doScroll]);

  const onLayout = (key: string) => (e: any) => {
    sectionY.current[key] = e.nativeEvent.layout.y;
  };

  const heroH = isDesktop ? 640 : isTablet ? 540 : 480;
  const heroTitleSize = isDesktop ? 52 : isTablet ? 42 : 36;

  return (
    <ScrollView
      ref={scrollRef}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: S["3xl"] }}
      style={{ flex: 1, backgroundColor: C.bg }}
    >
      {/* ── HERO ── */}
      <View style={[styles.hero, { height: heroH }]}>
        <Image source={HERO_IMG} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
        <LinearGradient
          colors={["rgba(20,15,10,0.15)", "rgba(20,15,10,0.85)"]}
          style={StyleSheet.absoluteFill}
        />
        <MaxWidth style={{ flex: 1, justifyContent: "flex-end" }}>
          <View style={[styles.heroContent, { paddingHorizontal: hPad }]}>
            <View style={styles.heroBadge}>
              <Ionicons name="shield-checkmark" size={13} color={C.accent} />
              <Text style={styles.heroBadgeText}>{BIZ.since.toUpperCase()}</Text>
            </View>
            <Text style={[styles.heroTitle, { fontSize: heroTitleSize, lineHeight: heroTitleSize * 1.08 }]}>
              {BIZ.headline}
            </Text>
            <Text style={styles.heroSub}>{BIZ.intro}</Text>
            <View style={[styles.heroBtns, isDesktop && { flexDirection: "row", gap: S.md }]}>
              <Btn
                testID="hero-quote-btn"
                label="Get a Free Quote"
                icon="calculator"
                onPress={goQuote}
                style={isDesktop ? { alignSelf: "flex-start", paddingHorizontal: 32 } : { flex: 1 }}
              />
              <Pressable onPress={call} style={[styles.heroCallBtn, !isDesktop && { marginTop: S.md }]}>
                <Ionicons name="call" size={16} color={C.surface} />
                <Text style={styles.heroCallText}>{BIZ.phone}</Text>
              </Pressable>
            </View>
          </View>
        </MaxWidth>
      </View>

      {/* ── STATS ── */}
      <View style={styles.statsBar}>
        <MaxWidth style={styles.statsRow}>
          {STATS.map((s, i) => (
            <React.Fragment key={s.label}>
              <View style={styles.stat}>
                <Text style={styles.statVal}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
              {i < STATS.length - 1 && <View style={styles.statDivider} />}
            </React.Fragment>
          ))}
        </MaxWidth>
      </View>

      {/* ── TRUST ── */}
      <View style={[styles.section, { paddingHorizontal: hPad, paddingVertical: S.lg }]}>
        <MaxWidth>
          <View style={styles.trustWrap}>
            {TRUST.map((t) => (
              <View key={t.label} style={styles.trustChip}>
                <Ionicons name={t.icon as any} size={15} color={C.brand} />
                <Text style={styles.trustText}>{t.label}</Text>
              </View>
            ))}
          </View>
        </MaxWidth>
      </View>

      {/* ── SERVICES ── */}
      <View
        onLayout={onLayout("services")}
        style={[styles.section, { paddingHorizontal: hPad }]}
      >
        <MaxWidth>
          <Eyebrow>What We Offer</Eyebrow>
          <SectionTitle>Our Paving Services</SectionTitle>
          <View style={[
            { marginTop: S.lg },
            isDesktop
              ? { flexDirection: "row", flexWrap: "wrap", gap: S.md }
              : { gap: S.md },
          ]}>
            {SERVICES.slice(0, isDesktop ? 6 : 4).map((sv) => (
              <Tilt3D
                key={sv.id}
                testID={`home-service-${sv.id}`}
                style={[
                  styles.svCard,
                  isDesktop && { width: "31.5%" },
                  isTablet && !isDesktop && { width: "48%" },
                ]}
                onPress={() => router.push("/(tabs)/services" as any)}
                max={8}
              >
                <View style={styles.svIcon}>
                  <Ionicons name={sv.icon as any} size={22} color={C.brand} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.svTitle}>{sv.title}</Text>
                  <Text style={styles.svDesc} numberOfLines={2}>{sv.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={C.muted} />
              </Tilt3D>
            ))}
          </View>
          <Btn
            testID="home-all-services"
            label="See All 11 Services"
            variant="outline"
            onPress={() => router.push("/(tabs)/services" as any)}
            style={{ marginTop: S.lg, alignSelf: isDesktop ? "flex-start" : undefined }}
          />
        </MaxWidth>
      </View>

      {/* ── PROCESS ── */}
      <View
        onLayout={onLayout("process")}
        style={[styles.darkBand, { paddingHorizontal: hPad, paddingVertical: S["2xl"] }]}
      >
        <MaxWidth>
          <Eyebrow>How It Works</Eyebrow>
          <SectionTitle light>Our Simple 4-Step Process</SectionTitle>
          <View style={[
            { marginTop: S.xl },
            isDesktop ? { flexDirection: "row", gap: S.lg } : { gap: S.lg },
          ]}>
            {STEPS.map((st, i) => (
              <View key={st.n} style={[styles.step, isDesktop && { flex: 1, flexDirection: "column", alignItems: "center" }]}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{st.n}</Text>
                </View>
                {isDesktop && i < STEPS.length - 1 && (
                  <View style={styles.stepConnector} />
                )}
                <View style={[{ flex: 1 }, isDesktop && { alignItems: "center", marginTop: S.md }]}>
                  <Ionicons name={st.icon as any} size={22} color={C.accent} style={{ marginBottom: 6 }} />
                  <Text style={[styles.stepTitle, isDesktop && { textAlign: "center" }]}>{st.title}</Text>
                  <Text style={[styles.stepDesc, isDesktop && { textAlign: "center" }]}>{st.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </MaxWidth>
      </View>

      {/* ── GALLERY ── */}
      <View
        onLayout={onLayout("gallery")}
        style={[styles.section, { paddingHorizontal: hPad }]}
      >
        <MaxWidth>
          <Eyebrow>Our Work</Eyebrow>
          <SectionTitle>Recent Projects</SectionTitle>
          <View style={[
            { marginTop: S.lg },
            isDesktop
              ? { flexDirection: "row", flexWrap: "wrap", gap: S.md }
              : { flexDirection: "row", flexWrap: "wrap", gap: S.md },
          ]}>
            {GALLERY.slice(0, isDesktop ? 8 : 4).map((g, i) => (
              <Tilt3D
                key={i}
                testID={`home-gallery-${i}`}
                onPress={() => router.push("/(tabs)/gallery" as any)}
                style={[
                  styles.galleryCard,
                  isDesktop && { width: "23%" },
                  !isDesktop && { width: "47%" },
                ]}
                max={10}
              >
                <Image
                  source={g.img}
                  style={[styles.galleryImg, { height: isDesktop ? 180 : 120 }]}
                  contentFit="cover"
                  transition={200}
                />
                <View style={{ padding: S.sm }}>
                  <Text style={styles.galleryLabel} numberOfLines={1}>{g.label}</Text>
                  <Text style={styles.galleryTown}>{g.town}</Text>
                </View>
              </Tilt3D>
            ))}
          </View>
          <Btn
            testID="home-gallery-all"
            label="View Full Gallery"
            variant="outline"
            onPress={() => router.push("/(tabs)/gallery" as any)}
            style={{ marginTop: S.lg, alignSelf: isDesktop ? "flex-start" : undefined }}
          />
        </MaxWidth>
      </View>

      {/* ── REVIEWS ── */}
      <View
        onLayout={onLayout("reviews")}
        style={[{ backgroundColor: C.surfaceAlt, paddingHorizontal: hPad, paddingVertical: S["2xl"] }]}
      >
        <MaxWidth>
          <Eyebrow>Testimonials</Eyebrow>
          <SectionTitle>What Our Customers Say</SectionTitle>
          <View style={[
            { marginTop: S.xl },
            (isDesktop || isTablet) ? { flexDirection: "row", gap: S.lg } : { gap: S.md },
          ]}>
            {TESTIMONIALS.map((t, i) => (
              <View key={i} style={[styles.quoteCard, (isDesktop || isTablet) && { flex: 1 }]}>
                <Stars n={t.stars} size={16} />
                <Text style={styles.quoteText}>"{t.text}"</Text>
                <View style={styles.quoteMeta}>
                  <View style={styles.quoteAvatar}>
                    <Text style={styles.quoteAvatarText}>{t.name[0]}</Text>
                  </View>
                  <View>
                    <Text style={styles.quoteName}>{t.name} · {t.town}</Text>
                    <Text style={styles.quoteJob}>{t.job}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
          {/* Platform badges */}
          <View style={[styles.platformsRow, { marginTop: S.xl }]}>
            <Text style={styles.platformsLabel}>ALSO REVIEWED ON</Text>
            <View style={styles.platforms}>
              {REVIEW_PLATFORMS.map((p) => (
                <View key={p} style={styles.platformChip}>
                  <Ionicons name="checkmark-circle" size={13} color={C.success} />
                  <Text style={styles.platformText}>{p}</Text>
                </View>
              ))}
            </View>
          </View>
          <Btn
            testID="home-reviews-all"
            label="Read More Reviews"
            variant="outline"
            onPress={() => router.push("/(tabs)/reviews" as any)}
            style={{ marginTop: S.lg, alignSelf: isDesktop ? "flex-start" : undefined }}
          />
        </MaxWidth>
      </View>

      {/* ── AREAS ── */}
      <View
        onLayout={onLayout("areas")}
        style={[styles.section, { paddingHorizontal: hPad }]}
      >
        <MaxWidth>
          <Eyebrow>Coverage</Eyebrow>
          <SectionTitle>Areas We Cover</SectionTitle>
          <Text style={styles.areasSub}>
            Proudly serving {BIZ.area}. Call us to confirm your postcode.
          </Text>
          <View style={styles.areaGrid}>
            {AREAS.map((a) => (
              <View key={a} style={styles.areaChip}>
                <Ionicons name="location" size={12} color={C.brand} />
                <Text style={styles.areaText}>{a}</Text>
              </View>
            ))}
          </View>
        </MaxWidth>
      </View>

      {/* ── FAQ ── */}
      <View
        onLayout={onLayout("faq")}
        style={[{ backgroundColor: C.surfaceAlt, paddingHorizontal: hPad, paddingVertical: S["2xl"] }]}
      >
        <MaxWidth>
          <Eyebrow>FAQ</Eyebrow>
          <SectionTitle>Common Questions</SectionTitle>
          <FaqAccordion faqs={FAQS} isDesktop={isDesktop} />
        </MaxWidth>
      </View>

      {/* ── CTA ── */}
      <View style={[styles.section, { paddingHorizontal: hPad }]}>
        <MaxWidth>
          <View style={[styles.ctaBand, isDesktop && styles.ctaBandDesktop]}>
            <View style={isDesktop && { flex: 1 }}>
              <Text style={[styles.ctaTitle, isDesktop && { fontSize: 30 }]}>
                Ready for a free, no-obligation quote?
              </Text>
              <Text style={styles.ctaSub}>
                Covering {BIZ.area} · {BIZ.hours}
              </Text>
            </View>
            <View style={[styles.ctaActions, isDesktop && { flexDirection: "row", gap: S.lg, alignItems: "center" }]}>
              <Btn
                testID="cta-quote-btn"
                label="Get a Free Quote"
                icon="calculator"
                onPress={goQuote}
                variant="dark"
              />
              <Pressable testID="cta-call-btn" onPress={call} style={styles.ctaCall}>
                <Ionicons name="call" size={16} color={C.ink} />
                <Text style={styles.ctaCallText}>{BIZ.phone}  ·  {BIZ.mobile}</Text>
              </Pressable>
            </View>
          </View>
        </MaxWidth>
      </View>

      {/* ── FOOTER ── */}
      <View style={styles.footerOuter}>
        <MaxWidth style={{ paddingHorizontal: hPad }}>
          <View style={[styles.footerInner, isDesktop && styles.footerInnerDesktop]}>
            <View>
              <Logo size={42} />
              <Text style={styles.footerDesc}>
                Expert driveways, patios & paths across {BIZ.area}.{"\n"}Family-run. Trusted since 2009.
              </Text>
            </View>
            {isDesktop && (
              <>
                <View>
                  <Text style={styles.footerColTitle}>SERVICES</Text>
                  {["Block Paving","Patios","Resin Bound","Tarmac","Concrete","Gravel"].map((s) => (
                    <Text key={s} style={styles.footerLink}>{s}</Text>
                  ))}
                </View>
                <View>
                  <Text style={styles.footerColTitle}>CONTACT</Text>
                  <Text style={styles.footerLink}>{BIZ.phone}</Text>
                  <Text style={styles.footerLink}>{BIZ.mobile}</Text>
                  <Text style={styles.footerLink}>{BIZ.email}</Text>
                  <Text style={styles.footerLink}>{BIZ.hours}</Text>
                </View>
              </>
            )}
          </View>
          <View style={styles.footerBottom}>
            <Text style={styles.footerCopy}>© 2026 T&B Paving. All rights reserved.</Text>
            <Pressable testID="admin-link" onPress={() => router.push("/admin" as any)}>
              <Text style={styles.footerAdmin}>Staff Login</Text>
            </Pressable>
          </View>
        </MaxWidth>
      </View>
    </ScrollView>
  );
}

/* ── FAQ Accordion (self-contained) ── */
function FaqAccordion({ faqs, isDesktop }: { faqs: typeof FAQS; isDesktop: boolean }) {
  const [open, setOpen] = React.useState<number | null>(null);
  return (
    <View style={[
      { marginTop: S.lg },
      isDesktop ? { flexDirection: "row", flexWrap: "wrap", gap: S.md } : { gap: S.sm },
    ]}>
      {faqs.map((f, i) => (
        <Pressable
          key={i}
          testID={`faq-${i}`}
          style={[styles.faq, isDesktop && { width: "48%" }]}
          onPress={() => setOpen(open === i ? null : i)}
        >
          <View style={styles.faqRow}>
            <Text style={styles.faqQ}>{f.q}</Text>
            <Ionicons name={open === i ? "chevron-up" : "chevron-down"} size={18} color={C.brand} />
          </View>
          {open === i && <Text style={styles.faqA}>{f.a}</Text>}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { justifyContent: "flex-end" },
  heroContent: { paddingBottom: 40 },
  heroBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: S.md, paddingVertical: 7,
    borderRadius: R.pill, marginBottom: S.md,
  },
  heroBadgeText: { color: C.accent, fontWeight: "800", fontSize: 11, letterSpacing: 1.5 },
  heroTitle: { color: C.surface, fontWeight: "900", letterSpacing: -1, maxWidth: 700 },
  heroSub: { color: "rgba(255,255,255,0.88)", fontSize: 16, lineHeight: 24, marginTop: S.md, maxWidth: 560 },
  heroBtns: { marginTop: S.xl },
  heroCallBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.5)",
    paddingHorizontal: S.lg, paddingVertical: 14,
    borderRadius: R.pill, alignSelf: "flex-start",
  },
  heroCallText: { color: C.surface, fontWeight: "700", fontSize: 14 },
  statsBar: { backgroundColor: C.ink },
  statsRow: { flexDirection: "row", paddingVertical: S.lg },
  stat: { flex: 1, alignItems: "center" },
  statVal: { color: C.accent, fontSize: 26, fontWeight: "900" },
  statLabel: { color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: "600", marginTop: 2, textAlign: "center" },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.12)", marginVertical: 8 },
  section: { paddingVertical: S["2xl"] },
  trustWrap: { flexDirection: "row", flexWrap: "wrap", gap: S.sm, justifyContent: "center" },
  trustChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: S.md, paddingVertical: 9, borderRadius: R.pill,
  },
  trustText: { fontSize: 12, fontWeight: "700", color: C.ink },
  svCard: {
    flexDirection: "row", alignItems: "center", gap: S.md,
    backgroundColor: C.surface, borderRadius: R.lg,
    padding: S.md, borderWidth: 1, borderColor: C.border, ...SHADOW.card,
  },
  svIcon: {
    width: 46, height: 46, borderRadius: R.md,
    backgroundColor: C.accentSoft, alignItems: "center", justifyContent: "center",
  },
  svTitle: { fontSize: 15, fontWeight: "800", color: C.ink },
  svDesc: { fontSize: 12.5, color: C.muted, marginTop: 2, lineHeight: 17 },
  darkBand: { backgroundColor: C.ink },
  step: { flexDirection: "row", gap: S.md, alignItems: "flex-start" },
  stepNum: {
    width: 44, height: 44, borderRadius: R.md,
    backgroundColor: C.brand, alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  stepNumText: { color: C.onBrand, fontWeight: "900", fontSize: 16 },
  stepConnector: { display: "none" },
  stepTitle: { color: C.surface, fontSize: 16, fontWeight: "800" },
  stepDesc: { color: "rgba(255,255,255,0.72)", fontSize: 13, marginTop: 4, lineHeight: 19 },
  galleryCard: {
    borderRadius: R.lg, overflow: "hidden",
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
  },
  galleryImg: { width: "100%", backgroundColor: C.surfaceAlt },
  galleryLabel: { fontSize: 13, fontWeight: "800", color: C.ink },
  galleryTown: { fontSize: 11, color: C.muted, marginTop: 1 },
  quoteCard: {
    backgroundColor: C.surface, borderRadius: R.xl,
    padding: S.lg, borderWidth: 1, borderColor: C.border, ...SHADOW.card,
  },
  quoteText: { fontSize: 15, color: C.ink, lineHeight: 23, marginTop: S.sm, fontStyle: "italic" },
  quoteMeta: { flexDirection: "row", alignItems: "center", gap: S.sm, marginTop: S.md },
  quoteAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.brand, alignItems: "center", justifyContent: "center",
  },
  quoteAvatarText: { color: "#fff", fontWeight: "900", fontSize: 15 },
  quoteName: { fontSize: 13, fontWeight: "800", color: C.ink },
  quoteJob: { fontSize: 11.5, color: C.muted },
  platformsRow: { alignItems: "center" },
  platformsLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 1.5, color: C.muted, textAlign: "center", marginBottom: S.md },
  platforms: { flexDirection: "row", flexWrap: "wrap", gap: S.sm, justifyContent: "center" },
  platformChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: S.md, paddingVertical: 7, borderRadius: R.pill,
  },
  platformText: { fontSize: 12.5, fontWeight: "700", color: C.ink },
  areasSub: { fontSize: 14, color: C.muted, marginTop: 6, lineHeight: 21 },
  areaGrid: { flexDirection: "row", flexWrap: "wrap", gap: S.sm, marginTop: S.lg },
  areaChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: C.surface, paddingHorizontal: S.md, paddingVertical: 8,
    borderRadius: R.pill, borderWidth: 1, borderColor: C.border,
  },
  areaText: { fontSize: 12.5, fontWeight: "600", color: C.ink },
  faq: {
    backgroundColor: C.surface, borderRadius: R.md,
    padding: S.md, borderWidth: 1, borderColor: C.border,
  },
  faqRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: S.sm },
  faqQ: { flex: 1, fontSize: 14.5, fontWeight: "700", color: C.ink, lineHeight: 20 },
  faqA: { fontSize: 13.5, color: C.muted, lineHeight: 20, marginTop: S.sm },
  ctaBand: {
    backgroundColor: C.accentSoft, borderRadius: R.xl,
    padding: S.xl, gap: S.lg,
  },
  ctaBandDesktop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  ctaTitle: { fontSize: 24, fontWeight: "900", color: C.ink, letterSpacing: -0.5 },
  ctaSub: { fontSize: 13, color: C.inkSoft, marginTop: 6 },
  ctaActions: { gap: S.md },
  ctaCall: { flexDirection: "row", alignItems: "center", gap: 8 },
  ctaCallText: { fontSize: 14, fontWeight: "800", color: C.ink },
  footerOuter: { backgroundColor: C.ink },
  footerInner: { paddingVertical: S["2xl"] },
  footerInnerDesktop: { flexDirection: "row", justifyContent: "space-between", gap: S["2xl"] },
  footerDesc: { color: "rgba(255,255,255,0.65)", fontSize: 13, marginTop: S.md, lineHeight: 20, maxWidth: 320 },
  footerColTitle: { color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "800", letterSpacing: 1.5, marginBottom: S.sm },
  footerLink: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "600", marginBottom: 6 },
  footerBottom: {
    borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)",
    paddingVertical: S.md,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  footerCopy: { color: "rgba(255,255,255,0.4)", fontSize: 11 },
  footerAdmin: { color: "rgba(255,255,255,0.4)", fontSize: 11, textDecorationLine: "underline" },
});
