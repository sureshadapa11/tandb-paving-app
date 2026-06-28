import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { C, S, R } from "@/src/theme";
import { useResponsive } from "@/src/hooks/use-responsive";
import { useActiveSection } from "@/src/contexts/nav-context";

const LOGO_IMG = require("../../assets/images/logo.jpg");

export const NAV_HEIGHT = 96;

const BG = "#F2E8D8";
const DARK = "#2C1A0E";
const COPPER = "#B5651D";

const LINKS = [
  { label: "Home",     section: "home",     icon: "home" },
  { label: "Services", section: "services", icon: "construct" },
  { label: "Process",  section: "process",  icon: "list" },
  { label: "Gallery",  section: "gallery",  icon: "images" },
  { label: "Reviews",  section: "reviews",  icon: "star" },
  { label: "Areas",    section: "areas",    icon: "map" },
  { label: "FAQ",      section: "faq",      icon: "help-circle" },
];

export default function TopNav() {
  const router = useRouter();
  const { isDesktop, isTablet, hPad } = useResponsive();
  const [menuOpen, setMenuOpen] = useState(false);
  const { activeSection } = useActiveSection();

  const navigate = (section: string) => {
    setMenuOpen(false);
    router.push(`/(tabs)?scrollTo=${section}` as any);
  };

  const goQuote = () => {
    setMenuOpen(false);
    router.push("/(tabs)/quote" as any);
  };

  return (
    <View style={styles.outer}>
      <View style={[styles.inner, { paddingHorizontal: hPad }]}>

        {/* ── Logo ── */}
        <Pressable onPress={() => navigate("home")} style={styles.logoPressable}>
          <Image source={LOGO_IMG} style={isDesktop ? styles.logoImgDesktop : styles.logoImgMobile} contentFit="contain" />
          {isDesktop && (
            <View style={styles.brandBlock}>
              <Text style={styles.brandName}>T&B PAVING</Text>
              <Text style={styles.brandSub}>Driveways · Patios · Paths</Text>
            </View>
          )}
        </Pressable>

        {/* ── Desktop nav ── */}
        {isDesktop ? (
          <View style={styles.desktopRight}>
            {/* Icon nav row */}
            <View style={styles.navRow}>
              {LINKS.map((l) => {
                const isActive = activeSection === l.section;
                return (
                  <Pressable key={l.label} onPress={() => navigate(l.section)} style={styles.navItem}>
                    <Ionicons
                      name={l.icon as any}
                      size={20}
                      color={isActive ? COPPER : DARK}
                    />
                    <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                      {l.label}
                    </Text>
                    {isActive && <View style={styles.navUnderline} />}
                  </Pressable>
                );
              })}
              <Pressable onPress={goQuote} style={styles.quoteBtn}>
                <LinearGradient
                  colors={[COPPER, "#8B4513"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.quoteBtnGrad}
                >
                  <Text style={styles.quoteBtnText}>Free Quote</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        ) : (
          /* ── Mobile: brand name + hamburger ── */
          <View style={styles.mobileRight}>
            <View>
              <Text style={styles.mobileBrandName}>T&B PAVING</Text>
              <Text style={styles.mobileBrandSub}>Driveways · Patios · Paths</Text>
            </View>
            <Pressable onPress={() => setMenuOpen(!menuOpen)} style={styles.hamburger}>
              <Ionicons name={menuOpen ? "close" : "menu"} size={26} color={DARK} />
            </Pressable>
          </View>
        )}
      </View>

      {/* ── Mobile dropdown ── */}
      {!isDesktop && menuOpen && (
        <View style={styles.mobileMenu}>
          {LINKS.map((l) => {
            const isActive = activeSection === l.section;
            return (
              <Pressable key={l.label} onPress={() => navigate(l.section)} style={styles.mobileLink}>
                <View style={styles.mobileLinkLeft}>
                  <Ionicons name={l.icon as any} size={18} color={isActive ? COPPER : DARK} />
                  <Text style={[styles.mobileLinkText, isActive && { color: COPPER }]}>{l.label}</Text>
                </View>
                {isActive && <Ionicons name="chevron-forward" size={16} color={COPPER} />}
              </Pressable>
            );
          })}
          <View style={{ height: S.sm }} />
          <Pressable onPress={goQuote}>
            <LinearGradient colors={[COPPER, "#8B4513"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.mobileCTAGrad}>
              <Text style={styles.mobileCTAText}>Free Quote</Text>
            </LinearGradient>
          </Pressable>
          <View style={{ height: S.sm }} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: BG,
    borderBottomWidth: 2,
    borderBottomColor: COPPER,
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

  /* Logo */
  logoPressable: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoImgDesktop: { width: 80, height: 80, borderRadius: 40 },
  logoImgMobile: { width: 56, height: 56, borderRadius: 28 },
  brandBlock: { gap: 2 },
  brandName: { fontSize: 22, fontWeight: "900", color: DARK, letterSpacing: 1 },
  brandSub: { fontSize: 11, fontWeight: "600", color: COPPER, letterSpacing: 1 },

  /* Desktop right side */
  desktopRight: { flex: 1, alignItems: "flex-end", justifyContent: "center" },
  navRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  navItem: { alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, position: "relative" },
  navLabel: { fontSize: 11, fontWeight: "700", color: DARK, marginTop: 3, letterSpacing: 0.3 },
  navLabelActive: { color: COPPER },
  navUnderline: {
    position: "absolute", bottom: 0, left: 10, right: 10,
    height: 2, backgroundColor: COPPER, borderRadius: 1,
  },
  quoteBtn: { marginLeft: 8 },
  quoteBtnGrad: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: R.pill },
  quoteBtnText: { color: "#fff", fontWeight: "800", fontSize: 13 },

  /* Mobile right */
  mobileRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  mobileBrandName: { fontSize: 16, fontWeight: "900", color: DARK, letterSpacing: 0.5, textAlign: "right" },
  mobileBrandSub: { fontSize: 9, fontWeight: "600", color: COPPER, letterSpacing: 0.5, textAlign: "right" },
  hamburger: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },

  /* Mobile menu */
  mobileMenu: {
    backgroundColor: BG,
    borderTopWidth: 1,
    borderTopColor: `${COPPER}40`,
    paddingHorizontal: S.lg,
  },
  mobileLink: {
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: `${COPPER}25`,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mobileLinkLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  mobileLinkText: { fontSize: 15, fontWeight: "700", color: DARK },
  mobileCTAGrad: { borderRadius: R.pill, alignItems: "center", paddingVertical: 13 },
  mobileCTAText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
