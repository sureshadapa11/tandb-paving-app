import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert, useWindowDimensions, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/context/AuthContext";
import { api } from "@/src/api";
import AdminSidebar from "@/src/components/AdminSidebar";
import { Image } from "react-native";
import { P } from "@/src/adminTheme";

const REVIEW_URL = typeof window !== "undefined"
  ? `${window.location.origin}/review`
  : "https://dist-weld-eight-62.vercel.app/review";

type Testimonial = {
  id: string; name: string; town: string; job: string;
  stars: number; text: string; status: string; created_at: string;
};

type Tab = "pending" | "approved" | "add" | "qr";

function StarDisplay({ stars }: { stars: number }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons key={n} name={n <= stars ? "star" : "star-outline"} size={13} color={P.gold} />
      ))}
    </View>
  );
}

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

function ReplyBlock({ t, replies, replyLoadingId, generateReply, copyReply }: {
  t: Testimonial;
  replies: Record<string, string>;
  replyLoadingId: string | null;
  generateReply: (t: Testimonial) => void;
  copyReply: (id: string) => void;
}) {
  const reply = replies[t.id];
  const loading = replyLoadingId === t.id;
  return (
    <View style={styles.replyBlock}>
      {reply ? (
        <>
          <View style={styles.replyHeader}>
            <Ionicons name="sparkles" size={13} color={P.copper} />
            <Text style={styles.replyLabel}>AI Reply</Text>
            <TouchableOpacity onPress={() => copyReply(t.id)} style={styles.copyBtn} activeOpacity={0.7}>
              <Ionicons name="copy-outline" size={13} color={P.copper} />
              <Text style={styles.copyBtnText}>Copy</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.replyText}>{reply}</Text>
          <TouchableOpacity onPress={() => generateReply(t)} activeOpacity={0.7} style={styles.regenerateBtn}>
            <Ionicons name="refresh-outline" size={12} color={P.muted} />
            <Text style={styles.regenerateBtnText}>Regenerate</Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity
          style={[styles.generateReplyBtn, loading && styles.btnDisabled]}
          onPress={() => generateReply(t)}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color={P.copper} />
          ) : (
            <>
              <Ionicons name="sparkles" size={13} color={P.copper} />
              <Text style={styles.generateReplyBtnText}>Generate AI Reply</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function Testimonials() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [tab, setTab] = useState<Tab>("pending");
  const [pending, setPending] = useState<Testimonial[]>([]);
  const [approved, setApproved] = useState<Testimonial[]>([]);
  const [fetching, setFetching] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [town, setTown] = useState("");
  const [job, setJob] = useState("");
  const [stars, setStars] = useState(5);
  const [text, setText] = useState("");
  const [formError, setFormError] = useState("");
  const [replyLoadingId, setReplyLoadingId] = useState<string | null>(null);
  const [replies, setReplies] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && !user) router.replace("/admin");
  }, [user, loading]);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const all: Testimonial[] = await api.get("/testimonials");
      setPending((all || []).filter((t) => t.status === "pending"));
      setApproved((all || []).filter((t) => t.status !== "pending"));
    } catch {
      setLoadError(true);
    }
    setFetching(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const approveItem = async (id: string) => {
    setActingId(id);
    try {
      await api.put(`/testimonials/${id}/approve`, {});
      await load();
    } catch {
      Alert.alert("Error", "Could not approve review.");
    }
    setActingId(null);
  };

  const deleteItem = (id: string, label = "testimonial") => {
    Alert.alert("Delete", `Remove this ${label}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          setActingId(id);
          try {
            await api.del(`/testimonials/${id}`);
            await load();
          } catch {
            Alert.alert("Error", "Could not delete.");
          }
          setActingId(null);
        },
      },
    ]);
  };

  const addTestimonial = async () => {
    if (!name.trim() || !text.trim()) {
      setFormError("Name and review text are required.");
      return;
    }
    setFormError("");
    setSaving(true);
    try {
      await api.post("/testimonials", {
        name: name.trim(), town: town.trim(), job: job.trim(), stars, text: text.trim(),
      });
      setName(""); setTown(""); setJob(""); setStars(5); setText("");
      await load();
      Alert.alert("Saved", "Testimonial added and approved.");
      setTab("approved");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not save testimonial.");
    }
    setSaving(false);
  };

  const generateReply = async (t: Testimonial) => {
    setReplyLoadingId(t.id);
    try {
      const data = await api.post("/ai/review-reply", {
        reviewer_name: t.name,
        review_text: t.text,
        stars: t.stars,
      });
      setReplies((prev) => ({ ...prev, [t.id]: data.reply }));
    } catch {
      Alert.alert("Error", "Could not generate reply. Please try again.");
    }
    setReplyLoadingId(null);
  };

  const copyReply = (id: string) => {
    const reply = replies[id];
    if (!reply) return;
    if (Platform.OS === "web") {
      (globalThis as any).navigator?.clipboard?.writeText(reply)
        .then(() => Alert.alert("Copied", "Reply copied to clipboard."))
        .catch(() => Alert.alert("Copy failed", "Please select and copy the text manually."));
    } else {
      Alert.alert("Copied", "Reply copied to clipboard.");
    }
  };

  const downloadQR = () => {
    if (Platform.OS !== "web") return;
    const link = (globalThis as any).document?.createElement("a");
    if (!link) return;
    link.download = "TB-Paving-Review-QR.png";
    link.href = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(REVIEW_URL)}&size=500x500&color=1A2A3A&bgcolor=FFFFFF`;
    link.target = "_blank";
    link.click();
  };

  if (loading || fetching) {
    return <View style={styles.center}><ActivityIndicator size="large" color={P.copper} /></View>;
  }

  const TABS: { key: Tab; label: string; badge?: number }[] = [
    { key: "pending", label: "Pending", badge: pending.length },
    { key: "approved", label: "Approved", badge: approved.length },
    { key: "add", label: "Add Review" },
    { key: "qr", label: "QR Code" },
  ];

  return (
    <View style={[styles.root, !isDesktop && { flexDirection: "column" }]}>
      <AdminSidebar activeRoute="/admin/testimonials" />

      <View style={styles.main}>
        <View style={styles.topBar}>
          <Text style={styles.pageTitle}>Testimonials</Text>
          <View style={styles.topRight}>
            <Text style={styles.userName}>{user?.name}</Text>
            <TouchableOpacity onPress={async () => { await logout(); router.replace("/admin"); }} style={styles.iconBtn}>
              <Ionicons name="log-out-outline" size={20} color={P.muted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab bar */}
        <View style={styles.tabBarWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarContent}>
            {TABS.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
                onPress={() => setTab(t.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabBtnText, tab === t.key && styles.tabBtnTextActive]}>{t.label}</Text>
                {t.badge != null && t.badge > 0 && (
                  <View style={[styles.tabBadge, t.key === "pending" && styles.tabBadgePending]}>
                    <Text style={styles.tabBadgeText}>{t.badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

          {/* ── PENDING ── */}
          {tab === "pending" && (
            <>
              {loadError && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>Could not load reviews. </Text>
                  <TouchableOpacity onPress={load}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
                </View>
              )}
              {pending.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons name="checkmark-circle-outline" size={40} color={P.success} />
                  <Text style={styles.emptyTitle}>All clear!</Text>
                  <Text style={styles.emptyText}>No pending reviews to approve.</Text>
                </View>
              ) : (
                pending.map((t) => (
                  <View key={t.id} style={[styles.reviewCard, styles.pendingCard]}>
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingBadgeText}>PENDING APPROVAL</Text>
                    </View>
                    <View style={styles.reviewHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.reviewName}>{t.name}</Text>
                        {(t.town || t.job) && (
                          <Text style={styles.reviewMeta}>{[t.job, t.town].filter(Boolean).join(" · ")}</Text>
                        )}
                      </View>
                      <Text style={styles.reviewDate}>{new Date(t.created_at).toLocaleDateString("en-GB")}</Text>
                    </View>
                    <StarDisplay stars={t.stars} />
                    <Text style={styles.reviewText}>"{t.text}"</Text>
                    <ReplyBlock t={t} replies={replies} replyLoadingId={replyLoadingId} generateReply={generateReply} copyReply={copyReply} />
                    <View style={styles.reviewActions}>
                      <TouchableOpacity
                        style={[styles.approveBtn, actingId === t.id && styles.btnDisabled]}
                        onPress={() => approveItem(t.id)}
                        disabled={actingId === t.id}
                        activeOpacity={0.8}
                      >
                        {actingId === t.id ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Ionicons name="checkmark-outline" size={16} color="#FFFFFF" />
                            <Text style={styles.approveBtnText}>Approve</Text>
                          </>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.rejectBtn, actingId === t.id && styles.btnDisabled]}
                        onPress={() => deleteItem(t.id, "pending review")}
                        disabled={actingId === t.id}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="close-outline" size={16} color={P.error} />
                        <Text style={styles.rejectBtnText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </>
          )}

          {/* ── APPROVED ── */}
          {tab === "approved" && (
            <>
              {approved.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons name="star-outline" size={40} color={P.muted} />
                  <Text style={styles.emptyTitle}>No approved reviews yet</Text>
                  <Text style={styles.emptyText}>Approve customer submissions or add one manually.</Text>
                </View>
              ) : (
                <View style={isDesktop ? styles.cardGrid : undefined}>
                  {approved.map((t) => (
                    <View key={t.id} style={[styles.reviewCard, isDesktop && styles.reviewCardDesktop]}>
                      <View style={styles.reviewHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.reviewName}>{t.name}</Text>
                          {(t.town || t.job) && (
                            <Text style={styles.reviewMeta}>{[t.job, t.town].filter(Boolean).join(" · ")}</Text>
                          )}
                        </View>
                        <TouchableOpacity
                          onPress={() => deleteItem(t.id)}
                          disabled={actingId === t.id}
                          activeOpacity={0.7}
                          style={{ padding: 8, borderRadius: 8, backgroundColor: "#FEF2F2" }}
                        >
                          {actingId === t.id ? (
                            <ActivityIndicator size="small" color={P.error} />
                          ) : (
                            <Ionicons name="trash-outline" size={20} color={P.error} />
                          )}
                        </TouchableOpacity>
                      </View>
                      <StarDisplay stars={t.stars} />
                      <Text style={styles.reviewText}>"{t.text}"</Text>
                      <ReplyBlock t={t} replies={replies} replyLoadingId={replyLoadingId} generateReply={generateReply} copyReply={copyReply} />
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          {/* ── ADD ── */}
          {tab === "add" && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Add Testimonial (Auto-Approved)</Text>
              {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

              <View style={isDesktop ? styles.rowTwo : undefined}>
                <View style={[styles.field, isDesktop && { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Customer Name *</Text>
                  <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Sarah K." placeholderTextColor={P.muted} />
                </View>
                <View style={[styles.field, isDesktop && { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Town</Text>
                  <TextInput style={styles.input} value={town} onChangeText={setTown} placeholder="e.g. Chelmsford" placeholderTextColor={P.muted} />
                </View>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Job / Service</Text>
                <TextInput style={styles.input} value={job} onChangeText={setJob} placeholder="e.g. Block Paving Driveway" placeholderTextColor={P.muted} />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Star Rating</Text>
                <StarPicker value={stars} onChange={setStars} />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Review Text *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]} value={text} onChangeText={setText}
                  placeholder="Customer's review..." placeholderTextColor={P.muted}
                  multiline numberOfLines={4} textAlignVertical="top"
                />
              </View>
              <TouchableOpacity
                style={[styles.addBtn, saving && styles.btnDisabled]}
                onPress={addTestimonial} disabled={saving} activeOpacity={0.8}
              >
                {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
                  <>
                    <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.addBtnText}>Add Testimonial</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* ── QR CODE ── */}
          {tab === "qr" && (
            <View>
              <View style={styles.qrCard}>
                <Text style={styles.qrTitle}>Customer Review QR Code</Text>
                <Text style={styles.qrSub}>
                  Print this on your business cards, invoices, or display it at job sites. Customers scan it to leave a review instantly.
                </Text>

                <View style={styles.qrBox}>
                  <Image
                    source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(REVIEW_URL)}&size=240x240&color=1A2A3A&bgcolor=FFFFFF` }}
                    style={{ width: 240, height: 240 }}
                  />
                </View>

                <Text style={styles.qrUrl}>{REVIEW_URL}</Text>

                {Platform.OS === "web" && (
                  <TouchableOpacity style={styles.downloadBtn} onPress={downloadQR} activeOpacity={0.8}>
                    <Ionicons name="download-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.downloadBtnText}>Download QR Code (PNG)</Text>
                  </TouchableOpacity>
                )}

                <View style={styles.qrTipBox}>
                  <Ionicons name="bulb-outline" size={18} color={P.copper} />
                  <Text style={styles.qrTipText}>
                    Tip: Print it on the back of your quote sheets or stick it on your van. The more customers see it, the more reviews you get!
                  </Text>
                </View>
              </View>

              {/* Usage stats */}
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{approved.length}</Text>
                  <Text style={styles.statLabel}>Approved Reviews</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { color: pending.length > 0 ? P.pending : P.success }]}>{pending.length}</Text>
                  <Text style={styles.statLabel}>Awaiting Approval</Text>
                </View>
              </View>
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
  tabBarWrap: {
    height: 58, flexShrink: 0,
    backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: P.border,
  },
  tabBarContent: {
    paddingHorizontal: 16, gap: 8, flexDirection: "row",
    alignItems: "center", height: 58,
  },
  tabBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20,
    backgroundColor: "#F7F4F0", borderWidth: 1, borderColor: P.border,
    height: 38,
  },
  tabBtnActive: { backgroundColor: P.copper, borderColor: P.copper },
  tabBtnText: { fontSize: 14, fontWeight: "600", color: P.muted },
  tabBtnTextActive: { color: "#FFFFFF" },
  tabBadge: {
    minWidth: 18, height: 18, borderRadius: 9, backgroundColor: "#3B82F6",
    alignItems: "center", justifyContent: "center", paddingHorizontal: 4,
  },
  tabBadgePending: { backgroundColor: P.pending },
  tabBadgeText: { fontSize: 10, fontWeight: "800", color: "#FFFFFF" },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 60 },
  errorBanner: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FEF2F2",
    borderRadius: 8, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: "#FECACA",
  },
  errorBannerText: { fontSize: 13, color: P.error },
  retryText: { fontSize: 13, color: P.copper, fontWeight: "700" },
  emptyCard: {
    backgroundColor: "#FFFFFF", borderRadius: 14, padding: 40,
    alignItems: "center", borderWidth: 1, borderColor: P.border, gap: 10,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: P.ink },
  emptyText: { color: P.muted, fontSize: 14, textAlign: "center" },
  reviewCard: {
    backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: P.border,
  },
  reviewCardDesktop: { width: "31%" as any },
  pendingCard: { borderColor: "#FDE68A", borderWidth: 2 },
  pendingBadge: {
    alignSelf: "flex-start", backgroundColor: "#FEF3C7", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 3, marginBottom: 10,
  },
  pendingBadgeText: { fontSize: 10, fontWeight: "800", color: P.pending, letterSpacing: 0.5 },
  reviewHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
  reviewName: { fontSize: 15, fontWeight: "700", color: P.ink },
  reviewMeta: { fontSize: 12, color: P.muted, marginTop: 2 },
  reviewDate: { fontSize: 11, color: P.muted },
  starRow: { flexDirection: "row", gap: 3, marginBottom: 8 },
  reviewText: { fontSize: 13, color: "#4A443D", lineHeight: 20, fontStyle: "italic", marginTop: 4 },
  reviewActions: { flexDirection: "row", gap: 10, marginTop: 14 },
  approveBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: P.success, borderRadius: 10, paddingVertical: 14, minHeight: 48,
  },
  approveBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  rejectBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: "#FEF2F2", borderRadius: 10, paddingVertical: 14, minHeight: 48,
    borderWidth: 1.5, borderColor: "#FECACA",
  },
  rejectBtnText: { color: P.error, fontSize: 15, fontWeight: "700" },
  btnDisabled: { opacity: 0.6 },
  cardGrid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  formCard: {
    backgroundColor: "#FFFFFF", borderRadius: 14, padding: 20,
    borderWidth: 1, borderColor: P.border,
  },
  formTitle: { fontSize: 16, fontWeight: "700", color: P.ink, marginBottom: 14 },
  errorText: {
    color: P.error, backgroundColor: "#FEF2F2", borderRadius: 8,
    padding: 10, fontSize: 13, marginBottom: 12, borderWidth: 1, borderColor: "#FECACA",
  },
  rowTwo: { flexDirection: "row", gap: 12 },
  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: P.ink, marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: P.border, borderRadius: 8,
    paddingVertical: 10, paddingHorizontal: 12, fontSize: 14,
    color: P.ink, backgroundColor: "#FAFAF8", outlineStyle: "none" as any,
  },
  textArea: { minHeight: 90, paddingTop: 10 },
  addBtn: {
    flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: P.copper,
    borderRadius: 10, paddingVertical: 15, justifyContent: "center", marginTop: 8, minHeight: 52,
  },
  addBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  qrCard: {
    backgroundColor: "#FFFFFF", borderRadius: 16, padding: 24,
    borderWidth: 1, borderColor: P.border, alignItems: "center", marginBottom: 16,
  },
  qrTitle: { fontSize: 18, fontWeight: "800", color: P.navy, marginBottom: 8, textAlign: "center" },
  qrSub: { fontSize: 13, color: P.muted, textAlign: "center", lineHeight: 19, marginBottom: 24, maxWidth: 380 },
  qrBox: {
    padding: 20, backgroundColor: "#FFFFFF", borderRadius: 16,
    borderWidth: 2, borderColor: P.border, marginBottom: 16,
    shadowColor: "#3A2A1A", shadowOpacity: 0.08, shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  qrUrl: { fontSize: 12, color: P.copper, fontWeight: "600", marginBottom: 20, textAlign: "center" },
  downloadBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: P.navy, borderRadius: 10, paddingVertical: 15, paddingHorizontal: 28,
    marginBottom: 20, minHeight: 52,
  },
  downloadBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  qrTipBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    backgroundColor: "#FEF3C7", borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: "#FDE68A", maxWidth: 420,
  },
  qrTipText: { flex: 1, fontSize: 13, color: "#92400E", lineHeight: 18 },
  statsRow: { flexDirection: "row", gap: 12 },
  statCard: {
    flex: 1, backgroundColor: "#FFFFFF", borderRadius: 12, padding: 18,
    alignItems: "center", borderWidth: 1, borderColor: P.border,
  },
  statValue: { fontSize: 32, fontWeight: "800", color: P.navy },
  statLabel: { fontSize: 12, color: P.muted, fontWeight: "500", marginTop: 4, textAlign: "center" },
  replyBlock: { marginTop: 12 },
  generateReplyBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8,
    borderWidth: 1.5, borderColor: P.copper, borderStyle: "dashed",
    alignSelf: "flex-start", backgroundColor: "#FFFBF5",
  },
  generateReplyBtnText: { fontSize: 12, fontWeight: "700", color: P.copper },
  replyHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  replyLabel: { fontSize: 12, fontWeight: "700", color: P.copper, flex: 1 },
  copyBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: "#FFFBF5", borderWidth: 1, borderColor: "#E8D5B8" },
  copyBtnText: { fontSize: 11, fontWeight: "700", color: P.copper },
  replyText: { fontSize: 12, color: P.ink, lineHeight: 18, backgroundColor: "#FFFBF5", borderRadius: 8, padding: 10, borderWidth: 1, borderColor: "#E8D5B8" },
  regenerateBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6, alignSelf: "flex-start" },
  regenerateBtnText: { fontSize: 11, color: P.muted, fontWeight: "600" },
});
