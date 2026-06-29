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

export default function AdminPanel() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [section, setSection] = useState<Section>("dashboard");

  useEffect(() => {
    if (!loading && !user) router.replace("/admin");
  }, [user, loading]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={P.copper} />
      </View>
    );
  }

  // Track which sections have been visited so we lazy-mount but never unmount
  const [visited, setVisited] = React.useState<Set<Section>>(new Set(["dashboard"]));
  React.useEffect(() => {
    setVisited(prev => new Set([...prev, section]));
  }, [section]);

  return (
    <View style={[styles.root, !isDesktop && styles.rootMobile]}>
      <AdminSidebar
        activeSection={section}
        onNavigate={setSection}
      />
      <View style={styles.content}>
        {(["dashboard", "quotes", "leads", "testimonials", "gallery", "settings"] as Section[]).map((s) => (
          <View key={s} style={[styles.panel, s !== section && styles.panelHidden]}>
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
    minHeight: "100%" as any,
  },
  rootMobile: {
    flexDirection: "column",
  },
  content: {
    flex: 1,
    flexDirection: "column",
    backgroundColor: P.bg,
  },
  panel: {
    flex: 1,
  },
  panelHidden: {
    display: "none" as any,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: P.bg,
  },
});
