import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/context/AuthContext";
import { Btn, Field } from "@/src/components/ui";
import { C, S, F } from "@/src/theme";

export default function Auth() {
  const { login, register } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState("contractor");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    if (!email || !password || (mode === "register" && !name)) {
      setError("Please fill all required fields");
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") await login(email.trim(), password);
      else await register(name.trim(), email.trim(), password, role);
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.surface }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + S.xl, paddingBottom: S["3xl"], paddingHorizontal: S.xl }} keyboardShouldPersistTaps="handled">
        <View style={styles.logoBox}>
          <Ionicons name="construct" size={32} color={C.onBrand} />
        </View>
        <Text style={styles.brand}>BUILDPRO</Text>
        <Text style={styles.tagline}>CONSTRUCTION COMMAND CENTER</Text>

        <View style={styles.toggle}>
          <Pressable testID="tab-login" style={[styles.toggleBtn, mode === "login" && styles.toggleActive]} onPress={() => setMode("login")}>
            <Text style={[styles.toggleText, mode === "login" && styles.toggleTextActive]}>LOG IN</Text>
          </Pressable>
          <Pressable testID="tab-register" style={[styles.toggleBtn, mode === "register" && styles.toggleActive]} onPress={() => setMode("register")}>
            <Text style={[styles.toggleText, mode === "register" && styles.toggleTextActive]}>SIGN UP</Text>
          </Pressable>
        </View>

        {mode === "register" && (
          <>
            <Field label="Full Name" testID="input-name" value={name} onChangeText={setName} placeholder="John Builder" />
            <Text style={styles.fieldLabel}>I AM A</Text>
            <View style={styles.roleRow}>
              {["contractor", "client"].map((r) => (
                <Pressable key={r} testID={`role-${r}`} style={[styles.roleBtn, role === r && styles.roleActive]} onPress={() => setRole(r)}>
                  <Text style={[styles.roleText, role === r && styles.roleTextActive]}>{r.toUpperCase()}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
        <Field label="Email" testID="input-email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@company.com" />
        <Field label="Password" testID="input-password" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />

        {!!error && <Text testID="auth-error" style={styles.error}>{error}</Text>}

        <Btn testID="auth-submit" label={mode === "login" ? "Log In" : "Create Account"} onPress={submit} loading={loading} style={{ marginTop: S.sm }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  logoBox: { width: 64, height: 64, backgroundColor: C.brand, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: C.borderStrong },
  brand: { ...F.display, fontSize: 40, color: C.onSurface, marginTop: S.lg },
  tagline: { fontSize: 12, fontWeight: "700", letterSpacing: 2, color: C.muted, marginBottom: S.xl },
  toggle: { flexDirection: "row", borderWidth: 2, borderColor: C.borderStrong, marginBottom: S.xl },
  toggleBtn: { flex: 1, paddingVertical: 14, alignItems: "center" },
  toggleActive: { backgroundColor: C.onSurface },
  toggleText: { fontWeight: "800", letterSpacing: 1, color: C.onSurface },
  toggleTextActive: { color: C.onSurfaceInverse },
  fieldLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 1, color: C.onSurface, marginBottom: 6 },
  roleRow: { flexDirection: "row", gap: S.md, marginBottom: S.md },
  roleBtn: { flex: 1, paddingVertical: 14, alignItems: "center", borderWidth: 2, borderColor: C.borderStrong },
  roleActive: { backgroundColor: C.brand },
  roleText: { fontWeight: "800", color: C.onSurface },
  roleTextActive: { color: C.onBrand },
  error: { color: C.error, fontWeight: "700", marginBottom: S.md },
});
