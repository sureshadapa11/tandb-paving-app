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
type QuoteLineItem = { description: string; qty: number; unit_price: number; amount: number };
type Quote = {
  id: number; client_name: string; client_email?: string; project_type: string;
  status: string; total: number; subtotal?: number; tax?: number; tax_percent?: number;
  created_at: string; line_items?: QuoteLineItem[];
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
  const [loadError, setLoadError] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [patchingId, setPatchingId] = useState<number | null>(null);

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [projectType, setProjectType] = useState("Block Paving");
  const [lineItems, setLineItems] = useState<LineItem[]>([emptyLine()]);
  const [taxPercent, setTaxPercent] = useState("20");

  useEffect(() => {
    if (!loading && !user) router.replace("/admin");
  }, [user, loading]);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const data = await api.get("/quotes");
      setQuotes(data || []);
    } catch {
      setLoadError(true);
    }
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
    setClientEmail("");
    setProjectType("Block Paving");
    setLineItems([emptyLine()]);
    setTaxPercent("20");
  };

  const loadQuoteIntoForm = (q: Quote) => {
    setSelectedId(q.id);
    setClientName(q.client_name);
    setClientEmail(q.client_email || "");
    setProjectType(q.project_type || "");
    if (q.line_items && q.line_items.length > 0) {
      setLineItems(q.line_items.map(li => ({
        description: li.description,
        qty: String(li.qty),
        unit_price: String(li.unit_price),
      })));
    } else {
      setLineItems([emptyLine()]);
    }
    setTaxPercent(String(q.tax_percent ?? 20));
  };

  const printQuote = (q: Quote) => {
    const rows = (q.line_items || []).map(li =>
      `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #eee">${li.description}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:center">${li.qty}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right">£${li.unit_price.toFixed(2)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right">£${li.amount.toFixed(2)}</td>
      </tr>`
    ).join("");
    const taxRow = q.tax_percent
      ? `<tr><td colspan="3" style="padding:10px 12px;color:#888;text-align:right">VAT (${q.tax_percent}%)</td><td style="padding:10px 12px;text-align:right;color:#888">£${(q.tax ?? 0).toFixed(2)}</td></tr>`
      : "";
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>
      <title>Quote — ${q.client_name}</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:Georgia,serif;color:#1A2A3A;padding:48px 56px;max-width:800px;margin:0 auto}
        .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:24px;border-bottom:3px solid #B5651D;margin-bottom:32px}
        .biz-name{font-size:26px;font-weight:700;color:#1A2A3A;letter-spacing:-0.5px}
        .biz-contact{font-size:12px;color:#7A6A5A;margin-top:4px;line-height:1.6}
        .quote-meta{text-align:right}
        .quote-label{font-size:28px;font-weight:700;color:#B5651D;text-transform:uppercase;letter-spacing:2px}
        .quote-date{font-size:12px;color:#7A6A5A;margin-top:4px}
        .client-block{margin-bottom:32px}
        .client-block h3{font-size:11px;font-weight:700;letter-spacing:1.5px;color:#7A6A5A;text-transform:uppercase;margin-bottom:6px}
        .client-block p{font-size:15px;color:#1A2A3A;font-weight:600}
        .client-block span{font-size:13px;color:#7A6A5A}
        table{width:100%;border-collapse:collapse;margin-bottom:24px}
        thead th{background:#1A2A3A;color:#fff;padding:10px 12px;text-align:left;font-size:12px;font-weight:700;letter-spacing:0.5px}
        thead th:last-child,thead th:nth-child(3){text-align:right}
        thead th:nth-child(2){text-align:center}
        tfoot td{padding:10px 12px;font-weight:700}
        .total-final{background:#B5651D;color:#fff;font-size:16px}
        .footer{margin-top:48px;padding-top:16px;border-top:1px solid #eee;font-size:11px;color:#aaa;text-align:center;line-height:1.8}
        @media print{body{padding:32px 40px}button{display:none}}
      </style>
    </head><body>
      <div class="header">
        <div>
          <div class="biz-name">T&amp;B Paving</div>
          <div class="biz-contact">01376 618683 &nbsp;|&nbsp; 07503 111803<br/>bbirdpaving@gmail.com<br/>Essex &amp; Suffolk</div>
        </div>
        <div class="quote-meta">
          <div class="quote-label">Quotation</div>
          <div class="quote-date">${new Date(q.created_at).toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" })}</div>
        </div>
      </div>
      <div class="client-block">
        <h3>Prepared for</h3>
        <p>${q.client_name}</p>
        ${q.client_email ? `<span>${q.client_email}</span>` : ""}
        <p style="margin-top:4px;font-size:13px;color:#7A6A5A">${q.project_type}</p>
      </div>
      <table>
        <thead><tr>
          <th>Description</th><th style="text-align:center">Qty</th>
          <th style="text-align:right">Unit Price</th><th style="text-align:right">Amount</th>
        </tr></thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr><td colspan="3" style="text-align:right;color:#7A6A5A">Subtotal</td><td style="text-align:right">£${(q.subtotal ?? 0).toFixed(2)}</td></tr>
          ${taxRow}
          <tr class="total-final"><td colspan="3" style="text-align:right">Total</td><td style="text-align:right">£${q.total.toFixed(2)}</td></tr>
        </tfoot>
      </table>
      <div class="footer">
        T&amp;B Paving · Essex &amp; Suffolk · 10-year workmanship guarantee · Free site survey included<br/>
        This quote is valid for 30 days from the date above.
      </div>
    </body></html>`;

    const win = (globalThis as any).window?.open("", "_blank", "width=860,height=700");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  const saveQuote = async (status: "draft" | "sent") => {
    if (!clientName.trim()) {
      Alert.alert("Missing Info", "Please enter a client name.");
      return;
    }
    if (lineItems.length === 0) {
      Alert.alert("Missing Info", "Please add at least one line item.");
      return;
    }
    setSaving(true);
    const body = {
      client_name: clientName,
      client_email: clientEmail,
      project_type: projectType,
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
      Alert.alert(
        "Saved",
        status === "sent"
          ? clientEmail.trim()
            ? `Quote sent. Email delivered to ${clientEmail.trim()}.`
            : "Quote marked as sent. No email sent (no client email provided)."
          : "Draft saved."
      );
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save quote.");
    }
    setSaving(false);
  };

  const patchStatus = async (q: Quote, status: string) => {
    const prev = q.status;
    setPatchingId(q.id);
    setQuotes((list) => list.map((x) => x.id === q.id ? { ...x, status } : x));
    try {
      await api.patch(`/quotes/${q.id}/status?status=${status}`);
    } catch {
      setQuotes((list) => list.map((x) => x.id === q.id ? { ...x, status: prev } : x));
      Alert.alert("Error", "Could not update status.");
    }
    setPatchingId(null);
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
          } catch {
            Alert.alert("Error", "Could not delete quote.");
          }
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

      {loadError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>Failed to load quotes. </Text>
          <TouchableOpacity onPress={load}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
        </View>
      )}

      {quotes.length === 0 && !loadError ? (
        <Text style={styles.emptyText}>No quotes yet. Use the form to create one.</Text>
      ) : (
        quotes.map((q) => (
          <TouchableOpacity
            key={q.id}
            style={[styles.quoteRow, selectedId === q.id && styles.quoteRowActive]}
            onPress={() => selectedId === q.id ? resetForm() : loadQuoteIntoForm(q)}
            activeOpacity={0.7}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.quoteClient}>{q.client_name}</Text>
              <Text style={styles.quoteType}>{q.project_type}</Text>
              <Text style={styles.quoteDate}>{new Date(q.created_at).toLocaleDateString("en-GB")}</Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 6 }}>
              <Text style={styles.quoteTotal}>£{q.total?.toFixed(2) ?? "0.00"}</Text>
              {patchingId === q.id ? (
                <ActivityIndicator size="small" color={P.copper} />
              ) : (
                <View style={{ flexDirection: "row", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {(["draft", "sent", "paid", "rejected"] as const).map((s) => (
                    <TouchableOpacity
                      key={s}
                      onPress={() => q.status !== s && patchStatus(q, s)}
                      activeOpacity={0.7}
                      style={[
                        styles.statusPill,
                        q.status === s && { backgroundColor: QUOTE_STATUS[s].color, borderColor: QUOTE_STATUS[s].color },
                      ]}
                    >
                      <Text style={[styles.statusPillText, q.status === s && { color: "#fff" }]}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity onPress={() => printQuote(q)} activeOpacity={0.7}>
                  <Ionicons name="print-outline" size={16} color={P.copper} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteQuote(q.id)} activeOpacity={0.7}>
                  <Ionicons name="trash-outline" size={16} color={P.error} />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  const Builder = (
    <ScrollView style={[styles.panel, styles.panelRight]} contentContainerStyle={styles.builderContent}>
      <View style={styles.builderHeader}>
        <Text style={styles.panelTitle}>{selectedId ? "Edit Quote" : "New Quote"}</Text>
        {selectedId ? (
          <TouchableOpacity onPress={resetForm} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>+ New</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={styles.fieldLabel}>Client Name *</Text>
      <TextInput
        style={styles.input} value={clientName} onChangeText={setClientName}
        placeholder="e.g. John Smith" placeholderTextColor={P.muted}
      />

      <Text style={styles.fieldLabel}>Client Email</Text>
      <TextInput
        style={styles.input} value={clientEmail} onChangeText={setClientEmail}
        placeholder="e.g. john@example.com (optional — for quote delivery)"
        placeholderTextColor={P.muted}
        keyboardType="email-address" autoCapitalize="none"
      />

      <Text style={styles.fieldLabel}>Project Type</Text>
      <TextInput
        style={styles.input} value={projectType} onChangeText={setProjectType}
        placeholder="e.g. Block Paving Driveway" placeholderTextColor={P.muted}
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
          {lineItems.length > 1 && (
            <TouchableOpacity
              onPress={() => setLineItems((prev) => prev.filter((_, idx) => idx !== i))}
              style={styles.removeLineBtn}
            >
              <Ionicons name="close-circle-outline" size={20} color={P.error} />
            </TouchableOpacity>
          )}
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

      <View style={styles.totals}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>£{subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tax ({taxPercent || 0}%)</Text>
          <Text style={styles.totalValue}>£{tax.toFixed(2)}</Text>
        </View>
        <View style={[styles.totalRow, styles.totalRowFinal]}>
          <Text style={styles.totalLabelFinal}>Total</Text>
          <Text style={styles.totalValueFinal}>£{total.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.saveRow}>
        <TouchableOpacity
          style={[styles.saveBtn, styles.saveBtnDraft, saving && styles.btnDisabled]}
          onPress={() => saveQuote("draft")}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator size="small" color={P.copper} />
          ) : (
            <Text style={[styles.saveBtnText, { color: P.copper }]}>Save Draft</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, styles.saveBtnSend, saving && styles.btnDisabled]}
          onPress={() => saveQuote("sent")}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={[styles.saveBtnText, { color: "#FFFFFF" }]}>Send Quote</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <View style={[styles.root, !isDesktop && { flexDirection: "column" }]}>
      <AdminSidebar activeRoute="/admin/quotes" />
      <View style={styles.main}>
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
  content: { flex: 1, flexDirection: "column", overflow: "hidden" as any },
  contentDesktop: { flexDirection: "row" },
  panel: { padding: 20, backgroundColor: "#F7F4F0" },
  panelLeft: { maxWidth: 360, borderRightWidth: 1, borderRightColor: P.border, backgroundColor: "#FAFAF8", flex: 1 },
  panelRight: { flex: 1 },
  panelTitle: { fontSize: 16, fontWeight: "700", color: P.ink, marginBottom: 14 },
  builderHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  clearBtn: {
    paddingVertical: 5, paddingHorizontal: 12, borderRadius: 20,
    backgroundColor: P.copper,
  },
  clearBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  errorBanner: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FEF2F2",
    borderRadius: 8, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: "#FECACA",
  },
  errorBannerText: { fontSize: 13, color: P.error },
  retryText: { fontSize: 13, color: P.copper, fontWeight: "700" },
  quoteRow: {
    flexDirection: "row", backgroundColor: "#FFFFFF", borderRadius: 10,
    padding: 14, marginBottom: 8, borderWidth: 1, borderColor: P.border,
  },
  quoteRowActive: { borderColor: P.copper, borderWidth: 2 },
  quoteClient: { fontSize: 14, fontWeight: "700", color: P.ink },
  quoteType: { fontSize: 12, color: P.muted, marginTop: 2 },
  quoteDate: { fontSize: 11, color: P.muted, marginTop: 4 },
  quoteTotal: { fontSize: 15, fontWeight: "700", color: P.ink },
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
  totalRowFinal: { borderTopWidth: 1, borderTopColor: P.border, paddingTop: 8, marginTop: 4 },
  totalLabel: { fontSize: 13, color: P.muted },
  totalValue: { fontSize: 13, color: P.ink, fontWeight: "600" },
  totalLabelFinal: { fontSize: 15, fontWeight: "700", color: P.ink },
  totalValueFinal: { fontSize: 15, fontWeight: "800", color: P.copper },
  saveRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  saveBtn: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: "center", justifyContent: "center" },
  saveBtnDraft: { backgroundColor: "#FFFFFF", borderWidth: 1.5, borderColor: P.copper },
  saveBtnSend: { backgroundColor: P.copper },
  saveBtnText: { fontSize: 14, fontWeight: "700" },
  btnDisabled: { opacity: 0.6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3 },
  statusPill: {
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 12,
    borderWidth: 1, borderColor: P.border, backgroundColor: "#F7F4F0",
  },
  statusPillText: { fontSize: 10, fontWeight: "700", color: P.muted },
  emptyText: { color: P.muted, fontSize: 14, padding: 12 },
});
