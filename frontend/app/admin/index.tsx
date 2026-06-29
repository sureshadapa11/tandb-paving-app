import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, ScrollView, Platform,
} from "react-native";
import { useRouter, Link } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";
import { P } from "@/src/adminTheme";

export default function AdminLogin() {
  const { user, loading, login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) {
      router.replace("/admin/dashboard");
    }
  }, [user, loading]);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace("/admin/dashboard");
    } catch (e: any) {
      setError(e.message || "Login failed. Check your credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={P.copper} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        {/* Logo */}
        <View style={styles.logoArea}>
          <Image
            source={require("../../assets/images/logo.jpg")}
            style={styles.logo}
          />
          <Text style={styles.title}>T&B Paving</Text>
          <Text style={styles.subtitle}>Admin Panel</Text>
        </View>

        <Text style={styles.heading}>Welcome back</Text>
        <Text style={styles.hint}>Sign in to manage your business</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.field}>
          <Text style={styles.label}>Email address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="admin@example.com"
            placeholderTextColor={P.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!submitting}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={P.muted}
            secureTextEntry
            editable={!submitting}
            onSubmitEditing={handleLogin}
            returnKeyType="go"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.buttonText}>Log In</Text>
          )}
        </TouchableOpacity>

        <Link href="/(tabs)" style={styles.backLink}>
          <Text style={styles.backLinkText}>← Back to site</Text>
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F2E8D8",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F2E8D8",
    padding: 24,
    minHeight: Platform.OS === "web" ? ("100vh" as any) : undefined,
  },
  card: {
    backgroundColor: P.card,
    borderRadius: 20,
    padding: 36,
    width: "100%",
    maxWidth: 420,
    shadowColor: "#3A2A1A",
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  logoArea: {
    alignItems: "center",
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: P.navy,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 12,
    color: P.muted,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    color: P.ink,
    textAlign: "center",
    marginBottom: 4,
  },
  hint: {
    fontSize: 14,
    color: P.muted,
    textAlign: "center",
    marginBottom: 20,
  },
  errorText: {
    backgroundColor: "#FEF2F2",
    color: P.error,
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#FECACA",
    textAlign: "center",
  },
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: P.ink,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: P.border,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: P.ink,
    backgroundColor: "#FAFAF8",
    outlineStyle: "none" as any,
  },
  button: {
    backgroundColor: P.copper,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 18,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  backLink: {
    alignItems: "center",
  },
  backLinkText: {
    color: P.copper,
    fontSize: 14,
    textAlign: "center",
    textDecorationLine: "underline",
  },
});
