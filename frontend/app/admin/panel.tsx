import React, { useState, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";
import AdminSidebar, { Section } from "@/src/components/AdminSidebar";
import { P } from "@/src/adminTheme";

import { DashboardPanel } from "./dashboard";
import { QuotesPanel } from "./quotes";
import { LeadsPanel } from "./leads";
import { TestimonialsPanel } from "./testimonials";
import { GalleryPanel } from "./gallery";
import { SettingsPanel } from "./settings";

const ALL_SECTIONS: Section[] = ["dashboard", "quotes", "leads", "testimonials", "gallery", "settings"];

export default function AdminPanel() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [section, setSection] = useState<Section>("dashboard");
  // Lazy-mount: only render a panel the first time it's visited, never unmount after
  const [visited, setVisited] = useState<Set<Section>>(new Set<Section>(["dashboard"]));

  useEffect(() => {
    if (!loading && !user) router.replace("/admin");
  }, [user, loading]);

  useEffect(() => {
    setVisited(prev => new Set([...prev, section]));
  }, [section]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={P.copper} />
      </View>
    );
  }

  if (!user) return null;

  return (
    <View style={[styles.root, !isDesktop && styles.rootMobile]}>
      <AdminSidebar activeSection={section} onNavigate={setSection} />

      {/* Content: active panel gets flex:1, hidden panels collapse to height:0 */}
      <View style={styles.content}>
        {ALL_SECTIONS.map((s) => (
          <View
            key={s}
            style={s === section ? styles.panelActive : styles.panelHidden}
            pointerEvents={s === section ? "auto" : "none"}
          >
            {visited.has(s) && (
              <>
                {s === "dashboard"    && <DashboardPanel />}
                {s === "quotes"       && <QuotesPanel />}
                {s === "leads"        && <LeadsPanel />}
                {s === "testimonials" && <TestimonialsPanel />}
                {s === "gallery"      && <GalleryPanel />}
                {s === "settings"     && <SettingsPanel />}
              </>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: P.bg,
  },
  rootMobile: {
    flexDirection: "column",
  },
  content: {
    flex: 1,
    flexDirection: "column",
    backgroundColor: P.bg,
  },
  // Active panel fills all available flex space
  panelActive: {
    flex: 1,
    backgroundColor: P.bg,
  },
  // Hidden panels take zero space and clip their content
  panelHidden: {
    height: 0,
    overflow: "hidden",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: P.bg,
  },
});
