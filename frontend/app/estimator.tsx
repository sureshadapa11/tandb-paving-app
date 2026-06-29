import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Platform, Linking,
} from "react-native";
import { useRouter } from "expo-router";
import Head from "expo-router/head";
import { Ionicons } from "@expo/vector-icons";
import { C, S, R, SHADOW } from "@/src/theme";
import { MaxWidth, Btn } from "@/src/components/ui";
import { useResponsive } from "@/src/hooks/use-responsive";

const BACKEND = process.env.EXPO_PUBLIC_BACKEND_URL ?? "";

const SERVICES = [
  { id: "block-paving", label: "Block Paving", icon: "grid-outline" },
  { id: "resin", label: "Resin Bound", icon: "color-fill-outline" },
  { id: "tarmac", label: "Tarmac", icon: "car-outline" },
  { id: "patios", label: "Patios & Paving", icon: "leaf-outline" },
  { id: "gravel", label: "Gravel & Shingle", icon: "ellipse-outline" },
  { id: "concrete", label: "Concrete", icon: "layers-outline" },
  { id: "paths", label: "Garden Paths", icon: "walk-outline" },
  { id: "cleaning", label: "Cleaning & Sealing", icon: "water-outline" },
  { id: "other", label: "Other", icon: "build-outline" },
];

const MATERIALS: Record<string, string[]> = {
  "block-paving": ["Brett Paving", "Marshalls", "Tobermore", "No preference"],
  "resin": ["Natural Aggregate", "Coloured Aggregate", "No preference"],
  "tarmac": ["Standard Tarmac", "Coloured Tarmac", "No preference"],
  "patios": ["Indian Sandstone", "Porcelain", "Block Paving", "No preference"],
  "gravel": ["Pea Gravel", "Slate Chips", "Cotswold Stone", "No preference"],
  "concrete": ["Standard", "Exposed Aggregate", "No preference"],
  "paths": ["Natural Stone", "Brick", "Porcelain", "No preference"],
  "cleaning": ["Pressure Wash & Seal", "Deep Clean Only", "No preference"],
  "other": ["No preference"],
};

type Result = { estimate: string } | null;

export default function Estimator() {
  const router = useRouter();
  const { isDesktop, hPad } = useResponsive();

  const [service, setService] = useState("");
  const [area, setArea] = useState("");
  const [material, setMaterial] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result>(null);
  const [error, setError] = useState("");

  const materials = service ? MATERIALS[service] ?? ["No preference"] : [];

  const canSubmit = !!service && !loading;

  const handleEstimate = async () => {
    setLoading(true);
    setResult(null);
    setError("");
    try {
      const res = await fetch(`${BACKEND}/api/ai/paving-estimate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service, area, material, notes }),
      });
      if (!res.ok) throw new Error("Service error");
      const data = await res.json();
      setResult(data);
    } catch {
      setError("Could not generate estimate. Please try again or call us directly.");
    }
    setLoading(false);
  };

  const reset = () => {
    setService(""); setArea(""); setMaterial(""); setNotes(""); setResult(null); setError("");
  };

  return (
    <>
      <Head>
        <title>Free AI Cost Estimator — T&B Paving</title>
        <meta name="description" content="Get an instant ballpark estimate for your driveway, patio or paving project in Essex & Suffolk." />
      </Head>

      <View style={styles.root}>
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: hPad }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={C.ink} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>AI Cost Estimator</Text>
            <Text style={styles.headerSub}>Instant ballpark • No personal details needed</Text>
          </View>
          <View style={styles.aiBadge}>
            <Ionicons name="sparkles" size={13} color={C.brand} />
            <Text style={styles.aiBadgeText}>AI</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={[styles.scroll, { paddingHorizontal: hPad }]}>
          <MaxWidth>
            {!result ? (
              <View style={[styles.form, isDesktop && styles.formDesktop]}>
                {/* Step 1 — Service */}
                <View style={styles.formSection}>
                  <Text style={styles.stepLabel}>1. What type of project?</Text>
                  <View style={styles.serviceGrid}>
                    {SERVICES.map((s) => (
                      <TouchableOpacity
                        key={s.id}
                        style={[styles.serviceChip, service === s.id && styles.serviceChipActive]}
                        onPress={() => { setService(s.id); setMaterial(""); }}
                        activeOpacity={0.75}
                      >
                        <Ionicons name={s.icon as any} size={20} color={service === s.id ? C.onBrand : C.inkSoft} />
                        <Text style={[styles.serviceLabel, service === s.id && styles.serviceLabelActive]}>{s.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Step 2 — Area */}
                <View style={styles.formSection}>
                  <Text style={styles.stepLabel}>2. Approximate area (optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={area}
                    onChangeText={setArea}
                    placeholder="e.g. 40 square metres, 20m x 5m, standard driveway"
                    placeholderTextColor={C.muted}
                  />
                </View>

                {/* Step 3 — Material */}
                {service && materials.length > 1 && (
                  <View style={styles.formSection}>
                    <Text style={styles.stepLabel}>3. Preferred material (optional)</Text>
                    <View style={styles.materialRow}>
                      {materials.map((m) => (
                        <TouchableOpacity
                          key={m}
                          style={[styles.materialChip, material === m && styles.materialChipActive]}
                          onPress={() => setMaterial(m === material ? "" : m)}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.materialLabel, material === m && styles.materialLabelActive]}>{m}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Step 4 — Notes */}
                <View style={styles.formSection}>
                  <Text style={styles.stepLabel}>{service && materials.length > 1 ? "4." : "3."} Extra details (optional)</Text>
                  <TextInput
                    style={[styles.input, styles.inputMulti]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="e.g. existing driveway to remove, edging required, access is tight, slope involved..."
                    placeholderTextColor={C.muted}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                {error ? (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle-outline" size={16} color={C.error} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <Btn
                  label={loading ? "Generating estimate…" : "Get My Free Estimate"}
                  icon={loading ? undefined : "sparkles"}
                  onPress={handleEstimate}
                  disabled={!canSubmit}
                  loading={loading}
                  style={{ marginTop: S.lg }}
                />

                <Text style={styles.disclaimer}>
                  Estimates are AI-generated ballparks only. Book a free site survey for an exact quote.
                </Text>
              </View>
            ) : (
              <View style={styles.resultWrap}>
                <View style={styles.resultCard}>
                  <View style={styles.resultHeader}>
                    <Ionicons name="sparkles" size={22} color={C.brand} />
                    <Text style={styles.resultTitle}>Your Estimate</Text>
                  </View>
                  <Text style={styles.resultText}>{result?.estimate}</Text>
                  <View style={styles.resultDivider} />
                  <Text style={styles.resultNote}>
                    This is a guide only. Actual costs depend on site conditions, access, and materials.
                  </Text>
                </View>

                <View style={[styles.ctaRow, isDesktop && { flexDirection: "row", gap: S.lg }]}>
                  <Btn
                    label="Book Free Site Survey"
                    icon="calendar-outline"
                    onPress={() => router.push("/(tabs)/quote" as any)}
                    style={{ flex: isDesktop ? 1 : undefined }}
                  />
                  <Btn
                    label="New Estimate"
                    icon="refresh-outline"
                    variant="outline"
                    onPress={reset}
                    style={{ flex: isDesktop ? 1 : undefined, marginTop: isDesktop ? 0 : S.md }}
                  />
                </View>

                <TouchableOpacity style={styles.callRow} onPress={() => Linking.openURL("tel:01376618683")}>
                  <Ionicons name="call-outline" size={16} color={C.brand} />
                  <Text style={styles.callText}>Or call us: <Text style={{ fontWeight: "800" }}>01376 618683</Text></Text>
                </TouchableOpacity>
              </View>
            )}
          </MaxWidth>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: "row", alignItems: "center", gap: S.md,
    paddingVertical: S.lg, backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: { padding: S.xs },
  headerTitle: { fontSize: 18, fontWeight: "800", color: C.ink },
  headerSub: { fontSize: 12, color: C.muted, marginTop: 2 },
  aiBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: C.accentSoft, borderRadius: R.pill,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  aiBadgeText: { fontSize: 12, fontWeight: "800", color: C.brand },
  scroll: { paddingVertical: S["2xl"], paddingBottom: 60 },
  form: { gap: S.xl },
  formDesktop: { maxWidth: 640, alignSelf: "center", width: "100%" },
  formSection: { gap: S.sm },
  stepLabel: { fontSize: 14, fontWeight: "700", color: C.ink },
  serviceGrid: { flexDirection: "row", flexWrap: "wrap", gap: S.sm },
  serviceChip: {
    flexDirection: "row", alignItems: "center", gap: S.xs,
    borderWidth: 1.5, borderColor: C.border, borderRadius: R.lg,
    paddingVertical: S.sm, paddingHorizontal: S.md,
    backgroundColor: C.surface,
  },
  serviceChipActive: { backgroundColor: C.brandDark, borderColor: C.brandDark },
  serviceLabel: { fontSize: 13, fontWeight: "600", color: C.inkSoft },
  serviceLabelActive: { color: C.onBrand },
  input: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: R.md,
    paddingVertical: 12, paddingHorizontal: S.md,
    fontSize: 14, color: C.ink, backgroundColor: C.surface,
    outlineStyle: "none" as any,
  },
  inputMulti: { minHeight: 80, textAlignVertical: "top" },
  materialRow: { flexDirection: "row", flexWrap: "wrap", gap: S.sm },
  materialChip: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: R.pill,
    paddingVertical: S.xs, paddingHorizontal: S.md,
    backgroundColor: C.surface,
  },
  materialChipActive: { backgroundColor: C.accentSoft, borderColor: C.accent },
  materialLabel: { fontSize: 13, color: C.inkSoft, fontWeight: "600" },
  materialLabelActive: { color: C.brandDark },
  errorBox: {
    flexDirection: "row", gap: S.xs, alignItems: "center",
    backgroundColor: "#FEF2F2", borderRadius: R.md, padding: S.md,
    borderWidth: 1, borderColor: "#FECACA",
  },
  errorText: { fontSize: 13, color: C.error, flex: 1 },
  disclaimer: { fontSize: 11, color: C.muted, textAlign: "center", marginTop: S.md, lineHeight: 16 },
  resultWrap: { gap: S.xl },
  resultCard: {
    backgroundColor: C.surface, borderRadius: R.xl, padding: S["2xl"],
    borderWidth: 1, borderColor: C.border, ...SHADOW.card,
  },
  resultHeader: { flexDirection: "row", alignItems: "center", gap: S.sm, marginBottom: S.lg },
  resultTitle: { fontSize: 20, fontWeight: "800", color: C.ink },
  resultText: { fontSize: 15, color: C.ink, lineHeight: 24 },
  resultDivider: { height: 1, backgroundColor: C.border, marginVertical: S.lg },
  resultNote: { fontSize: 12, color: C.muted, lineHeight: 18 },
  ctaRow: { gap: S.md },
  callRow: {
    flexDirection: "row", alignItems: "center", gap: S.sm,
    justifyContent: "center", paddingVertical: S.md,
  },
  callText: { fontSize: 14, color: C.inkSoft },
});
