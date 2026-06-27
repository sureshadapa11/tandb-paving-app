import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/src/api";
import { C, S, F, statusColor } from "@/src/theme";
import { Btn, Field, EmptyState } from "@/src/components/ui";
import { Sheet } from "@/src/components/Sheet";

const today = () => new Date().toISOString().slice(0, 10);

export default function Crew() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<"crew" | "inventory">("crew");
  const [workers, setWorkers] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [wForm, setWForm] = useState<any>({ name: "", role: "Laborer", daily_rate: "" });
  const [iForm, setIForm] = useState<any>({ name: "", unit: "units", quantity: "", unit_cost: "", threshold: "" });

  const load = useCallback(async () => {
    try {
      const [w, inv, att] = await Promise.all([api.get("/workers"), api.get("/inventory"), api.get(`/attendance?date=${today()}`)]);
      setWorkers(w); setInventory(inv);
      const map: Record<string, string> = {};
      att.forEach((a: any) => { map[a.worker_id] = a.status; });
      setAttendance(map);
    } catch {}
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const mark = async (wid: string, status: string) => {
    setAttendance((p) => ({ ...p, [wid]: status }));
    await api.post("/attendance", { worker_id: wid, date: today(), status });
  };

  const save = async () => {
    setSaving(true);
    try {
      if (tab === "crew") {
        if (!wForm.name) return;
        await api.post("/workers", { ...wForm, daily_rate: parseFloat(wForm.daily_rate) || 0 });
        setWForm({ name: "", role: "Laborer", daily_rate: "" });
      } else {
        if (!iForm.name) return;
        await api.post("/inventory", {
          ...iForm, quantity: parseFloat(iForm.quantity) || 0,
          unit_cost: parseFloat(iForm.unit_cost) || 0, threshold: parseFloat(iForm.threshold) || 0,
        });
        setIForm({ name: "", unit: "units", quantity: "", unit_cost: "", threshold: "" });
      }
      setOpen(false); load();
    } catch {} finally { setSaving(false); }
  };

  const present = Object.values(attendance).filter((s) => s === "present").length;

  return (
    <View style={{ flex: 1, backgroundColor: C.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + S.md }]}>
        <Text style={styles.title}>CREW & STOCK</Text>
        <Pressable testID="add-crew-btn" onPress={() => setOpen(true)} style={styles.addBtn}>
          <Ionicons name="add" size={26} color={C.onBrand} />
        </Pressable>
      </View>
      <View style={styles.segment}>
        {(["crew", "inventory"] as const).map((t) => (
          <Pressable key={t} testID={`seg-${t}`} style={[styles.segBtn, tab === t && styles.segActive]} onPress={() => setTab(t)}>
            <Text style={[styles.segText, tab === t && styles.segTextActive]}>{t.toUpperCase()}</Text>
          </Pressable>
        ))}
      </View>

      {tab === "crew" ? (
        <FlatList
          data={workers}
          keyExtractor={(i) => i.id}
          ListHeaderComponent={workers.length ? <Text style={styles.summary}>{present}/{workers.length} PRESENT TODAY</Text> : null}
          contentContainerStyle={{ padding: S.lg, paddingBottom: S["3xl"] }}
          ListEmptyComponent={<EmptyState testID="crew-empty" icon="people-outline" title="No Crew Yet" subtitle="Add workers to track attendance." />}
          renderItem={({ item }) => (
            <View testID={`worker-${item.id}`} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{item.name}</Text>
                <Text style={styles.rowSub}>{item.role} · ${item.daily_rate}/day</Text>
              </View>
              <View style={styles.attRow}>
                {[["present", "P"], ["half_day", "H"], ["absent", "A"]].map(([st, lbl]) => (
                  <Pressable key={st} testID={`att-${item.id}-${st}`} onPress={() => mark(item.id, st)}
                    style={[styles.attBtn, attendance[item.id] === st && { backgroundColor: statusColor(st), borderColor: statusColor(st) }]}>
                    <Text style={[styles.attText, attendance[item.id] === st && { color: "#fff" }]}>{lbl}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={inventory}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: S.lg, paddingBottom: S["3xl"] }}
          ListEmptyComponent={<EmptyState testID="inventory-empty" icon="cube-outline" title="Inventory Empty" subtitle="Add materials to track stock levels." />}
          renderItem={({ item }) => {
            const low = item.quantity <= item.threshold;
            return (
              <View testID={`inv-${item.id}`} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{item.name}</Text>
                  <Text style={styles.rowSub}>${item.unit_cost}/{item.unit}{low ? " · ⚠ LOW STOCK" : ""}</Text>
                </View>
                <View style={styles.qtyBox}>
                  <Text style={[styles.qtyVal, low && { color: C.error }]}>{item.quantity}</Text>
                  <Text style={styles.qtyUnit}>{item.unit.toUpperCase()}</Text>
                </View>
              </View>
            );
          }}
        />
      )}

      <Sheet visible={open} onClose={() => setOpen(false)} title={tab === "crew" ? "ADD WORKER" : "ADD MATERIAL"} testID="crew-sheet">
        {tab === "crew" ? (
          <>
            <Field label="Name" testID="wf-name" value={wForm.name} onChangeText={(t: string) => setWForm({ ...wForm, name: t })} placeholder="Mike Mason" />
            <Field label="Role" testID="wf-role" value={wForm.role} onChangeText={(t: string) => setWForm({ ...wForm, role: t })} placeholder="Mason" />
            <Field label="Daily Rate ($)" testID="wf-rate" value={wForm.daily_rate} onChangeText={(t: string) => setWForm({ ...wForm, daily_rate: t })} keyboardType="numeric" placeholder="180" />
          </>
        ) : (
          <>
            <Field label="Material Name" testID="if-name" value={iForm.name} onChangeText={(t: string) => setIForm({ ...iForm, name: t })} placeholder="Cement Bags" />
            <Field label="Unit" testID="if-unit" value={iForm.unit} onChangeText={(t: string) => setIForm({ ...iForm, unit: t })} placeholder="bags" />
            <Field label="Quantity" testID="if-qty" value={iForm.quantity} onChangeText={(t: string) => setIForm({ ...iForm, quantity: t })} keyboardType="numeric" placeholder="100" />
            <Field label="Unit Cost ($)" testID="if-cost" value={iForm.unit_cost} onChangeText={(t: string) => setIForm({ ...iForm, unit_cost: t })} keyboardType="numeric" placeholder="12" />
            <Field label="Low Stock Threshold" testID="if-threshold" value={iForm.threshold} onChangeText={(t: string) => setIForm({ ...iForm, threshold: t })} keyboardType="numeric" placeholder="20" />
          </>
        )}
        <Btn testID="crew-save" label="Save" onPress={save} loading={saving} />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: S.lg, paddingBottom: S.md },
  title: { ...F.display, fontSize: 28, color: C.onSurface },
  addBtn: { width: 48, height: 48, backgroundColor: C.brand, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: C.borderStrong },
  segment: { flexDirection: "row", borderWidth: 2, borderColor: C.borderStrong, marginHorizontal: S.lg, marginBottom: S.md },
  segBtn: { flex: 1, paddingVertical: 12, alignItems: "center" },
  segActive: { backgroundColor: C.onSurface },
  segText: { fontWeight: "800", letterSpacing: 1, color: C.onSurface },
  segTextActive: { color: C.onSurfaceInverse },
  summary: { ...F.heavy, fontSize: 13, letterSpacing: 1, color: C.brand, marginBottom: S.md },
  row: { flexDirection: "row", alignItems: "center", minHeight: 60, borderWidth: 2, borderColor: C.borderStrong, paddingHorizontal: S.md, paddingVertical: S.sm, marginBottom: S.sm },
  rowTitle: { ...F.heavy, fontSize: 15, color: C.onSurface },
  rowSub: { fontSize: 12, color: C.muted, marginTop: 2, fontFamily: "monospace" },
  attRow: { flexDirection: "row", gap: 6 },
  attBtn: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: C.borderStrong },
  attText: { fontWeight: "800", color: C.onSurface },
  qtyBox: { alignItems: "flex-end" },
  qtyVal: { ...F.display, fontSize: 24, color: C.onSurface },
  qtyUnit: { fontSize: 10, fontWeight: "800", color: C.muted },
});
