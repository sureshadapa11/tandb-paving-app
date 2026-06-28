import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert, useWindowDimensions,
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

type LineItem = { description: string; qty: string; unit_price: string };
type Quote = {
  id: number; client_name: string; type: string;
  status: string; total: number; created_at: string;
};

const QUOTE_STATUS: Record<string, { bg: string; color: string }> = {
  draft: { bg: "#F3F4F6", color: "#7A6A5A" },
  sent: { bg: "#DBEAFE", color: "#1D4ED8" },
  paid: { bg: "#D1FAE5", color: "#2D7A4F" },
  rejected: { bg: "#FEE2E2", color: "#DC2626" },
};

function StatusBadge({ status }: { status: string }) {
  const c = QUOTE_STATUS[status] || QUOTE_STATUS.draft;
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.color }]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
    </View>
  );
}

const emptyLine = (): LineItem => ({ description: "", qty: "1", unit_price: "" });

export default function Quotes() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [fetching, setFetching] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Builder state
  const [clientName, setClientName] = useState("");
  const [type, setType] = useState("Block Paving");
  const [lineItems, setLineItems] = useState<LineItem[]>([emptyLine()]);
  const [taxPercent, setTaxPercent] = useState("20");

  useEffect(() => {
    if (!loading && !user) router.replace("/admin");
  }, [user, loading]);

  const load = useCallback(async () => {
    try {
      const data = await api.get("/quotes");
      setQuotes(data || []);
    } catch {}
    setFetching(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const subtotal = lineItems.reduce((sum, li) => {
    return sum + (parseFloat(li.qty) || 0) * (parseFloat(li.unit_price) || 0);
  }, 0);
  const tax = subtotal * (parseFloat(taxPercent) || 0) / 100;
  const total = subtotal + tax;

  const resetForm = () => {
    setSelectedId(null);
    setClientName("");
    setType("Block Paving");
    setLineItems([emptyLine()]);
    setTaxPercent("20");
  };

  const saveQuote = async (status: "draft" | "sent") => {
    if (!clientName.trim()) {
      Alert.alert("Missing Info", "Please enter a client name.");
      return;
    }
    setSaving(true);
    const body = {
      client_name: clientName,
      type,
      status,
      line_items: lineItems.map((li) => ({
        description: li.description,
        qty: parseFloat(li.qty) || 1,
        unit_price: parseFloat(li.unit_price) || 0,
      })),
      tax_percent: parseFloat(taxPercent) || 0,
    };
    try {
      if (selectedId) {
        await api.put(`/quotes/${selectedId}`, body);
      } else {
        await api.post("/quotes", body);
      }
      await load();
      resetForm();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save quote.");
    }
    setSaving(false);
  };

  const deleteQuote = async (id: number) => {
    Alert.alert("Delete Quote", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await api.del(`/quotes/${id}`);
            setQuotes((prev) => prev.filter((q) => q.id !== id));
            if (selectedId === id) resetForm();
          } catch {}
        },
      },
    ]);
  };

  const setLine = (i: number, field: keyof LineItem, val: string) => {
    setLineItems((prev) => prev.map((li, idx) => idx === i ? { ...li, [field]: val } : li));
  };

  if (loading || fetching) {
    return <View style={styles.center}><ActivityIndicator size="large" color={P.copper} /></View>;
  }

  const QuoteList = (
    <View style={[styles.panel, isDesktop && styles.panelLeft]}>
      <Text style={styles.panelTitle}>Quotes ({quotes.length})</Text>
      <ScrollView>
        {quotes.length === 0 ? (
          <Text style={styles.emptyText}>No quotes yet.</Text>
        ) : (
          quotes.map((q) => (
            <TouchableOpacity
              key={q.id}
              style={[styles.quoteRow, selectedId === q.id && styles.quoteRowActive]}
              onPress={() => setSelectedId(q.id === selectedId ? null : q.id)}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.quoteClient}>{q.client_name}</Text>
                <Text style={styles.quoteType}>{q.type}</Text>
                <Text style={styles.quoteDate}>{new Date(q.created_at).toLocaleDateString("en-GB")}</Text>
              </View>
              <View style={{ alignItems: "flex-end", gap: 6 }}>
                <Text style={styles.quoteTotal}>£{q.total?.toFixed(2) ?? "0.00"}</Text>
                <StatusBadge status={q.status} />
                <TouchableOpacity onPress={() => deleteQuote(q.id)} activeOpacity={0.7}>
                  <Ionicons name="trash-outline" size={16} color={P.error} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      <TouchableOpacity style={styles.newBtn} onPress={resetForm} activeOpacity={0.8}>
        <Ionicons name="add-circle-outline" size={16} color="#FFFFFF" />
        <Text style={styles.newBtnText}>New Quote</Text>
      </TouchableOpacity>
    </View>
  );

  const Builder = (
    <ScrollView style={[styles.panel, isDesktop && styles.panelRight]} contentContainerStyle={styles.builderContent}>
      <Text style={styles.panelTitle}>{selectedId ? "Edit Quote" : "New Quote"}</Text>

      <Text style={styles.fieldLabel}>Client Name</Text>
      <TextInput
        style={styles.input} value={clientName} onChangeText={setClientName}
        placeholder="e.g. John Smith" placeholderTextColor={P.muted}
      />

      <Text style={styles.fieldLabel}>Project Type</Text>
      <TextInput
        style={styles.input} value={type} onChangeText={setType}
        placeholder="e.g. Block Paving" placeholderTextColor={P.muted}
      />

      <Text style={styles.fieldLabel}>Line Items</Text>
      {lineItems.map((li, i) => (
        <View key={i} style={styles.lineRow}>
          <TextInput
            style={[styles.input, styles.lineDesc]}
            value={li.description}
            onChangeText={(v) => setLine(i, "description", v)}
            placeholder="Description"
            placeholderTextColor={P.muted}
          />
          <TextInput
            style={[styles.input, styles.lineQty]}
            value={li.qty}
            onChangeText={(v) => setLine(i, "qty", v)}
            placeholder="Qty"
            placeholderTextColor={P.muted}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, styles.linePrice]}
            value={li.unit_price}
            onChangeText={(v) => setLine(i, "unit_price", v)}
            placeholder="£"
            placeholderTextColor={P.muted}
            keyboardType="numeric"
          />
          <TouchableOpacity
            onPress={() => setLineItems((prev) => prev.filter((_, idx) => idx !== i))}
            style={styles.removeLineBtn}
          >
            <Ionicons name="close-circle-outline" size={20} color={P.error} />
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity
        style={styles.addLineBtn}
        onPress={() => setLineItems((prev) => [...prev, emptyLine()])}
        activeOpacity={0.7}
      >
        <Ionicons name="add-outline" size={16} color={P.copper} />
        <Text style={styles.addLineBtnText}>Add Line Item</Text>
      </TouchableOpacity>

      <Text style={styles.fieldLabel}>Tax %</Text>
      <TextInput
        style={[styles.input, { width: 100 }]}
        value={taxPercent} onChangeText={setTaxPercent}
        keyboardType="numeric" placeholderTextColor={P.muted}
      />

      {/* Totals */}
      <View style={styles.totals}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>£{subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tax ({taxPercent}%)</Text>
          <Text style={styles.totalValue}>£{tax.toFixed(2)}</Text>
        </View>
        <View style={[styles.totalRow, styles.totalRowFinal]}>
          <Text style={styles.totalLabelFinal}>Total</Text>
          <Text style={styles.totalValueFinal}>£{total.toFixed(2)}</Text>
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.saveRow}>
        <TouchableOpacity
          style={[styles.saveBtn, styles.saveBtnDraft, saving && styles.btnDisabled]}
          onPress={() => saveQuote("draft")}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? <ActivityIndicator size="small" color={P.copper} /> : (
            <Text style={[styles.saveBtnText, { color: P.copper }]}>Save Draft</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, styles.saveBtnSend, saving && styles.btnDisabled]}
          onPress={() => saveQuote("sent")}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text style={[styles.saveBtnText, { color: "#FFFFFF" }]}>Send Quote</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <View style={[styles.root, !isDesktop && { flexDirection: "column" }]}>
      <AdminSidebar activeRoute="/admin/quotes" />
      <View style={styles.main}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Text style={styles.pageTitle}>Quotes Manager</Text>
          <View style={styles.topRight}>
            <Text style={styles.userName}>{user?.name}</Text>
            <TouchableOpacity onPress={async () => { await logout(); router.replace("/admin"); }} style={styles.iconBtn}>
              <Ionicons name="log-out-outline" size={20} color={P.muted} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.content, isDesktop && styles.contentDesktop]}>
          {QuoteList}
          {Builder}
        </View>
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
  content: { flex: 1, flexDirection: "column" },
  contentDesktop: { flexDirection: "row" },
  panel: { flex: 1, padding: 20, backgroundColor: "#F7F4F0" },
  panelLeft: { maxWidth: 360, borderRightWidth: 1, borderRightColor: P.border, backgroundColor: "#FAFAF8" },
  panelRight: { flex: 1 },
  panelTitle: { fontSize: 16, fontWeight: "700", color: P.ink, marginBottom: 14 },
  quoteRow: {
    flexDirection: "row", backgroundColor: "#FFFFFF", borderRadius: 10,
    padding: 14, marginBottom: 8, borderWidth: 1, borderColor: P.border,
  },
  quoteRowActive: { borderColor: P.copper, borderWidth: 2 },
  quoteClient: { fontSize: 14, fontWeight: "700", color: P.ink },
  quoteType: { fontSize: 12, color: P.muted, marginTop: 2 },
  quoteDate: { fontSize: 11, color: P.muted, marginTop: 4 },
  quoteTotal: { fontSize: 15, fontWeight: "700", color: P.ink },
  newBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: P.copper, borderRadius: 10, padding: 12,
    justifyContent: "center", marginTop: 12,
  },
  newBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  builderContent: { paddingBottom: 40 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: P.ink, marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1.5, borderColor: P.border, borderRadius: 8,
    paddingVertical: 10, paddingHorizontal: 12, fontSize: 14,
    color: P.ink, backgroundColor: "#FFFFFF", marginBottom: 4,
    outlineStyle: "none" as any,
  },
  lineRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  lineDesc: { flex: 3, marginBottom: 0 },
  lineQty: { flex: 1, marginBottom: 0 },
  linePrice: { flex: 1.5, marginBottom: 0 },
  removeLineBtn: { padding: 4 },
  addLineBtn: {
    flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4,
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8,
    borderWidth: 1.5, borderColor: P.copper, borderStyle: "dashed",
    alignSelf: "flex-start",
  },
  addLineBtnText: { color: P.copper, fontSize: 13, fontWeight: "600" },
  totals: {
    marginTop: 16, backgroundColor: "#FFFFFF", borderRadius: 10,
    borderWidth: 1, borderColor: P.border, padding: 14, gap: 8,
  },
  totalRow: { flexDirection: "row", justifyContent: "space-between" },
  totalRowFinal: {
    borderTopWidth: 1, borderTopColor: P.border, paddingTop: 8, marginTop: 4,
  },
  totalLabel: { fontSize: 13, color: P.muted },
  totalValue: { fontSize: 13, color: P.ink, fontWeight: "600" },
  totalLabelFinal: { fontSize: 15, fontWeight: "700", color: P.ink },
  totalValueFinal: { fontSize: 15, fontWeight: "800", color: P.copper },
  saveRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  saveBtn: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  saveBtnDraft: { backgroundColor: "#FFFFFF", borderWidth: 1.5, borderColor: P.copper },
  saveBtnSend: { backgroundColor: P.copper },
  saveBtnText: { fontSize: 14, fontWeight: "700" },
  btnDisabled: { opacity: 0.6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3 },
  emptyText: { color: P.muted, fontSize: 14, padding: 12 },
});
