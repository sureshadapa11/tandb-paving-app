import React from "react";
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { C, S, R, SHADOW } from "@/src/theme";

export function MaxWidth({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <View style={[styles.maxWidth, style]}>
      {children}
    </View>
  );
}

export function Logo({ size = 40, showText = true }: { size?: number; showText?: boolean }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <View style={[styles.logoCircle, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={[styles.logoMark, { fontSize: size * 0.34 }]}>T&B</Text>
      </View>
      {showText && (
        <View style={{ marginLeft: S.sm }}>
          <Text style={styles.logoName}>T&B PAVING</Text>
          <Text style={styles.logoSub}>DRIVEWAYS · PATIOS · PATHS</Text>
        </View>
      )}
    </View>
  );
}

export function Btn({ label, onPress, variant = "primary", icon, testID, disabled, loading, style, small }: any) {
  const isPrimary = variant === "primary";
  const isDark = variant === "dark";
  const bg = disabled ? C.surfaceAlt : isPrimary ? C.brandDark : isDark ? C.ink : C.surface;
  const fg = isPrimary || isDark ? C.onBrand : C.ink;
  const border = variant === "outline" ? C.ink : "transparent";
  return (
    <Pressable
      testID={testID}
      disabled={disabled || loading}
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); onPress?.(); }}
      style={({ pressed }) => [
        styles.btn,
        small && { minHeight: 44, paddingHorizontal: S.md },
        { backgroundColor: bg, borderColor: border, borderWidth: variant === "outline" ? 2 : 0, opacity: pressed ? 0.9 : 1 },
        isPrimary && SHADOW.card,
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : (
        <View style={styles.row}>
          {icon && <Ionicons name={icon} size={18} color={fg} style={{ marginRight: 8 }} />}
          <Text style={[styles.btnText, small && { fontSize: 13 }, { color: fg }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function Field({ label, testID, style, ...props }: any) {
  return (
    <View style={[{ marginBottom: S.md }, style]}>
      {label && <Text style={styles.fieldLabel}>{label}</Text>}
      <TextInput testID={testID} placeholderTextColor={C.muted} style={styles.input} {...props} />
    </View>
  );
}

export function Eyebrow({ children }: { children: string }) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

export function SectionTitle({ children, light }: { children: string; light?: boolean }) {
  return <Text style={[styles.sectionTitle, light && { color: C.surface }]}>{children}</Text>;
}

export function Stars({ n = 5, size = 14 }: { n?: number; size?: number }) {
  return (
    <View style={{ flexDirection: "row" }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Ionicons key={i} name={i < n ? "star" : "star-outline"} size={size} color={C.gold} style={{ marginRight: 1 }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  maxWidth: { maxWidth: 1200, width: "100%", alignSelf: "center" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  logoCircle: { backgroundColor: C.brand, alignItems: "center", justifyContent: "center" },
  logoMark: { color: C.onBrand, fontWeight: "900", letterSpacing: -0.5 },
  logoName: { fontSize: 14, fontWeight: "900", color: C.ink, letterSpacing: 0.5 },
  logoSub: { fontSize: 8, fontWeight: "700", color: C.muted, letterSpacing: 1 },
  btn: { minHeight: 54, paddingHorizontal: S.xl, borderRadius: R.pill, alignItems: "center", justifyContent: "center" },
  btnText: { fontSize: 15, fontWeight: "800", letterSpacing: 0.3 },
  fieldLabel: { fontSize: 12, fontWeight: "700", color: C.inkSoft, marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: C.border, borderRadius: R.md, paddingHorizontal: S.md, paddingVertical: 14, fontSize: 15, color: C.ink, backgroundColor: C.surface },
  eyebrow: { fontSize: 12, fontWeight: "800", letterSpacing: 2, color: C.brand, marginBottom: 6, textTransform: "uppercase" },
  sectionTitle: { fontSize: 26, fontWeight: "900", color: C.ink, letterSpacing: -0.5, lineHeight: 30 },
});
