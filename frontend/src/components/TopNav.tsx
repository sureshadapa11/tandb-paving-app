import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { C, S, R } from "@/src/theme";
import { useResponsive } from "@/src/hooks/use-responsive";
import { useActiveSection } from "@/src/contexts/nav-context";

export const NAV_HEIGHT = 64;

// All links scroll to sections on the home page
const LINKS = [
  { label: "Home",     section: "home" },
  { label: "Services", section: "services" },
  { label: "Process",  section: "process" },
  { label: "Gallery",  section: "gallery" },
  { label: "Reviews",  section: "reviews" },
  { label: "Areas",    section: "areas" },
  { label: "FAQ",      section: "faq" },
];

export default function TopNav() {
  const router = useRouter();
  const { isDesktop, hPad } = useResponsive();
  const [menuOpen, setMenuOpen] = useState(false);
  const { activeSection } = useActiveSection();

  const navigate = (section: string) => {
    setMenuOpen(false);
    if (section === "home") {
      router.push("/(tabs)" as any);
    } else {
      router.push(`/(tabs)?scrollTo=${section}` as any);
    }
  };

  const goQuote = () => {
    setMenuOpen(false);
    router.push("/(tabs)/quote" as any);
  };

  return (
    <View style={styles.outer}>
      <View style={[styles.inner, { paddingHorizontal: hPad }]}>
        {/* Logo */}
        <Pressable onPress={() => navigate("home")} style={styles.logo}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoMark}>T&B</Text>
          </View>
          <View style={styles.logoText}>
            <Text style={styles.logoName}>T&B PAVING</Text>
            <Text style={styles.logoSub}>Driveways · Patios · Paths</Text>
          </View>
        </Pressable>

        {isDesktop ? (
          <View style={styles.desktopLinks}>
            {LINKS.map((l) => {
              const isActive = activeSection === l.section;
              return (
                <Pressable key={l.label} onPress={() => navigate(l.section)} style={styles.link}>
                  <Text style={[styles.linkText, isActive && styles.linkActive]}>
                    {l.label}
                  </Text>
                  {isActive && <View style={styles.linkUnderline} />}
                </Pressable>
              );
            })}
            <Pressable onPress={goQuote}>
              <LinearGradient
                colors={[C.brand, C.brandDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.quotePill}
              >
                <Text style={styles.quotePillText}>Free Quote</Text>
              </LinearGradient>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => setMenuOpen(!menuOpen)} style={styles.hamburger}>
            <Ionicons name={menuOpen ? "close" : "menu"} size={26} color={C.ink} />
          </Pressable>
        )}
      </View>

      {/* Mobile dropdown */}
      {!isDesktop && menuOpen && (
        <View style={styles.mobileMenu}>
          {LINKS.map((l) => {
            const isActive = activeSection === l.section;
            return (
              <Pressable key={l.label} onPress={() => navigate(l.section)} style={styles.mobileLink}>
                <Text style={[styles.mobileLinkText, isActive && { color: C.brand }]}>
                  {l.label}
                </Text>
                {isActive && <Ionicons name="chevron-forward" size={16} color={C.brand} />}
              </Pressable>
            );
          })}
          <View style={styles.mobileMenuDivider} />
          <Pressable onPress={goQuote} style={styles.mobileCTA}>
            <LinearGradient colors={[C.brand, C.brandDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.mobileCTAGrad}>
              <Text style={styles.mobileCTAText}>Free Quote</Text>
            </LinearGradient>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    zIndex: 100,
    ...Platform.select({ web: { position: "sticky" as any, top: 0 } }),
  },
  inner: {
    height: NAV_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    maxWidth: 1280,
    alignSelf: "center",
    width: "100%",
  },
  logo: { flexDirection: "row", alignItems: "center", gap: S.sm },
  logoCircle: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: C.brand,
    alignItems: "center", justifyContent: "center",
  },
  logoMark: { color: "#fff", fontWeight: "900", fontSize: 13, letterSpacing: -0.5 },
  logoText: { gap: 1 },
  logoName: { fontSize: 13, fontWeight: "900", color: C.ink, letterSpacing: 0.5 },
  logoSub: { fontSize: 9, fontWeight: "600", color: C.muted, letterSpacing: 0.5 },
  desktopLinks: { flexDirection: "row", alignItems: "center", gap: 2 },
  link: { paddingHorizontal: S.sm, paddingVertical: S.sm, alignItems: "center" },
  linkText: { fontSize: 13, fontWeight: "700", color: C.inkSoft },
  linkActive: { color: C.brand },
  linkUnderline: {
    position: "absolute", bottom: 0, left: S.sm, right: S.sm,
    height: 2, backgroundColor: C.brand, borderRadius: 1,
  },
  quotePill: {
    marginLeft: S.sm,
    paddingHorizontal: S.lg,
    paddingVertical: 10,
    borderRadius: R.pill,
  },
  quotePillText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  hamburger: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  mobileMenu: {
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingVertical: S.sm,
    paddingHorizontal: S.lg,
  },
  mobileLink: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mobileLinkText: { fontSize: 15, fontWeight: "700", color: C.ink },
  mobileMenuDivider: { height: S.sm },
  mobileCTA: { paddingVertical: S.sm },
  mobileCTAGrad: { borderRadius: R.pill, alignItems: "center", paddingVertical: 14 },
  mobileCTAText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
