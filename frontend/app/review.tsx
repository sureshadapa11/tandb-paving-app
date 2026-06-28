import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Image, useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const BACKEND = process.env.EXPO_PUBLIC_BACKEND_URL ?? "";

const C = {
  bg: "#F7F4F0", card: "#FFFFFF", navy: "#1A2A3A",
  copper: "#B5651D", ink: "#1A2A3A", muted: "#7A6A5A",
  border: "#E8E0D4", gold: "#E0A732", error: "#DC2626",
  success: "#2D7A4F",
};

const SERVICES = [
  "Block Paving", "Resin Driveway", "Tarmac", "Patio",
  "Gravel", "Garden Steps", "Kerbing", "Other",
];

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => onChange(n)} activeOpacity={0.7} style={styles.starBtn}>
          <Ionicons name={n <= value ? "star" : "star-outline"} size={36} color={C.gold} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function ReviewPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const maxW = Math.min(width, 540);

  const [name, setName] = useState("");
  const [town, setTown] = useState("");
  const [job, setJob] = useState("");
  const [stars, setStars] = useState(5);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!text.trim()) { setError("Please write a short review."); return; }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${BACKEND}/api/reviews/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), town: town.trim(), job: job.trim(), stars, text: text.trim() }),
      });
      if (!res.ok) throw new Error("Server error");
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <View style={styles.root}>
        <View style={[styles.card, { maxWidth: maxW, alignSelf: "center", width: "100%" }]}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={64} color={C.success} />
          </View>
          <Text style={styles.successTitle}>Thank You, {name.split(" ")[0]}!</Text>
          <Text style={styles.successSub}>
            Your review has been submitted and will appear on our website once approved. We really appreciate your feedback!
          </Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.replace("/(tabs)" as any)} activeOpacity={0.8}>
            <Text style={styles.backBtnText}>Back to T&B Paving</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      <View style={[styles.card, { maxWidth: maxW, alignSelf: "center", width: "100%" }]}>
        {/* Header */}
        <View style={styles.header}>
          <Image source={require("../assets/images/logo.jpg")} style={styles.logo} />
          <Text style={styles.brandName}>T&B Paving</Text>
          <Text style={styles.brandSub}>Leave Us a Review</Text>
        </View>

        <Text style={styles.intro}>
          We'd love to hear about your experience. Your review helps other customers and supports our small business — thank you!
        </Text>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color={C.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Stars */}
        <Text style={styles.label}>Your Rating *</Text>
        <StarPicker value={stars} onChange={setStars} />
        <Text style={styles.starHint}>{["", "Poor", "Fair", "Good", "Very Good", "Excellent"][stars]}</Text>

        {/* Name */}
        <Text style={styles.label}>Your Name *</Text>
        <TextInput
          style={styles.input} value={name} onChangeText={setName}
          placeholder="e.g. John Smith" placeholderTextColor={C.muted}
        />

        {/* Town */}
        <Text style={styles.label}>Town / Area</Text>
        <TextInput
          style={styles.input} value={town} onChangeText={setTown}
          placeholder="e.g. Chelmsford" placeholderTextColor={C.muted}
        />

        {/* Service */}
        <Text style={styles.label}>Service Received</Text>
        <View style={styles.serviceGrid}>
          {SERVICES.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.serviceChip, job === s && styles.serviceChipActive]}
              onPress={() => setJob(job === s ? "" : s)}
              activeOpacity={0.7}
            >
              <Text style={[styles.serviceChipText, job === s && styles.serviceChipTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Review text */}
        <Text style={styles.label}>Your Review *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={text} onChangeText={setText}
          placeholder="Tell us about your experience with T&B Paving..."
          placeholderTextColor={C.muted}
          multiline numberOfLines={5}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.btnDisabled]}
          onPress={submit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="send-outline" size={18} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>Submit Review</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.footer}>
          Your review will be visible on our website after a quick check. Thank you for supporting T&B Paving!
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 20, paddingBottom: 60 },
  card: {
    backgroundColor: C.card, borderRadius: 20, padding: 28,
    borderWidth: 1, borderColor: C.border,
    shadowColor: "#3A2A1A", shadowOpacity: 0.08, shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 }, elevation: 4,
  },
  header: { alignItems: "center", marginBottom: 20 },
  logo: { width: 72, height: 72, borderRadius: 36, marginBottom: 10 },
  brandName: { fontSize: 22, fontWeight: "800", color: C.navy, letterSpacing: 0.3 },
  brandSub: { fontSize: 14, color: C.copper, fontWeight: "600", marginTop: 2 },
  intro: {
    fontSize: 14, color: C.muted, lineHeight: 21, textAlign: "center",
    marginBottom: 24, paddingHorizontal: 4,
  },
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FEF2F2", borderRadius: 8, padding: 12,
    borderWidth: 1, borderColor: "#FECACA", marginBottom: 16,
  },
  errorText: { flex: 1, fontSize: 13, color: C.error },
  label: { fontSize: 13, fontWeight: "700", color: C.ink, marginBottom: 8, marginTop: 16 },
  starRow: { flexDirection: "row", gap: 4, marginBottom: 4 },
  starBtn: { padding: 4 },
  starHint: { fontSize: 13, color: C.copper, fontWeight: "600", marginBottom: 4 },
  input: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 10,
    paddingVertical: 12, paddingHorizontal: 14, fontSize: 15,
    color: C.ink, backgroundColor: "#FAFAF8",
    outlineStyle: "none" as any,
  },
  textArea: { minHeight: 110, paddingTop: 12 },
  serviceGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  serviceChip: {
    paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: "#FAFAF8",
  },
  serviceChipActive: { backgroundColor: C.copper, borderColor: C.copper },
  serviceChipText: { fontSize: 13, color: C.muted, fontWeight: "500" },
  serviceChipTextActive: { color: "#FFFFFF", fontWeight: "700" },
  submitBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: C.copper, borderRadius: 12, paddingVertical: 16,
    marginTop: 24,
  },
  submitBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  btnDisabled: { opacity: 0.6 },
  footer: {
    fontSize: 12, color: C.muted, textAlign: "center",
    marginTop: 16, lineHeight: 18,
  },
  successIcon: { alignItems: "center", marginBottom: 16, marginTop: 8 },
  successTitle: { fontSize: 26, fontWeight: "800", color: C.navy, textAlign: "center", marginBottom: 12 },
  successSub: { fontSize: 15, color: C.muted, textAlign: "center", lineHeight: 22, marginBottom: 28 },
  backBtn: {
    backgroundColor: C.copper, borderRadius: 12, paddingVertical: 14,
    alignItems: "center",
  },
  backBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
});
