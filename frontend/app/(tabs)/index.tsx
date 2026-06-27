import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/context/AuthContext";
import { api } from "@/src/api";
import { C, S, F } from "@/src/theme";

function Metric({ label, value, color, testID }: any) {
  return (
    <View style={[styles.metric, { borderColor: C.borderStrong }]} testID={testID}>
      <Text style={[styles.metricVal, color && { color }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

export default function Home() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [d, setD] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { setD(await api.get("/dashboard")); } catch {}
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <View style={{ flex: 1, backgroundColor: C.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + S.md }]}>
        <View>
          <Text style={styles.hello}>WELCOME BACK</Text>
          <Text style={styles.name}>{(user?.name || "").toUpperCase()}</Text>
        </View>
        <Pressable testID="logout-btn" onPress={logout} style={styles.iconBtn}>
          <Ionicons name="log-out-outline" size={22} color={C.onSurface} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: S.lg, paddingBottom: S["3xl"] }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.brand} />}>
        <View style={styles.grid}>
          <Metric testID="metric-active" label="ACTIVE SITES" value={d?.active_projects ?? "—"} />
          <Metric testID="metric-workers" label="CREW MEMBERS" value={d?.workers ?? "—"} />
          <Metric testID="metric-quotes" label="PENDING BILLS" value={d?.pending_quotes ?? "—"} color={C.brand} />
          <Metric testID="metric-lowstock" label="LOW STOCK" value={d?.low_stock ?? "—"} color={(d?.low_stock || 0) > 0 ? C.error : C.onSurface} />
        </View>

        <View style={styles.revenueBox}>
          <Text style={styles.revenueLabel}>TOTAL REVENUE (PAID)</Text>
          <Text style={styles.revenueVal}>${(d?.revenue ?? 0).toLocaleString()}</Text>
        </View>

        <Text style={styles.section}>QUICK ACTIONS</Text>
        <View style={styles.actions}>
          {[
            { t: "NEW PROJECT", i: "add-circle", r: "/(tabs)/projects" },
            { t: "CREATE BILL", i: "receipt", r: "/(tabs)/billing" },
            { t: "MANAGE CREW", i: "people", r: "/(tabs)/crew" },
            { t: "ASK AI", i: "sparkles", r: "/(tabs)/assistant" },
          ].map((a) => (
            <Pressable key={a.t} testID={`action-${a.i}`} style={styles.action} onPress={() => router.push(a.r as any)}>
              <Ionicons name={a.i as any} size={24} color={C.onSurface} />
              <Text style={styles.actionText}>{a.t}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingHorizontal: S.lg, paddingBottom: S.md, borderBottomWidth: 2, borderBottomColor: C.borderStrong },
  hello: { fontSize: 11, fontWeight: "800", letterSpacing: 1.5, color: C.muted },
  name: { ...F.display, fontSize: 26, color: C.onSurface },
  iconBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: C.borderStrong },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: S.md },
  metric: { width: "47.5%", flexGrow: 1, borderWidth: 2, padding: S.lg, backgroundColor: C.surface },
  metricVal: { ...F.display, fontSize: 38, color: C.onSurface },
  metricLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 1, color: C.muted, marginTop: 4 },
  revenueBox: { backgroundColor: C.onSurface, padding: S.lg, marginTop: S.md, borderWidth: 2, borderColor: C.borderStrong },
  revenueLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 1.5, color: C.brandTertiary },
  revenueVal: { ...F.display, fontSize: 40, color: C.onSurfaceInverse, marginTop: 4 },
  section: { ...F.heavy, fontSize: 14, letterSpacing: 1, color: C.onSurface, marginTop: S.xl, marginBottom: S.md },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: S.md },
  action: { width: "47.5%", flexGrow: 1, borderWidth: 2, borderColor: C.borderStrong, padding: S.lg, gap: S.sm },
  actionText: { fontWeight: "800", letterSpacing: 0.5, color: C.onSurface },
});
