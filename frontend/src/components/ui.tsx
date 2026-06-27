import React from "react";
import {
  View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator, ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { C, S, F } from "@/src/theme";

export function Btn({ label, onPress, variant = "primary", icon, testID, disabled, loading, style }: any) {
  const bg = disabled ? C.surfaceTertiary : variant === "primary" ? C.brand : variant === "dark" ? C.onSurface : C.surface;
  const fg = variant === "outline" ? C.onSurface : variant === "dark" ? C.onSurfaceInverse : C.onBrand;
  return (
    <Pressable
      testID={testID}
      disabled={disabled || loading}
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); onPress?.(); }}
      style={[styles.btn, { backgroundColor: bg, borderColor: C.borderStrong }, style]}
    >
      {loading ? <ActivityIndicator color={fg} /> : (
        <View style={styles.row}>
          {icon && <Ionicons name={icon} size={18} color={fg} style={{ marginRight: 8 }} />}
          <Text style={[styles.btnText, { color: fg }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function Field({ label, testID, ...props }: any) {
  return (
    <View style={{ marginBottom: S.md }}>
      {label && <Text style={styles.fieldLabel}>{label}</Text>}
      <TextInput
        testID={testID}
        placeholderTextColor={C.muted}
        style={styles.input}
        {...props}
      />
    </View>
  );
}

export function Chip({ label, active, onPress, testID }: any) {
  return (
    <Pressable testID={testID} onPress={onPress} style={[styles.chip, { backgroundColor: active ? C.onSurface : C.surface }]}>
      <Text style={[styles.chipText, { color: active ? C.onSurfaceInverse : C.onSurface }]}>{label.toUpperCase()}</Text>
    </Pressable>
  );
}

export function Tag({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.tag, { borderColor: color }]}>
      <Text style={[styles.tagText, { color }]}>{label.toUpperCase().replace("_", " ")}</Text>
    </View>
  );
}

export function EmptyState({ icon, title, subtitle, testID }: any) {
  return (
    <View style={styles.empty} testID={testID}>
      <Ionicons name={icon || "cube-outline"} size={48} color={C.onSurface} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySub}>{subtitle}</Text>}
    </View>
  );
}

export function Card({ children, style, ...rest }: { children: React.ReactNode; style?: ViewStyle } & any) {
  return <View style={[styles.card, style]} {...rest}>{children}</View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  btn: { minHeight: 54, paddingHorizontal: S.lg, alignItems: "center", justifyContent: "center", borderWidth: 2 },
  btnText: { fontSize: 15, fontWeight: "800", letterSpacing: 0.5, textTransform: "uppercase" },
  fieldLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase", color: C.onSurface, marginBottom: 6 },
  input: { borderWidth: 2, borderColor: C.borderStrong, paddingHorizontal: S.md, paddingVertical: 14, fontSize: 15, color: C.onSurface, backgroundColor: C.surface },
  chip: { height: 36, paddingHorizontal: S.md, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: C.borderStrong, flexShrink: 0 },
  chipText: { fontSize: 12, fontWeight: "800", letterSpacing: 0.5 },
  tag: { borderWidth: 2, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: S["3xl"], paddingHorizontal: S.xl },
  emptyTitle: { ...F.heavy, fontSize: 18, color: C.onSurface, marginTop: S.md, letterSpacing: 0.5, textTransform: "uppercase" },
  emptySub: { fontSize: 13, color: C.muted, marginTop: 6, textAlign: "center" },
  card: { borderWidth: 2, borderColor: C.borderStrong, backgroundColor: C.surface, padding: S.lg },
});
