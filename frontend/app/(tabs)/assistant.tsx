import React, { useCallback, useRef, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/src/api";
import { C, S, F } from "@/src/theme";
import { Btn, Field } from "@/src/components/ui";
import { Sheet } from "@/src/components/Sheet";

const SESSION = "main";
const SUGGESTIONS = [
  "How much concrete for a 20x30 ft slab?",
  "Safety checklist for excavation work",
  "Estimate cost to build a 2-car garage",
  "Steps to pour a foundation",
];

export default function Assistant() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const [estOpen, setEstOpen] = useState(false);
  const [estForm, setEstForm] = useState<any>({ description: "", area: "", quality: "standard", location: "" });
  const [estLoading, setEstLoading] = useState(false);
  const [estResult, setEstResult] = useState("");

  const load = useCallback(async () => {
    try { setMessages(await api.get(`/ai/history?session_id=${SESSION}`)); } catch {}
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || sending) return;
    setInput("");
    setMessages((p) => [...p, { role: "user", content: msg, id: Date.now().toString() }]);
    setSending(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    try {
      const res = await api.post("/ai/chat", { session_id: SESSION, message: msg });
      setMessages((p) => [...p, { role: "assistant", content: res.reply, id: Date.now().toString() + "a" }]);
    } catch {
      setMessages((p) => [...p, { role: "assistant", content: "⚠ AI ERROR — please try again.", id: Date.now().toString() + "e" }]);
    } finally {
      setSending(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const genEstimate = async () => {
    if (!estForm.description) return;
    setEstLoading(true); setEstResult("");
    try {
      const res = await api.post("/ai/estimate", estForm);
      setEstResult(res.estimate);
    } catch {
      setEstResult("⚠ AI ERROR — please try again.");
    } finally { setEstLoading(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + S.md }]}>
        <View>
          <Text style={styles.title}>BUILDPRO AI</Text>
          <Text style={styles.sub}>CONSTRUCTION ASSISTANT</Text>
        </View>
        <Pressable testID="estimate-btn" onPress={() => { setEstResult(""); setEstOpen(true); }} style={styles.estBtn}>
          <Ionicons name="calculator" size={18} color={C.onBrand} />
          <Text style={styles.estBtnText}>ESTIMATE</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
        <ScrollView ref={scrollRef} contentContainerStyle={{ padding: S.lg, paddingBottom: S.xl }} testID="chat-scroll">
          {messages.length === 0 ? (
            <View style={{ marginTop: S.lg }}>
              <Text style={styles.promptHint}>ASK ANYTHING ABOUT YOUR BUILD</Text>
              {SUGGESTIONS.map((s) => (
                <Pressable key={s} testID="suggestion" style={styles.suggestion} onPress={() => send(s)}>
                  <Text style={styles.suggestionText}>{s}</Text>
                  <Ionicons name="arrow-forward" size={16} color={C.onSurface} />
                </Pressable>
              ))}
            </View>
          ) : (
            messages.map((m) => (
              <View key={m.id} style={[styles.msg, m.role === "user" ? styles.msgUser : styles.msgAi]}>
                <Text style={styles.msgRole}>{m.role === "user" ? "YOU" : "BUILDPRO AI"}</Text>
                <Text style={[styles.msgText, m.role === "user" && { color: C.onSurfaceInverse }]}>{m.content}</Text>
              </View>
            ))
          )}
          {sending && (
            <View style={[styles.msg, styles.msgAi]}>
              <Text style={styles.msgRole}>BUILDPRO AI</Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <ActivityIndicator size="small" color={C.brand} />
                <Text style={[styles.msgText, { marginLeft: 8 }]}>PROCESSING...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={[styles.inputBar, { paddingBottom: insets.bottom || S.sm }]}>
          <TextInput
            testID="chat-input" style={styles.chatInput} value={input} onChangeText={setInput}
            placeholder="Type a message..." placeholderTextColor={C.muted} multiline
          />
          <Pressable testID="send-btn" onPress={() => send()} style={styles.sendBtn} disabled={sending}>
            <Ionicons name="arrow-up" size={22} color={C.onBrand} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Sheet visible={estOpen} onClose={() => setEstOpen(false)} title="AI COST ESTIMATE" testID="estimate-sheet">
        <Field label="What are you building?" testID="ef-desc" value={estForm.description} onChangeText={(t: string) => setEstForm({ ...estForm, description: t })} placeholder="Single-story 3BR house" />
        <Field label="Area / Size" testID="ef-area" value={estForm.area} onChangeText={(t: string) => setEstForm({ ...estForm, area: t })} placeholder="1800 sq ft" />
        <Field label="Location" testID="ef-loc" value={estForm.location} onChangeText={(t: string) => setEstForm({ ...estForm, location: t })} placeholder="Austin, TX" />
        <Text style={styles.qLabel}>QUALITY</Text>
        <View style={styles.qRow}>
          {["economy", "standard", "premium"].map((q) => (
            <Pressable key={q} testID={`quality-${q}`} style={[styles.qBtn, estForm.quality === q && styles.qActive]} onPress={() => setEstForm({ ...estForm, quality: q })}>
              <Text style={[styles.qText, estForm.quality === q && styles.qTextActive]}>{q.toUpperCase()}</Text>
            </Pressable>
          ))}
        </View>
        <Btn testID="ef-generate" label="Generate Estimate" onPress={genEstimate} loading={estLoading} />
        {!!estResult && (
          <View style={styles.estResult} testID="estimate-result">
            <Text style={styles.estResultText}>{estResult}</Text>
          </View>
        )}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: S.lg, paddingBottom: S.md, borderBottomWidth: 2, borderColor: C.borderStrong },
  title: { ...F.display, fontSize: 26, color: C.onSurface },
  sub: { fontSize: 10, fontWeight: "800", letterSpacing: 1.5, color: C.muted },
  estBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.brand, paddingHorizontal: S.md, paddingVertical: 10, borderWidth: 2, borderColor: C.borderStrong },
  estBtnText: { fontWeight: "800", letterSpacing: 0.5, color: C.onBrand, fontSize: 12 },
  promptHint: { ...F.heavy, fontSize: 13, letterSpacing: 1, color: C.muted, marginBottom: S.md },
  suggestion: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 2, borderColor: C.borderStrong, padding: S.md, marginBottom: S.sm },
  suggestionText: { flex: 1, fontSize: 14, fontWeight: "600", color: C.onSurface, marginRight: S.sm },
  msg: { padding: S.md, marginBottom: S.md, borderWidth: 2, borderColor: C.borderStrong },
  msgUser: { backgroundColor: C.onSurface, marginLeft: S.xl },
  msgAi: { backgroundColor: C.surface, marginRight: S.xl },
  msgRole: { fontSize: 10, fontWeight: "800", letterSpacing: 1, color: C.brand, marginBottom: 4 },
  msgText: { fontSize: 14, lineHeight: 21, color: C.onSurface },
  inputBar: { flexDirection: "row", alignItems: "flex-end", gap: S.sm, padding: S.sm, paddingHorizontal: S.md, borderTopWidth: 2, borderColor: C.borderStrong, backgroundColor: C.surface },
  chatInput: { flex: 1, borderWidth: 2, borderColor: C.borderStrong, paddingHorizontal: S.md, paddingVertical: 10, maxHeight: 100, fontSize: 15, color: C.onSurface },
  sendBtn: { width: 48, height: 48, backgroundColor: C.brand, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: C.borderStrong },
  qLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 1, color: C.onSurface, marginBottom: 6 },
  qRow: { flexDirection: "row", gap: S.sm, marginBottom: S.md },
  qBtn: { flex: 1, paddingVertical: 12, alignItems: "center", borderWidth: 2, borderColor: C.borderStrong },
  qActive: { backgroundColor: C.brand },
  qText: { fontWeight: "800", fontSize: 11, color: C.onSurface },
  qTextActive: { color: C.onBrand },
  estResult: { marginTop: S.lg, borderWidth: 2, borderColor: C.borderStrong, backgroundColor: C.surfaceSecondary, padding: S.md },
  estResultText: { fontSize: 13, lineHeight: 20, color: C.onSurface, fontFamily: "monospace" },
});
