import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert, RefreshControl, Linking, useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/context/AuthContext";
import { api } from "@/src/api";
import AdminSidebar from "@/src/components/AdminSidebar";
import { P } from "@/src/adminTheme";

type Enquiry = {
  id: number; name: string; email: string; phone: string;
  service: string; message: string; status: string; created_at: string;
};

const STATUS_FILTERS = ["All", "New", "Contacted", "Closed"] as const;
type Filter = typeof STATUS_FILTERS[number];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const STATUS_CFG: Record<string, { bg: string; color: string; label: string }> = {
  new: { bg: "#FEF3C7", color: "#D97706", label: "New" },
  contacted: { bg: "#D1FAE5", color: "#2D7A4F", label: "Contacted" },
  closed: { bg: "#F3F4F6", color: "#7A6A5A", label: "Closed" },
};

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_CFG[status] || STATUS_CFG.new;
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

export function LeadsPanel() {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [fetching, setFetching] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [updating, setUpdating] = useState<number | null>(null);

  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const data = await api.get("/enquiries");
      setEnquiries(data || []);
    } catch {
      setLoadError(true);
    }
    setFetching(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const updateStatus = async (id: number, status: string) => {
    const prev = enquiries.find((e) => e.id === id)?.status;
    setUpdating(id);
    setEnquiries((list) => list.map((e) => e.id === id ? { ...e, status } : e));
    try {
      await api.put(`/enquiries/${id}/status?status=${status}`);
    } catch {
      // Rollback on failure
      setEnquiries((list) => list.map((e) => e.id === id ? { ...e, status: prev ?? e.status } : e));
      Alert.alert("Error", "Could not update status. Please try again.");
    }
    setUpdating(null);
  };

  const filtered = enquiries.filter((e) => {
    const matchFilter = filter === "All" || e.status === filter.toLowerCase();
    const q = search.toLowerCase();
    const matchSearch = !q || e.name.toLowerCase().includes(q) || e.service.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  if (loading || fetching) {
    return <View style={styles.center}><ActivityIndicator size="large" color={P.copper} /></View>;
  }

  return (
    <View style={styles.main}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>Leads CRM</Text>
        <View style={styles.topRight}>
          <Text style={styles.userName}>{user?.name}</Text>
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={16} color={P.muted} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search name or service..."
              placeholderTextColor={P.muted}
              value={search}
              onChangeText={setSearch}
            />
            {search ? (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={16} color={P.muted} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Status filter tabs */}
        <View style={styles.filterRow}>
          {STATUS_FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={P.copper} />}
        >
          <Text style={styles.resultCount}>{sorted.length} lead{sorted.length !== 1 ? "s" : ""}</Text>

          {sorted.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No leads match your filters.</Text>
            </View>
          ) : (
            sorted.map((enq) => (
              <View key={enq.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardName}>{enq.name}</Text>
                    <Text style={styles.cardService}>{enq.service}</Text>
                  </View>
                  <StatusBadge status={enq.status} />
                </View>

                {enq.message ? (
                  <Text style={styles.cardMessage} numberOfLines={2}>{enq.message}</Text>
                ) : null}

                <View style={styles.cardMeta}>
                  {enq.phone ? (
                    <View style={styles.metaItem}>
                      <Ionicons name="call-outline" size={13} color={P.muted} />
                      <Text style={styles.metaText}>{enq.phone}</Text>
                    </View>
                  ) : null}
                  {enq.email ? (
                    <View style={styles.metaItem}>
                      <Ionicons name="mail-outline" size={13} color={P.muted} />
                      <Text style={styles.metaText}>{enq.email}</Text>
                    </View>
                  ) : null}
                  <Text style={styles.metaTime}>{timeAgo(enq.created_at)}</Text>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: P.success }]}
                    onPress={() => Linking.openURL(`tel:${enq.phone}`)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="call-outline" size={14} color={P.success} />
                    <Text style={[styles.actionText, { color: P.success }]}>Call</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: "#3B82F6" }]}
                    onPress={() => Linking.openURL(`mailto:${enq.email}`)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="mail-outline" size={14} color="#3B82F6" />
                    <Text style={[styles.actionText, { color: "#3B82F6" }]}>Email</Text>
                  </TouchableOpacity>

                  {enq.status !== "contacted" && (
                    <TouchableOpacity
                      style={[styles.actionBtn, { borderColor: P.copper }]}
                      onPress={() => updateStatus(enq.id, "contacted")}
                      disabled={updating === enq.id}
                      activeOpacity={0.7}
                    >
                      {updating === enq.id ? (
                        <ActivityIndicator size="small" color={P.copper} />
                      ) : (
                        <>
                          <Ionicons name="checkmark-outline" size={14} color={P.copper} />
                          <Text style={[styles.actionText, { color: P.copper }]}>Contacted</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}

                  {enq.status !== "closed" && (
                    <TouchableOpacity
                      style={[styles.actionBtn, { borderColor: P.muted }]}
                      onPress={() => updateStatus(enq.id, "closed")}
                      disabled={updating === enq.id}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close-outline" size={14} color={P.muted} />
                      <Text style={[styles.actionText, { color: P.muted }]}>Close</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
      </ScrollView>
    </View>
  );
}

export default function Leads() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  useEffect(() => {
    if (!loading && !user) router.replace("/admin");
  }, [user, loading]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={P.copper} /></View>;
  }

  return (
    <View style={[styles.root, !isDesktop && { flexDirection: "column" }]}>
      <AdminSidebar activeRoute="/admin/leads" />
      <LeadsPanel />
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
  searchRow: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  searchBox: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF",
    borderRadius: 10, borderWidth: 1, borderColor: P.border,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: P.ink, outlineStyle: "none" as any },
  filterRow: {
    flexDirection: "row", paddingHorizontal: 20, paddingBottom: 12, gap: 8,
  },
  filterTab: {
    paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20,
    borderWidth: 1.5, borderColor: P.border, backgroundColor: "#FFFFFF",
  },
  filterTabActive: { backgroundColor: P.copper, borderColor: P.copper },
  filterTabText: { fontSize: 13, fontWeight: "600", color: P.muted },
  filterTabTextActive: { color: "#FFFFFF" },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 4, paddingBottom: 40 },
  resultCount: { fontSize: 12, color: P.muted, marginBottom: 10 },
  emptyCard: {
    backgroundColor: "#FFFFFF", borderRadius: 12, padding: 32, alignItems: "center",
    borderWidth: 1, borderColor: P.border,
  },
  emptyText: { color: P.muted, fontSize: 14 },
  card: {
    backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: P.border,
    shadowColor: "#3A2A1A", shadowOpacity: 0.04, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
  cardName: { fontSize: 15, fontWeight: "700", color: P.ink },
  cardService: { fontSize: 13, color: P.muted, marginTop: 2 },
  cardMessage: { fontSize: 13, color: "#4A443D", marginBottom: 8, lineHeight: 18 },
  cardMeta: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 10, marginBottom: 10 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: P.muted },
  metaTime: { fontSize: 12, color: P.muted, marginLeft: "auto" as any },
  cardActions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  actionBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingVertical: 5, paddingHorizontal: 10, borderRadius: 20,
    borderWidth: 1.5, backgroundColor: "#F9F7F5",
  },
  actionText: { fontSize: 12, fontWeight: "600" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },
});
