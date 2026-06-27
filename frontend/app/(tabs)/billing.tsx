import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/src/api";
import { C, S, F, statusColor } from "@/src/theme";
import { Btn, Field, EmptyState, Tag } from "@/src/components/ui";
import { Sheet } from "@/src/components/Sheet";

export default function Billing() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState("quote");
  const [form, setForm] = useState<any>({ client_name: "", title: "", tax: "0" });
  const [lines, setLines] = useState<any[]>([{ desc: "", qty: "1", unit_price: "" }]);

  const load = useCallback(async () => {
    try { setItems(await api.get("/quotes")); } catch {} finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const subtotal = lines.reduce((s, l) => s + (parseFloat(l.qty) || 0) * (parseFloat(l.unit_price) || 0), 0);

  const save = async () => {
    if (!form.client_name || !form.title) return;
    setSaving(true);
    try {
      await api.post("/quotes", {
        client_name: form.client_name, title: form.title, type,
        tax_percent: parseFloat(form.tax) || 0, status: "draft",
        line_items: lines.map((l) => ({ desc: l.desc, qty: parseFloat(l.qty) || 0, unit_price: parseFloat(l.unit_price) || 0 })),
      });
      setOpen(false); setForm({ client_name: "", title: "", tax: "0" }); setLines([{ desc: "", qty: "1", unit_price: "" }]); load();
    } catch {} finally { setSaving(false); }
  };

  const cycleStatus = async (q: any) => {
    const next = q.status === "draft" ? "sent" : q.status === "sent" ? "paid" : "draft";
    await api.put(`/quotes/${q.id}`, { ...q, status: next });
    load();
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + S.md }]}>
        <Text style={styles.title}>BILLING</Text>
        <Pressable testID="add-quote-btn" onPress={() => setOpen(true)} style={styles.addBtn}>
          <Ionicons name="add" size={26} color={C.onBrand} />
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: S.lg, paddingBottom: S["3xl"], gap: S.md }}
        ListEmptyComponent={!loading ? <EmptyState testID="billing-empty" icon="receipt-outline" title="No Bills Yet" subtitle="Create a quote or invoice for a client." /> : null}
        renderItem={({ item }) => (
          <View testID={`quote-${item.id}`} style={styles.card}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1, marginRight: S.sm }}>
                <Text style={styles.qType}>{(item.type || "quote").toUpperCase()}</Text>
                <Text style={styles.qTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.qClient}>{item.client_name}</Text>
              </View>
              <Pressable testID={`quote-status-${item.id}`} onPress={() => cycleStatus(item)}>
                <Tag label={item.status} color={statusColor(item.status)} />
              </Pressable>
            </View>
            <View style={styles.qFooter}>
              <Text style={styles.qMeta}>{(item.line_items || []).length} ITEMS · TAX {item.tax_percent || 0}%</Text>
              <Text style={styles.qTotal}>${(item.total || 0).toLocaleString()}</Text>
            </View>
          </View>
        )}
      />

      <Sheet visible={open} onClose={() => setOpen(false)} title="NEW BILL" testID="quote-sheet">
        <View style={styles.typeRow}>
          {["quote", "invoice"].map((t) => (
            <Pressable key={t} testID={`type-${t}`} style={[styles.typeBtn, type === t && styles.typeActive]} onPress={() => setType(t)}>
              <Text style={[styles.typeText, type === t && styles.typeTextActive]}>{t.toUpperCase()}</Text>
            </Pressable>
          ))}
        </View>
        <Field label="Client Name" testID="qf-client" value={form.client_name} onChangeText={(t: string) => setForm({ ...form, client_name: t })} placeholder="Acme Corp" />
        <Field label="Title" testID="qf-title" value={form.title} onChangeText={(t: string) => setForm({ ...form, title: t })} placeholder="Phase 1 Foundation" />
        <Text style={styles.lineHeader}>LINE ITEMS</Text>
        {lines.map((l, idx) => (
          <View key={idx} style={styles.lineRow}>
            <Field testID={`line-desc-${idx}`} value={l.desc} onChangeText={(t: string) => { const n = [...lines]; n[idx].desc = t; setLines(n); }} placeholder="Description" style={{ flex: 1 }} />
            <View style={{ width: 56 }}><Field testID={`line-qty-${idx}`} value={l.qty} onChangeText={(t: string) => { const n = [...lines]; n[idx].qty = t; setLines(n); }} keyboardType="numeric" placeholder="Qty" /></View>
            <View style={{ width: 80 }}><Field testID={`line-price-${idx}`} value={l.unit_price} onChangeText={(t: string) => { const n = [...lines]; n[idx].unit_price = t; setLines(n); }} keyboardType="numeric" placeholder="Price" /></View>
          </View>
        ))}
        <Pressable testID="add-line-btn" onPress={() => setLines([...lines, { desc: "", qty: "1", unit_price: "" }])} style={styles.addLine}>
          <Ionicons name="add" size={18} color={C.onSurface} />
          <Text style={styles.addLineText}>ADD LINE</Text>
        </Pressable>
        <Field label="Tax %" testID="qf-tax" value={form.tax} onChangeText={(t: string) => setForm({ ...form, tax: t })} keyboardType="numeric" />
        <Text style={styles.subtotalText}>SUBTOTAL: ${subtotal.toLocaleString()}</Text>
        <Btn testID="qf-save" label="Save Bill" onPress={save} loading={saving} />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: S.lg, paddingBottom: S.md, borderBottomWidth: 2, borderColor: C.borderStrong },
  title: { ...F.display, fontSize: 30, color: C.onSurface },
  addBtn: { width: 48, height: 48, backgroundColor: C.brand, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: C.borderStrong },
  card: { borderWidth: 2, borderColor: C.borderStrong, padding: S.md },
  qType: { fontSize: 10, fontWeight: "800", letterSpacing: 1, color: C.brand },
  qTitle: { ...F.heavy, fontSize: 16, color: C.onSurface, marginTop: 2 },
  qClient: { fontSize: 12, color: C.muted, marginTop: 2 },
  qFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: S.md, borderTopWidth: 1, borderColor: C.border, paddingTop: S.sm },
  qMeta: { fontSize: 11, fontWeight: "700", color: C.muted, fontFamily: "monospace" },
  qTotal: { ...F.display, fontSize: 22, color: C.onSurface },
  typeRow: { flexDirection: "row", borderWidth: 2, borderColor: C.borderStrong, marginBottom: S.md },
  typeBtn: { flex: 1, paddingVertical: 12, alignItems: "center" },
  typeActive: { backgroundColor: C.onSurface },
  typeText: { fontWeight: "800", color: C.onSurface },
  typeTextActive: { color: C.onSurfaceInverse },
  lineHeader: { fontSize: 11, fontWeight: "800", letterSpacing: 1, color: C.onSurface, marginBottom: 6 },
  lineRow: { flexDirection: "row", gap: 6, alignItems: "flex-start" },
  addLine: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: C.borderStrong, paddingVertical: 10, marginBottom: S.md, borderStyle: "dashed" },
  addLineText: { fontWeight: "800", letterSpacing: 0.5, color: C.onSurface, marginLeft: 6 },
  subtotalText: { ...F.heavy, fontSize: 16, color: C.onSurface, marginBottom: S.md },
});
