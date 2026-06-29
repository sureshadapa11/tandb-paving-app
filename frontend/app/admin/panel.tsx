import React, { useState, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator, useWindowDimensions, ScrollView } from "react-native";
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

function PanelContent({ section }: { section: Section }) {
  switch (section) {
    case "dashboard":    return <DashboardPanel />;
    case "quotes":       return <QuotesPanel />;
    case "leads":        return <LeadsPanel />;
    case "testimonials": return <TestimonialsPanel />;
    case "gallery":      return <GalleryPanel />;
    case "settings":     return <SettingsPanel />;
  }
}

export default function AdminPanel() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [section, setSection] = useState<Section>("dashboard");

  useEffect(() => {
    if (!loading && !user) router.replace("/admin");
  }, [user, loading]);

  if (loading) {
    return (
      <View style={[styles.center, { height }]}>
        <ActivityIndicator size="large" color={P.copper} />
      </View>
    );
  }

  if (!user) return null;

  return (
    <View style={[styles.root, { height }, !isDesktop && styles.rootMobile]}>
      <AdminSidebar activeSection={section} onNavigate={setSection} />
      <View style={styles.content}>
        <PanelContent section={section} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    backgroundColor: P.bg,
  },
  rootMobile: {
    flexDirection: "column",
  },
  content: {
    flex: 1,
    backgroundColor: P.bg,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: P.bg,
  },
});
