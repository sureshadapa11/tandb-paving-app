import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert, useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/context/AuthContext";
import { TESTIMONIALS } from "@/src/brand";
import AdminSidebar from "@/src/components/AdminSidebar";

const P = {
  bg: "#F7F4F0", card: "#FFFFFF", navy: "#1A2A3A", copper: "#B5651D",
  ink: "#1A2A3A", muted: "#7A6A5A", border: "#E8E0D4",
  error: "#DC2626", gold: "#E0A732", success: "#2D7A4F",
};

type Testimonial = {
  id: string;
  name: string;
  town: string;
  job: string;
  stars: number;
  text: string;
};

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => onChange(n)} activeOpacity={0.7} style={{ padding: 4 }}>
          <Ionicons name={n <= value ? "star" : "star-outline"} size={24} color={P.gold} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

function StarDisplay({ stars }: { stars: number }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons key={n} name={n <= stars ? "star" : "star-outline"} size={14} color={P.gold} />
      ))}
    </View>
  );
}

export default function Testimonials() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Load initial data from brand.ts
  const [items, setItems] = useState<Testimonial[]>(
    TESTIMONIALS.map((t, i) => ({ ...t, id: `brand-${i}` }))
  );

  // Form state
  const [name, setName] = useState("");
  const [town, setTown] = useState("");
  const [job, setJob] = useState("");
  const [stars, setStars] = useState(5);
  const [text, setText] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/admin");
  }, [user, loading]);

  const addTestimonial = () => {
    if (!name.trim() || !text.trim()) {
      setFormError("Name and review text are required.");
      return;
    }
    setFormError("");
    const newItem: Testimonial = {
      id: `local-${Date.now()}`,
      name: name.trim(),
      town: town.trim(),
      job: job.trim(),
      stars,
      text: text.trim(),
    };
    setItems((prev) => [newItem, ...prev]);
    setName(""); setTown(""); setJob(""); setStars(5); setText("");
  };

  const deleteItem = (id: string) => {
    Alert.alert("Delete Testimonial", "Remove this testimonial from the local list?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: () => setItems((prev) => prev.filter((t) => t.id !== id)),
      },
    ]);
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={P.copper} /></View>;
  }

  const Form = (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>Add New Testimonial</Text>

      {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

      <View style={isDesktop ? styles.rowTwo : undefined}>
        <View style={[styles.field, isDesktop && { flex: 1 }]}>
          <Text style={styles.fieldLabel}>Customer Name *</Text>
          <TextInput
            style={styles.input} value={name} onChangeText={setName}
            placeholder="e.g. Sarah K." placeholderTextColor={P.muted}
          />
        </View>
        <View style={[styles.field, isDesktop && { flex: 1 }]}>
          <Text style={styles.fieldLabel}>Town</Text>
          <TextInput
            style={styles.input} value={town} onChangeText={setTown}
            placeholder="e.g. Chelmsford" placeholderTextColor={P.muted}
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Job / Service</Text>
        <TextInput
          style={styles.input} value={job} onChangeText={setJob}
          placeholder="e.g. Block Paving Driveway" placeholderTextColor={P.muted}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Star Rating</Text>
        <StarPicker value={stars} onChange={setStars} />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Review Text *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={text} onChangeText={setText}
          placeholder="Customer's review..."
          placeholderTextColor={P.muted}
          multiline numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity style={styles.addBtn} onPress={addTestimonial} activeOpacity={0.8}>
        <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
        <Text style={styles.addBtnText}>Add Testimonial</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.root}>
      <AdminSidebar activeRoute="/admin/testimonials" />

      <View style={styles.main}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Text style={styles.pageTitle}>Testimonials</Text>
          <View style={styles.topRight}>
            <Text style={styles.userName}>{user?.name}</Text>
            <TouchableOpacity onPress={async () => { await logout(); router.replace("/admin"); }} style={styles.iconBtn}>
              <Ionicons name="log-out-outline" size={20} color={P.muted} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Note banner */}
          <View style={styles.noteBanner}>
            <Ionicons name="information-circle-outline" size={18} color={P.copper} />
            <Text style={styles.noteText}>
              Changes here are local only — ask your developer to save them permanently to brand.ts.
            </Text>
          </View>

          {/* Form */}
          {Form}

          {/* List */}
          <Text style={styles.sectionTitle}>Testimonials ({items.length})</Text>

          {items.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No testimonials yet.</Text>
            </View>
          ) : (
            <View style={isDesktop ? styles.cardGrid : undefined}>
              {items.map((t) => (
                <View key={t.id} style={[styles.testimonialCard, isDesktop && styles.testimonialCardDesktop]}>
                  <View style={styles.testimonialHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.testimonialName}>{t.name}</Text>
                      {(t.town || t.job) ? (
                        <Text style={styles.testimonialMeta}>
                          {[t.job, t.town].filter(Boolean).join(" · ")}
                        </Text>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => deleteItem(t.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={18} color={P.error} />
                    </TouchableOpacity>
                  </View>
                  <StarDisplay stars={t.stars} />
                  <Text style={styles.testimonialText}>"{t.text}"</Text>
                  {t.id.startsWith("brand-") && (
                    <View style={styles.sourceBadge}>
                      <Text style={styles.sourceBadgeText}>From website</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: "row", backgroundColor: "#F7F4F0" },
  main: { flex: 1, flexDirection: "column" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F7F4F0" },
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 24, paddingVertical: 16, backgroundColor: "#FFFFFF",
    borderBottomWidth: 1, borderBottomColor: P.border,
  },
  pageTitle: { fontSize: 20, fontWeight: "700", color: P.navy },
  topRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  userName: { fontSize: 14, color: P.muted, fontWeight: "500" },
  iconBtn: { padding: 8 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  noteBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#FEF3C7", borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: "#FDE68A", marginBottom: 20,
  },
  noteText: { flex: 1, fontSize: 13, color: "#92400E", lineHeight: 18 },
  formCard: {
    backgroundColor: "#FFFFFF", borderRadius: 14, padding: 20,
    borderWidth: 1, borderColor: P.border, marginBottom: 24,
  },
  formTitle: { fontSize: 16, fontWeight: "700", color: P.ink, marginBottom: 14 },
  errorText: {
    color: P.error, backgroundColor: "#FEF2F2", borderRadius: 8,
    padding: 10, fontSize: 13, marginBottom: 12,
    borderWidth: 1, borderColor: "#FECACA",
  },
  rowTwo: { flexDirection: "row", gap: 12 },
  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: P.ink, marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: P.border, borderRadius: 8,
    paddingVertical: 10, paddingHorizontal: 12, fontSize: 14,
    color: P.ink, backgroundColor: "#FAFAF8",
    outlineStyle: "none" as any,
  },
  textArea: { minHeight: 90, paddingTop: 10 },
  starRow: { flexDirection: "row", gap: 4 },
  addBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: P.copper, borderRadius: 10, paddingVertical: 12,
    justifyContent: "center", marginTop: 4,
  },
  addBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: P.ink, marginBottom: 14 },
  emptyCard: {
    backgroundColor: "#FFFFFF", borderRadius: 12, padding: 32,
    alignItems: "center", borderWidth: 1, borderColor: P.border,
  },
  emptyText: { color: P.muted, fontSize: 14 },
  cardGrid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  testimonialCard: {
    backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: P.border,
    shadowColor: "#3A2A1A", shadowOpacity: 0.04, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  testimonialCardDesktop: { width: "31%" as any, marginBottom: 0 },
  testimonialHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
  testimonialName: { fontSize: 15, fontWeight: "700", color: P.ink },
  testimonialMeta: { fontSize: 12, color: P.muted, marginTop: 2 },
  deleteBtn: { padding: 4 },
  testimonialText: {
    fontSize: 13, color: "#4A443D", lineHeight: 20, marginTop: 8,
    fontStyle: "italic",
  },
  sourceBadge: {
    marginTop: 10, alignSelf: "flex-start",
    backgroundColor: "#F3F4F6", borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  sourceBadgeText: { fontSize: 10, color: P.muted, fontWeight: "600" },
});
