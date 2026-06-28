import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Head from "expo-router/head";
import { Ionicons } from "@expo/vector-icons";
import { C, S, R, SHADOW } from "@/src/theme";
import { Eyebrow, Stars, Btn, MaxWidth } from "@/src/components/ui";
import { TESTIMONIALS, REVIEW_PLATFORMS, AREAS, FAQS, BIZ } from "@/src/brand";
import { useResponsive } from "@/src/hooks/use-responsive";

const BACKEND = process.env.EXPO_PUBLIC_BACKEND_URL ?? "";

type Testimonial = { id: string; name: string; town: string; job: string; stars: number; text: string };

export default function Reviews() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [open, setOpen] = useState<number | null>(0);
  const { isDesktop, isTablet, hPad } = useResponsive();

  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loadingT, setLoadingT] = useState(true);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${BACKEND}/api/public/testimonials`).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`${BACKEND}/api/site-settings`).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([t, s]) => {
      setTestimonials(t);
      setSettings(s);
      setLoadingT(false);
    });
  }, []);

  const displayTestimonials = testimonials.length > 0 ? testimonials : TESTIMONIALS;
  const faqs = settings?.faqs?.length ? settings.faqs : FAQS;
  const areas = settings?.areas?.length ? settings.areas : AREAS;
  const coverageArea = settings?.area || BIZ.area;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Head>
        <title>Customer Reviews | T&B Paving — Essex & Suffolk</title>
        <meta name="description" content="Read genuine reviews from T&B Paving customers across Essex & Suffolk. 5-star rated block paving, resin driveways and patios." />
        <meta property="og:title" content="Customer Reviews | T&B Paving" />
        <meta property="og:description" content="5-star rated paving contractor. Read verified reviews from homeowners across Essex & Suffolk." />
      </Head>
      <View style={[styles.headerOuter, { paddingTop: insets.top + S.md }]}>
        <MaxWidth style={{ paddingHorizontal: hPad }}>
          <Eyebrow>Testimonials</Eyebrow>
          <Text style={[styles.title, isDesktop && { fontSize: 38 }]}>What Our Customers Say</Text>
        </MaxWidth>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: S["3xl"] }} showsVerticalScrollIndicator={false}>

        {/* Testimonials */}
        <View style={{ paddingHorizontal: hPad, paddingVertical: S.lg }}>
          <MaxWidth>
            {loadingT ? (
              <ActivityIndicator size="large" color={C.brand} style={{ marginVertical: S.xl }} />
            ) : (
              <View style={[
                (isDesktop || isTablet) ? { flexDirection: "row", flexWrap: "wrap", gap: S.md } : { gap: S.md }
              ]}>
                {displayTestimonials.map((t, i) => (
                  <View
                    key={(t as any).id || i}
                    testID={`testimonial-${i}`}
                    style={[styles.tCard, (isDesktop || isTablet) && { flex: 1, minWidth: "30%" }]}
                  >
                    <Stars n={t.stars} size={16} />
                    <Text style={styles.tText}>"{t.text}"</Text>
                    <View style={styles.tFooter}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{t.name[0]}</Text>
                      </View>
                      <View>
                        <Text style={styles.tName}>{t.name}</Text>
                        <Text style={styles.tJob}>{[t.job, t.town].filter(Boolean).join(" · ")}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Live badge when showing DB reviews */}
            {testimonials.length > 0 && (
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>{testimonials.length} verified review{testimonials.length !== 1 ? "s" : ""}</Text>
              </View>
            )}
          </MaxWidth>
        </View>

        {/* Leave a review CTA */}
        <View style={{ paddingHorizontal: hPad, paddingBottom: S.lg }}>
          <MaxWidth>
            <Pressable style={styles.reviewCta} onPress={() => router.push("/review" as any)}>
              <View style={styles.reviewCtaLeft}>
                {[1,2,3,4,5].map(n => <Ionicons key={n} name="star" size={16} color="#E0A732" />)}
                <Text style={styles.reviewCtaTitle}>Happy with our work?</Text>
                <Text style={styles.reviewCtaSub}>Share your experience — it takes less than a minute.</Text>
              </View>
              <View style={styles.reviewCtaArrow}>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </View>
            </Pressable>
          </MaxWidth>
        </View>

        {/* Review platforms */}
        <View style={{ paddingHorizontal: hPad, paddingBottom: S.lg }}>
          <MaxWidth>
            <Text style={styles.smallTitle}>READ OUR REVIEWS ON</Text>
            <View style={styles.platforms}>
              {REVIEW_PLATFORMS.map((p) => (
                <View key={p} style={styles.platform}>
                  <Ionicons name="checkmark-circle" size={14} color={C.success} />
                  <Text style={styles.platformText}>{p}</Text>
                </View>
              ))}
            </View>
          </MaxWidth>
        </View>

        {/* Coverage */}
        <View style={{ paddingHorizontal: hPad, paddingBottom: S.lg }}>
          <MaxWidth>
            <View style={styles.coverage}>
              <Eyebrow>Coverage</Eyebrow>
              <Text style={[styles.coverageTitle, isDesktop && { fontSize: 30 }]}>Areas We Cover</Text>
              <Text style={styles.coverageSub}>Proudly serving {coverageArea}, including:</Text>
              <View style={[styles.areaWrap, isDesktop && { gap: S.sm }]}>
                {areas.map((a: string) => (
                  <View key={a} style={styles.areaChip}><Text style={styles.areaText}>{a}</Text></View>
                ))}
              </View>
            </View>
          </MaxWidth>
        </View>

        {/* FAQ */}
        <View style={{ paddingHorizontal: hPad, paddingBottom: S.lg }}>
          <MaxWidth>
            <Eyebrow>FAQ</Eyebrow>
            <Text style={[styles.title, isDesktop && { fontSize: 34 }]}>Frequently Asked Questions</Text>
            <View style={[
              { marginTop: S.lg },
              isDesktop ? { flexDirection: "row", flexWrap: "wrap", gap: S.md } : { gap: S.sm }
            ]}>
              {faqs.map((f: any, i: number) => (
                <Pressable
                  key={i}
                  testID={`faq-${i}`}
                  style={[styles.faq, isDesktop && { width: "48%" }]}
                  onPress={() => setOpen(open === i ? null : i)}
                >
                  <View style={styles.faqRow}>
                    <Text style={styles.faqQ}>{f.q}</Text>
                    <Ionicons name={open === i ? "remove" : "add"} size={20} color={C.brand} />
                  </View>
                  {open === i && <Text style={styles.faqA}>{f.a}</Text>}
                </Pressable>
              ))}
            </View>
          </MaxWidth>
        </View>

        <View style={{ paddingHorizontal: hPad, paddingBottom: S.lg }}>
          <MaxWidth>
            <Btn testID="reviews-quote-btn" label="Get a Free Quote" icon="calculator" onPress={() => router.push("/(tabs)/quote")} style={{ alignSelf: isDesktop ? "flex-start" : undefined }} />
          </MaxWidth>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerOuter: { paddingBottom: S.md, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  title: { fontSize: 28, fontWeight: "900", color: C.ink, letterSpacing: -0.8, lineHeight: 32 },
  tCard: { backgroundColor: C.surface, borderRadius: R.lg, padding: S.lg, borderWidth: 1, borderColor: C.border, ...SHADOW.card },
  tText: { fontSize: 15.5, color: C.ink, lineHeight: 23, marginTop: S.sm, fontStyle: "italic" },
  tFooter: { flexDirection: "row", alignItems: "center", gap: S.sm, marginTop: S.md },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.brand, alignItems: "center", justifyContent: "center" },
  avatarText: { color: C.onBrand, fontWeight: "900", fontSize: 16 },
  tName: { fontSize: 14, fontWeight: "800", color: C.ink },
  tJob: { fontSize: 12, color: C.muted },
  liveBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginTop: S.lg, alignSelf: "flex-start",
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.success },
  liveText: { fontSize: 12, fontWeight: "700", color: C.success },
  reviewCta: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#1A2A3A", borderRadius: R.xl, padding: S.lg,
    borderWidth: 1, borderColor: "rgba(181,101,29,0.4)",
  },
  reviewCtaLeft: { flex: 1, gap: 4 },
  reviewCtaTitle: { fontSize: 17, fontWeight: "800", color: "#FFFFFF", marginTop: 2 },
  reviewCtaSub: { fontSize: 13, color: "rgba(255,255,255,0.65)" },
  reviewCtaArrow: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#B5651D", alignItems: "center", justifyContent: "center", marginLeft: S.md,
  },
  smallTitle: { fontSize: 12, fontWeight: "800", letterSpacing: 1.5, color: C.muted, textAlign: "center", marginBottom: S.md },
  platforms: { flexDirection: "row", flexWrap: "wrap", gap: S.sm, justifyContent: "center" },
  platform: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, paddingHorizontal: S.md, paddingVertical: 8, borderRadius: R.pill },
  platformText: { fontSize: 13, fontWeight: "700", color: C.ink },
  coverage: { backgroundColor: C.accentSoft, borderRadius: R.xl, padding: S.xl },
  coverageTitle: { fontSize: 24, fontWeight: "900", color: C.ink, letterSpacing: -0.5 },
  coverageSub: { fontSize: 13.5, color: C.inkSoft, marginTop: 2 },
  areaWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: S.sm },
  areaChip: { backgroundColor: C.surface, paddingHorizontal: S.md, paddingVertical: 7, borderRadius: R.pill },
  areaText: { fontSize: 12.5, fontWeight: "600", color: C.ink },
  faq: { backgroundColor: C.surface, borderRadius: R.md, padding: S.md, borderWidth: 1, borderColor: C.border },
  faqRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: S.sm },
  faqQ: { flex: 1, fontSize: 14.5, fontWeight: "700", color: C.ink },
  faqA: { fontSize: 13.5, color: C.muted, lineHeight: 20, marginTop: S.sm },
});
