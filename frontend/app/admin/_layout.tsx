import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, Platform } from "react-native";
import { Stack, useRouter, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AuthProvider } from "@/src/context/AuthContext";

const COPPER = "#B5651D";
const NAVY = "#1A2A3A";
const BORDER = "#E8E0D4";

const TABS = [
  { label: "Dashboard", icon: "home-outline",          route: "/admin/dashboard" },
  { label: "Leads",     icon: "mail-outline",           route: "/admin/leads" },
  { label: "Quotes",    icon: "document-text-outline",  route: "/admin/quotes" },
  { label: "Gallery",   icon: "images-outline",         route: "/admin/gallery" },
  { label: "More",      icon: "star-outline",           route: "/admin/testimonials" },
] as const;

function MobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  if (width >= 768) return null;

  return (
    <View style={styles.bottomNav}>
      {TABS.map((t) => {
        const active = pathname === t.route;
        return (
          <TouchableOpacity
            key={t.route}
            style={styles.tabItem}
            onPress={() => router.push(t.route as any)}
            activeOpacity={0.7}
          >
            <Ionicons name={t.icon as any} size={22} color={active ? COPPER : "#9A8A7A"} />
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function AdminLayout() {
  return (
    <AuthProvider>
      <View style={styles.root}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F7F4F0" } }} />
        <MobileBottomNav />
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingBottom: Platform.OS === "ios" ? 20 : 8,
    paddingTop: 8,
    ...Platform.select({ web: { position: "sticky" as any, bottom: 0 } }),
  },
  tabItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3 },
  tabLabel: { fontSize: 10, fontWeight: "600", color: "#9A8A7A" },
  tabLabelActive: { color: COPPER, fontWeight: "700" },
});
