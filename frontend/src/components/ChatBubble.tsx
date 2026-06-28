import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Animated, Platform, ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, R, SHADOW } from "@/src/theme";

const BACKEND = process.env.EXPO_PUBLIC_BACKEND_URL ?? "";

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "How much does a driveway cost?",
  "What areas do you cover?",
  "How long does resin take?",
  "Do you offer a guarantee?",
];

export default function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: open ? 1 : 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start();
  }, [open]);

  // Close on click outside (web only)
  useEffect(() => {
    if (!open || Platform.OS !== "web") return;
    const doc = (globalThis as any).document;
    if (!doc) return;
    const close = (e: MouseEvent) => {
      // If the click is inside the chat widget, do nothing
      if ((e.target as Element)?.closest?.("[data-chat-widget]")) return;
      setOpen(false);
    };
    const t = setTimeout(() => doc.addEventListener("click", close), 50);
    return () => { clearTimeout(t); doc.removeEventListener("click", close); };
  }, [open]);

  useEffect(() => {
    if (open && messages.length === 0 && !started) {
      setStarted(true);
      setMessages([{
        role: "assistant",
        content: "Hi! I'm the T&B Paving assistant 👋\n\nAsk me anything about driveways, patios, costs, or our services in Essex & Suffolk.",
      }]);
    }
  }, [open]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    // snapshot history BEFORE adding the new message to avoid sending it twice
    const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
    setMessages(prev => [...prev, { role: "user", content: msg }]);
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/ai/public-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server error ${res.status}`);
      }
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply || "Sorry, I couldn't get a response. Please call us on 01376 618683." }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong. Please call us on 01376 618683." }]);
    }
    setLoading(false);
  };

  const panelTranslate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });
  const panelOpacity = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  const hasSuggestions = messages.length <= 1;

  return (
    <View style={styles.container} pointerEvents="box-none" {...(Platform.OS === "web" ? { "data-chat-widget": "true" } as any : {})}>
      {/* Chat panel */}
      {open && (
        <Animated.View
          style={[
            styles.panel,
            { transform: [{ translateY: panelTranslate }], opacity: panelOpacity },
          ]}
        >
          {/* Panel header */}
          <View style={styles.panelHeader}>
            <View style={styles.panelHeaderLeft}>
              <View style={styles.avatar}>
                <Ionicons name="sparkles" size={14} color="#fff" />
              </View>
              <View>
                <Text style={styles.panelTitle}>T&B Paving Assistant</Text>
                <View style={styles.onlineRow}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.onlineText}>AI-powered · instant replies</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={() => setOpen(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={C.muted} />
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollRef}
            style={styles.messages}
            contentContainerStyle={{ padding: S.md, gap: S.sm }}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((m, i) => (
              <View key={i} style={[styles.bubble, m.role === "user" ? styles.userBubble : styles.aiBubble]}>
                <Text style={[styles.bubbleText, m.role === "user" ? styles.userText : styles.aiText]}>
                  {m.content}
                </Text>
              </View>
            ))}
            {loading && (
              <View style={[styles.bubble, styles.aiBubble, styles.typingBubble]}>
                <ActivityIndicator size="small" color={C.brand} />
              </View>
            )}

            {/* Quick suggestions */}
            {hasSuggestions && !loading && (
              <View style={styles.suggestions}>
                {SUGGESTIONS.map((s) => (
                  <TouchableOpacity key={s} style={styles.suggestion} onPress={() => send(s)} activeOpacity={0.75}>
                    <Text style={styles.suggestionText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Input */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask anything…"
              placeholderTextColor={C.muted}
              onSubmitEditing={() => send()}
              returnKeyType="send"
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
              onPress={() => send()}
              disabled={!input.trim() || loading}
              activeOpacity={0.8}
            >
              <Ionicons name="send" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Floating button */}
      <TouchableOpacity
        style={[styles.fab, open && styles.fabOpen]}
        onPress={() => setOpen(o => !o)}
        activeOpacity={0.85}
      >
        <Ionicons name={open ? "close" : "chatbubble-ellipses"} size={24} color="#fff" />
        {!open && (
          <View style={styles.fabBadge}>
            <Ionicons name="sparkles" size={9} color={C.brand} />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const PANEL_W = 340;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 24,
    right: 20,
    alignItems: "flex-end",
    zIndex: 999,
  },
  panel: {
    width: PANEL_W,
    height: 460,
    backgroundColor: C.surface,
    borderRadius: R.xl,
    marginBottom: S.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.border,
    ...SHADOW.card,
    ...(Platform.OS === "web" ? { boxShadow: "0 8px 32px rgba(30,27,24,0.18)" } as any : {}),
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: S.md,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.surface,
  },
  panelHeaderLeft: { flexDirection: "row", alignItems: "center", gap: S.sm },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.brandDark,
    alignItems: "center", justifyContent: "center",
  },
  panelTitle: { fontSize: 14, fontWeight: "800", color: C.ink },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#22C55E" },
  onlineText: { fontSize: 11, color: C.muted },
  closeBtn: { padding: S.xs },
  messages: { flex: 1 },
  bubble: {
    maxWidth: "85%",
    padding: S.sm,
    borderRadius: R.lg,
    marginBottom: 2,
  },
  aiBubble: {
    backgroundColor: C.surfaceAlt,
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: C.brandDark,
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  bubbleText: { fontSize: 13, lineHeight: 19 },
  aiText: { color: C.ink },
  userText: { color: "#fff" },
  typingBubble: { paddingVertical: S.sm, paddingHorizontal: S.md },
  suggestions: { gap: S.xs, marginTop: S.sm },
  suggestion: {
    backgroundColor: C.accentSoft,
    borderRadius: R.pill,
    paddingVertical: S.xs,
    paddingHorizontal: S.sm,
    borderWidth: 1,
    borderColor: C.accent,
    alignSelf: "flex-start",
  },
  suggestionText: { fontSize: 12, color: C.brandDark, fontWeight: "600" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: S.sm,
    gap: S.xs,
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.surface,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: C.ink,
    paddingVertical: S.xs,
    paddingHorizontal: S.sm,
    backgroundColor: C.surfaceAlt,
    borderRadius: R.pill,
    outlineStyle: "none" as any,
    minHeight: 36,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.brandDark,
    alignItems: "center", justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.4 },
  fab: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: C.brandDark,
    alignItems: "center", justifyContent: "center",
    ...SHADOW.card,
    ...(Platform.OS === "web" ? { boxShadow: "0 4px 16px rgba(212,87,0,0.4)" } as any : {}),
  },
  fabOpen: { backgroundColor: C.inkSoft },
  fabBadge: {
    position: "absolute", top: 6, right: 6,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: C.accentSoft,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: C.brandDark,
  },
});
