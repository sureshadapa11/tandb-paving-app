import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable, Linking, KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Head } from "expo-router/head";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { api } from "@/src/api";
import { C, S, R, SHADOW } from "@/src/theme";
import { Eyebrow, Btn, Field, MaxWidth } from "@/src/components/ui";
import { BIZ, SERVICES } from "@/src/brand";
import { useResponsive } from "@/src/hooks/use-responsive";

const SERVICE_NAMES = SERVICES.map((s) => s.title);

export default function Quote() {
  const insets = useSafeAreaInsets();
  const { isDesktop, hPad } = useResponsive();

  const [form, setForm] = useState({ name: "", phone: "", email: "", service: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  const [estService, setEstService] = useState(SERVICE_NAMES[0]);
  const [area, setArea] = useState("");
  const [material, setMaterial] = useState("");
  const [estLoading, setEstLoading] = useState(false);
  const [estimate, setEstimate] = useState("");

  const call = (num: string) => Linking.openURL(`tel:${num.replace(/\s/g, "")}`);
  const mail = () => Linking.openURL(`mailto:${BIZ.email}`);

  const submit = async () => {
    setErr("");
    if (!form.name || (!form.phone && !form.email)) {
      setErr("Please add your name and a phone or email so we can reach you.");
      return;
    }
    setSending(true);
    try {
      await api.post("/enquiries", form);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setSent(true);
    } catch {
      setErr("Something went wrong. Please call us instead.");
    } finally {
      setSending(false);
    }
  };

  const runEstimate = async () => {
    setEstLoading(true); setEstimate("");
    try {
      const res = await api.post("/ai/paving-estimate", { service: estService, area, material });
      setEstimate(res.estimate);
    } catch {
      setEstimate("Sorry, the estimator is busy right now. Please send an enquiry below and we'll get back to you fast.");
    } finally {
      setEstLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Head>
        <title>Get a Free Quote | T&B Paving — Essex & Suffolk</title>
        <meta name="description" content="Request a free, no-obligation quote from T&B Paving. Driveways, patios, paths and more across Essex & Suffolk. Fast response, honest pricing." />
        <meta property="og:title" content="Get a Free Quote | T&B Paving" />
        <meta property="og:description" content="Free no-obligation quote for driveways, patios and paths across Essex & Suffolk." />
      </Head>
      <View style={[styles.headerOuter, { paddingTop: insets.top + S.md }]}>
        <MaxWidth style={{ paddingHorizontal: hPad }}>
          <Eyebrow>Get In Touch</Eyebrow>
          <Text style={[styles.title, isDesktop && { fontSize: 36 }]}>Request a Free Quote</Text>
        </MaxWidth>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: hPad, paddingBottom: S["3xl"], paddingTop: S.lg }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <MaxWidth>
            {/* Contact quick actions */}
            <View style={[styles.contactRow, isDesktop && { gap: S.lg }]}>
              <Pressable testID="quote-call" style={styles.contactBtn} onPress={() => call(BIZ.phone)}>
                <Ionicons name="call" size={20} color={C.brand} />
                <Text style={styles.contactLabel}>Call</Text>
                <Text style={styles.contactVal}>{BIZ.phone}</Text>
              </Pressable>
              <Pressable testID="quote-mobile" style={styles.contactBtn} onPress={() => call(BIZ.mobile)}>
                <Ionicons name="phone-portrait" size={20} color={C.brand} />
                <Text style={styles.contactLabel}>Mobile</Text>
                <Text style={styles.contactVal}>{BIZ.mobile}</Text>
              </Pressable>
              {isDesktop && (
                <Pressable testID="quote-email-desktop" style={styles.contactBtn} onPress={mail}>
                  <Ionicons name="mail" size={20} color={C.brand} />
                  <Text style={styles.contactLabel}>Email</Text>
                  <Text style={styles.contactVal}>{BIZ.email}</Text>
                </Pressable>
              )}
            </View>

            {!isDesktop && (
              <>
                <Pressable testID="quote-email" style={[styles.emailBtn, { marginTop: S.md }]} onPress={mail}>
                  <Ionicons name="mail" size={18} color={C.ink} />
                  <Text style={styles.emailText}>{BIZ.email}</Text>
                </Pressable>
              </>
            )}

            <View style={styles.hoursRow}>
              <Ionicons name="time" size={15} color={C.muted} />
              <Text style={styles.hoursText}>{BIZ.hours}  ·  Free site survey</Text>
            </View>

            {/* Desktop: 2-col layout for AI + Form */}
            <View style={[isDesktop && styles.twoCol, { marginTop: S.lg }]}>

              {/* AI Instant Estimate */}
              <View style={[styles.aiCard, isDesktop && { flex: 1 }]}>
                <View style={styles.aiHead}>
                  <Ionicons name="sparkles" size={18} color={C.brand} />
                  <Text style={styles.aiTitle}>Instant AI Estimate</Text>
                </View>
                <Text style={styles.aiSub}>Get a ballpark price in seconds. Final price confirmed at your free survey.</Text>

                <Text style={styles.pickLabel}>SERVICE</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: S.xs, paddingVertical: 4 }}>
                  {SERVICE_NAMES.map((s) => (
                    <Pressable key={s} testID={`est-service-${s}`} onPress={() => setEstService(s)}
                      style={[styles.chip, estService === s && styles.chipActive]}>
                      <Text style={[styles.chipText, estService === s && styles.chipTextActive]}>{s}</Text>
                    </Pressable>
                  ))}
                </View>

                <View style={{ flexDirection: "row", gap: S.sm, marginTop: S.md }}>
                  <Field testID="est-area" value={area} onChangeText={setArea} placeholder="Area e.g. 40 sqm" style={{ flex: 1, marginBottom: 0 }} />
                  <Field testID="est-material" value={material} onChangeText={setMaterial} placeholder="Material (optional)" style={{ flex: 1, marginBottom: 0 }} />
                </View>
                <Btn testID="est-run" label="Get Instant Estimate" icon="flash" onPress={runEstimate} loading={estLoading} style={{ marginTop: S.md }} />
                {estLoading && (
                  <View style={styles.estLoading}><ActivityIndicator color={C.brand} /><Text style={styles.estLoadingText}>Calculating…</Text></View>
                )}
                {!!estimate && (
                  <View testID="est-result" style={styles.estResult}>
                    <Text style={styles.estResultText}>{estimate}</Text>
                  </View>
                )}
              </View>

              {/* Enquiry form */}
              <View style={[isDesktop && { flex: 1 }]}>
                {sent ? (
                  <View testID="enquiry-success" style={styles.successCard}>
                    <Ionicons name="checkmark-circle" size={48} color={C.success} />
                    <Text style={styles.successTitle}>Thanks, {form.name.split(" ")[0]}!</Text>
                    <Text style={styles.successText}>Your enquiry has been received. We'll be in touch very soon to arrange your free site survey.</Text>
                    <Btn testID="enquiry-call-now" label={`Call now: ${BIZ.mobile}`} icon="call" variant="dark" onPress={() => call(BIZ.mobile)} style={{ marginTop: S.md }} />
                  </View>
                ) : (
                  <View style={styles.formCard}>
                    <Text style={styles.formTitle}>Send Us a Message</Text>
                    <Field label="Your Name" testID="enq-name" value={form.name} onChangeText={(t: string) => setForm({ ...form, name: t })} placeholder="John Smith" />
                    <Field label="Phone Number" testID="enq-phone" value={form.phone} onChangeText={(t: string) => setForm({ ...form, phone: t })} keyboardType="phone-pad" placeholder="07..." />
                    <Field label="Email Address" testID="enq-email" value={form.email} onChangeText={(t: string) => setForm({ ...form, email: t })} autoCapitalize="none" keyboardType="email-address" placeholder="you@email.com" />
                    <Text style={styles.pickLabel}>SERVICE REQUIRED</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: S.xs, paddingVertical: 4, marginBottom: S.md }}>
                      {SERVICE_NAMES.map((s) => (
                        <Pressable key={s} testID={`enq-service-${s}`} onPress={() => setForm({ ...form, service: s })}
                          style={[styles.chip, form.service === s && styles.chipActive]}>
                          <Text style={[styles.chipText, form.service === s && styles.chipTextActive]}>{s}</Text>
                        </Pressable>
                      ))}
                    </View>
                    <Field label="Message" testID="enq-message" value={form.message} onChangeText={(t: string) => setForm({ ...form, message: t })} placeholder="Tell us about your project…" multiline numberOfLines={4} style={{ marginBottom: S.sm }} />
                    {!!err && <Text testID="enq-error" style={styles.err}>{err}</Text>}
                    <Btn testID="enq-submit" label="Send Enquiry — It's Free" icon="send" onPress={submit} loading={sending} style={{ marginTop: S.sm }} />
                  </View>
                )}
              </View>
            </View>
          </MaxWidth>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerOuter: { paddingBottom: S.md, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  title: { fontSize: 28, fontWeight: "900", color: C.ink, letterSpacing: -0.8 },
  twoCol: { flexDirection: "row", gap: S.xl, alignItems: "flex-start" },
  contactRow: { flexDirection: "row", gap: S.md },
  contactBtn: { flex: 1, backgroundColor: C.surface, borderRadius: R.lg, padding: S.md, alignItems: "center", borderWidth: 1, borderColor: C.border, ...SHADOW.card },
  contactLabel: { fontSize: 11, fontWeight: "700", color: C.muted, marginTop: 6 },
  contactVal: { fontSize: 13, fontWeight: "800", color: C.ink, marginTop: 2, textAlign: "center" },
  emailBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: C.surfaceAlt, borderRadius: R.md, padding: S.md },
  emailText: { fontSize: 14, fontWeight: "700", color: C.ink },
  hoursRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: S.md },
  hoursText: { fontSize: 13, color: C.muted, fontWeight: "600" },
  aiCard: { backgroundColor: C.surface, borderRadius: R.xl, padding: S.lg, borderWidth: 1, borderColor: C.border, ...SHADOW.card, marginBottom: S.lg },
  aiHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  aiTitle: { fontSize: 18, fontWeight: "900", color: C.ink },
  aiSub: { fontSize: 13, color: C.muted, marginTop: 4, lineHeight: 19 },
  pickLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 1, color: C.inkSoft, marginTop: S.md, marginBottom: 4 },
  chip: { paddingHorizontal: S.sm, paddingVertical: 8, borderRadius: R.pill, backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border },
  chipActive: { backgroundColor: C.brand, borderColor: C.brand },
  chipText: { fontSize: 12, fontWeight: "700", color: C.inkSoft },
  chipTextActive: { color: C.onBrand },
  estLoading: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: S.md },
  estLoadingText: { color: C.muted, fontWeight: "600" },
  estResult: { marginTop: S.md, backgroundColor: C.accentSoft, borderRadius: R.md, padding: S.md },
  estResultText: { fontSize: 14, color: C.ink, lineHeight: 22 },
  formCard: { backgroundColor: C.surface, borderRadius: R.xl, padding: S.lg, borderWidth: 1, borderColor: C.border, ...SHADOW.card },
  formTitle: { fontSize: 18, fontWeight: "900", color: C.ink, marginBottom: S.md },
  err: { color: C.error, fontWeight: "700", fontSize: 13, marginTop: 4 },
  successCard: { backgroundColor: C.surface, borderRadius: R.xl, padding: S.xl, alignItems: "center", borderWidth: 1, borderColor: C.border, ...SHADOW.card },
  successTitle: { fontSize: 22, fontWeight: "900", color: C.ink, marginTop: S.md },
  successText: { fontSize: 14, color: C.muted, textAlign: "center", marginTop: S.sm, lineHeight: 21 },
});
