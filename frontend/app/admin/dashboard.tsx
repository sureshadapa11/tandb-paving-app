import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, useWindowDimensions, RefreshControl, Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/context/AuthContext";
import { api } from "@/src/api";
import AdminSidebar from "@/src/components/AdminSidebar";

const P = {
  bg: "#F7F4F0", card: "#FFFFFF", navy: "#1A2A3A", copper: "#B5651D",
  ink: "#1A2A3A", muted: "#7A6A5A", border: "#E8E0D4",
  success: "#2D7A4F", warning: "#D97706", error: "#DC2626",
};

type DashData = {
  active_projects: number; total_projects: number;
  workers: number; pending_quotes: number; revenue: number; low_stock: number;
};
type Enquiry = {
  id: number; name: string; email: string; phone: string;
  service: string; message: string; status: string; created_at: string;
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string; label: string }> = {
    new: { bg: "#FEF3C7", color: P.warning, label: "New" },
    contacted: { bg: "#D1FAE5", color: P.success, label: "Contacted" },
    closed: { bg: "#F3F4F6", color: P.muted, label: "Closed" },
  };
  const c = cfg[status] || cfg.new;
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [dash, setDash] = useState<DashData | null>(null);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [fetching, setFetching] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/admin");
  }, [user, loading]);

  const load = useCallback(async () => {
    try {
      const [d, e] = await Promise.all([api.get("/dashboard"), api.get("/enquiries")]);
      setDash(d);
      setEnquiries(e || []);
    } catch {}
    setFetching(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const handleLogout = async () => { await logout(); router.replace("/admin"); };

  const newCount = enquiries.filter((e) => e.status === "new").length;
  const recent = [...enquiries].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ).slice(0, 5);

  const statCards = [
    { label: "New Enquiries", value: newCount, icon: "mail", color: P.warning },
    { label: "Total Enquiries", value: enquiries.length, icon: "people", color: "#3B82F6" },
    { label: "Pending Quotes", value: dash?.pending_quotes ?? "—", icon: "document-text", color: P.copper },
    { label: "Active Projects", value: dash?.active_projects ?? "—", icon: "construct", color: P.success },
  ];

  if (loading || fetching) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={P.copper} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <AdminSidebar activeRoute="/admin/dashboard" />

      <View style={styles.main}>
        {/* Top bar — desktop only */}
        {isDesktop && (
          <View style={styles.topBar}>
            <Text style={styles.pageTitle}>Admin Dashboard</Text>
            <View style={styles.topRight}>
              <Text style={styles.userName}>{user?.name}</Text>
              <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} activeOpacity={0.7}>
                <Ionicons name="log-out-outline" size={20} color={P.muted} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={P.copper} />}
        >
          {/* Stat cards */}
          <View style={[styles.statsRow, !isDesktop && styles.statsRowMobile]}>
            {statCards.map((s) => (
              <View key={s.label} style={[styles.statCard, !isDesktop && styles.statCardHalf]}>
                <View style={[styles.statIcon, { backgroundColor: s.color + "18" }]}>
                  <Ionicons name={s.icon as any} size={22} color={s.color} />
                </View>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Recent enquiries */}
          <Text style={styles.sectionTitle}>Recent Enquiries</Text>

          {recent.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No enquiries yet.</Text>
            </View>
          ) : (
            recent.map((enq) => (
              <View key={enq.id} style={styles.enquiryCard}>
                <View style={styles.enquiryHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.enquiryName}>{enq.name}</Text>
                    <Text style={styles.enquiryService}>{enq.service}</Text>
                  </View>
                  <StatusBadge status={enq.status} />
                </View>
                <View style={styles.enquiryMeta}>
                  <Text style={styles.enquiryTime}>{timeAgo(enq.created_at)}</Text>
                  <View style={styles.enquiryActions}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => Linking.openURL(`tel:${enq.phone}`)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="call-outline" size={16} color={P.success} />
                      <Text style={[styles.actionBtnText, { color: P.success }]}>Call</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => Linking.openURL(`mailto:${enq.email}`)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="mail-outline" size={16} color="#3B82F6" />
                      <Text style={[styles.actionBtnText, { color: "#3B82F6" }]}>Email</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}

          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={() => router.push("/admin/leads")}
            activeOpacity={0.8}
          >
            <Text style={styles.viewAllText}>View All Leads →</Text>
          </TouchableOpacity>
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
    borderBottomWidth: 1, borderBottomColor: "#E8E0D4",
  },
  pageTitle: { fontSize: 20, fontWeight: "700", color: P.navy },
  topRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  userName: { fontSize: 14, color: P.muted, fontWeight: "500" },
  logoutBtn: { padding: 8 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },
  statsRowMobile: { flexDirection: "row", flexWrap: "wrap" },
  statCard: {
    flex: 1, minWidth: 140, backgroundColor: "#FFFFFF", borderRadius: 14,
    padding: 18, alignItems: "flex-start",
    shadowColor: "#3A2A1A", shadowOpacity: 0.06, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  statCardHalf: { minWidth: "45%" as any },
  statIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center", marginBottom: 10 },
  statValue: { fontSize: 26, fontWeight: "800", color: P.ink, marginBottom: 2 },
  statLabel: { fontSize: 13, color: P.muted, fontWeight: "500" },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: P.ink, marginBottom: 12 },
  emptyCard: {
    backgroundColor: "#FFFFFF", borderRadius: 12, padding: 24, alignItems: "center",
    borderWidth: 1, borderColor: "#E8E0D4",
  },
  emptyText: { color: P.muted, fontSize: 14 },
  enquiryCard: {
    backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: "#E8E0D4",
    shadowColor: "#3A2A1A", shadowOpacity: 0.04, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  enquiryHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
  enquiryName: { fontSize: 15, fontWeight: "700", color: P.ink },
  enquiryService: { fontSize: 13, color: P.muted, marginTop: 2 },
  enquiryMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  enquiryTime: { fontSize: 12, color: P.muted },
  enquiryActions: { flexDirection: "row", gap: 8 },
  actionBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingVertical: 5, paddingHorizontal: 10, borderRadius: 20,
    backgroundColor: "#F7F4F0", borderWidth: 1, borderColor: "#E8E0D4",
  },
  actionBtnText: { fontSize: 12, fontWeight: "600" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },
  viewAllBtn: {
    marginTop: 12, alignSelf: "flex-end", paddingVertical: 8, paddingHorizontal: 16,
    borderRadius: 8, backgroundColor: P.copper,
  },
  viewAllText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
});
