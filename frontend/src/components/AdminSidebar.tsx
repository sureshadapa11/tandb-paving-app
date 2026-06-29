import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/context/AuthContext";

export type Section = "dashboard" | "quotes" | "leads" | "testimonials" | "gallery" | "settings";

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
  section: Section;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",    icon: "home-outline",          route: "/admin/dashboard",    section: "dashboard" },
  { label: "Leads",        icon: "mail-outline",          route: "/admin/leads",        section: "leads" },
  { label: "Quotes",       icon: "document-text-outline", route: "/admin/quotes",       section: "quotes" },
  { label: "Gallery",      icon: "images-outline",        route: "/admin/gallery",      section: "gallery" },
  { label: "Testimonials", icon: "star-outline",          route: "/admin/testimonials", section: "testimonials" },
  { label: "Settings",     icon: "settings-outline",      route: "/admin/settings",     section: "settings" },
];

type Props =
  | {
      /** State-based mode: call onNavigate instead of router.push */
      onNavigate: (section: Section) => void;
      activeSection: Section;
      activeRoute?: never;
    }
  | {
      /** Legacy route-based mode: uses router.push and highlights by route string */
      activeRoute: string;
      onNavigate?: never;
      activeSection?: never;
    };

export default function AdminSidebar(props: Props) {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => { await logout(); router.replace("/admin"); };

  /** Returns true when the given NAV_ITEMS entry should be highlighted */
  const isActive = (item: NavItem): boolean => {
    if (props.onNavigate) {
      return props.activeSection === item.section;
    }
    return (props.activeRoute ?? "") === item.route;
  };

  /** Navigate to a nav item */
  const handlePress = (item: NavItem) => {
    if (props.onNavigate) {
      props.onNavigate(item.section);
    } else {
      router.push(item.route as any);
    }
  };

  // Mobile — branding row + horizontal tab bar
  if (width < 768) {
    return (
      <View>
        {/* Branding row */}
        <View style={styles.mobileHeader}>
          <Image source={require("../../assets/images/logo.jpg")} style={styles.mobileLogo} />
          <View style={styles.mobileBrand}>
            <Text style={styles.mobileBrandName}>T&B Paving</Text>
            <Text style={styles.mobileBrandSub}>Driveways · Patios · Paths</Text>
          </View>
          <View style={styles.mobileActions}>
            <TouchableOpacity onPress={() => router.replace("/(tabs)" as any)} style={styles.mobileBtn}>
              <Ionicons name="home-outline" size={18} color={A.active} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={styles.mobileBtn}>
              <Ionicons name="log-out-outline" size={18} color="rgba(220,80,80,0.85)" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Horizontal tab bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.mobileTabBar}
          contentContainerStyle={styles.mobileTabBarContent}
        >
          {NAV_ITEMS.map((item) => {
            const active = isActive(item);
            return (
              <TouchableOpacity
                key={item.route}
                style={[styles.mobileTab, active && styles.mobileTabActive]}
                onPress={() => handlePress(item)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={item.icon}
                  size={15}
                  color={active ? "#FFFFFF" : A.active}
                  style={{ marginRight: 5 }}
                />
                <Text style={[styles.mobileTabText, active && styles.mobileTabTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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
          const active = isActive(item);
          return (
            <TouchableOpacity
              key={item.route}
              style={[styles.navItem, active && styles.navItemActive]}
              onPress={() => handlePress(item)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={item.icon}
                size={18}
                color={active ? "#FFFFFF" : A.text}
                style={styles.navIcon}
              />
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>
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
    paddingHorizontal: 14, paddingVertical: 10,
    gap: 10,
  },
  mobileLogo: { width: 40, height: 40, borderRadius: 20 },
  mobileBrand: { flex: 1 },
  mobileBrandName: { fontSize: 15, fontWeight: "800", color: "#1A2A3A", letterSpacing: 0.2 },
  mobileBrandSub: { fontSize: 11, color: "#B5651D", fontWeight: "500", marginTop: 1 },
  mobileActions: { flexDirection: "row", gap: 4 },
  mobileBtn: { padding: 7, borderRadius: 8, backgroundColor: "#F7F4F0" },
  mobileTabBar: {
    backgroundColor: "#1A2A3A",
    borderBottomWidth: 2,
    borderBottomColor: "#B5651D",
  },
  mobileTabBarContent: {
    paddingHorizontal: 10, paddingVertical: 8, gap: 6, flexDirection: "row",
  },
  mobileTab: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  mobileTabActive: {
    backgroundColor: "#B5651D",
  },
  mobileTabText: {
    fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.75)",
  },
  mobileTabTextActive: {
    color: "#FFFFFF",
  },
});
