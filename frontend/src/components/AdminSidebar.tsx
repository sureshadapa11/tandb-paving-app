import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/context/AuthContext";

const PAGE_TITLES: Record<string, string> = {
  "/admin/dashboard":   "Dashboard",
  "/admin/leads":       "Leads",
  "/admin/quotes":      "Quotes",
  "/admin/gallery":     "Gallery",
  "/admin/testimonials":"Testimonials",
};

const A = {
  bg: "#1A2A3A",
  active: "#B5651D",
  text: "rgba(255,255,255,0.85)",
  textMuted: "rgba(255,255,255,0.5)",
  border: "rgba(255,255,255,0.08)",
};

type NavItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: "home-outline", route: "/admin/dashboard" },
  { label: "Leads", icon: "mail-outline", route: "/admin/leads" },
  { label: "Quotes", icon: "document-text-outline", route: "/admin/quotes" },
  { label: "Gallery", icon: "images-outline", route: "/admin/gallery" },
  { label: "Testimonials", icon: "star-outline", route: "/admin/testimonials" },
];

type Props = {
  activeRoute: string;
};

export default function AdminSidebar({ activeRoute }: Props) {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => { await logout(); router.replace("/admin"); };

  // Mobile — render top header bar only
  if (width < 768) {
    return (
      <View style={styles.mobileHeader}>
        <Image source={require("../../assets/images/logo.jpg")} style={styles.mobileLogo} />
        <Text style={styles.mobileTitle}>{PAGE_TITLES[activeRoute] ?? "Admin"}</Text>
        <View style={styles.mobileActions}>
          <TouchableOpacity onPress={() => router.replace("/(tabs)" as any)} style={styles.mobileBtn}>
            <Ionicons name="home-outline" size={20} color={A.active} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.mobileBtn}>
            <Ionicons name="log-out-outline" size={20} color="rgba(220,80,80,0.85)" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.sidebar}>
      {/* Logo */}
      <View style={styles.logoArea}>
        <Image
          source={require("../../assets/images/logo.jpg")}
          style={styles.logo}
        />
        <Text style={styles.logoText}>T&B Paving</Text>
        <Text style={styles.logoSub}>Admin Panel</Text>
      </View>

      <View style={styles.divider} />

      {/* Nav items */}
      <View style={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const isActive = activeRoute === item.route;
          return (
            <TouchableOpacity
              key={item.route}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={item.icon}
                size={18}
                color={isActive ? "#FFFFFF" : A.text}
                style={styles.navIcon}
              />
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.spacer} />

      <View style={styles.divider} />

      {/* Back to site */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => router.replace("/(tabs)" as any)}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back-outline" size={18} color={A.text} style={styles.navIcon} />
        <Text style={styles.navLabel}>Back to Site</Text>
      </TouchableOpacity>

      {/* Logout */}
      <TouchableOpacity
        style={[styles.navItem, styles.logoutItem]}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <Ionicons name="log-out-outline" size={18} color="rgba(220,80,80,0.85)" style={styles.navIcon} />
        <Text style={[styles.navLabel, { color: "rgba(220,80,80,0.85)" }]}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 220,
    backgroundColor: A.bg,
    paddingTop: 24,
    paddingBottom: 16,
    flexDirection: "column",
    minHeight: "100%" as any,
  },
  logoArea: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 8,
  },
  logoText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  logoSub: {
    color: A.textMuted,
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: A.border,
    marginHorizontal: 12,
    marginVertical: 8,
  },
  nav: {
    paddingHorizontal: 8,
    gap: 2,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 8,
    marginVertical: 1,
  },
  navItemActive: {
    backgroundColor: A.active,
  },
  navIcon: {
    marginRight: 10,
    width: 20,
  },
  navLabel: {
    color: A.text,
    fontSize: 14,
    fontWeight: "500",
  },
  navLabelActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  spacer: {
    flex: 1,
  },
  logoutItem: {
    marginTop: 2,
  },
  mobileHeader: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1, borderBottomColor: "#E8E0D4",
    paddingHorizontal: 16, paddingVertical: 10,
    gap: 10,
  },
  mobileLogo: { width: 38, height: 38, borderRadius: 19 },
  mobileTitle: { flex: 1, fontSize: 17, fontWeight: "700", color: "#1A2A3A" },
  mobileActions: { flexDirection: "row", gap: 4 },
  mobileBtn: { padding: 8, borderRadius: 8, backgroundColor: "#F7F4F0" },
});
