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

  const renderPanel = () => {
    switch (section) {
      case "dashboard":    return <DashboardPanel />;
      case "quotes":       return <QuotesPanel />;
      case "leads":        return <LeadsPanel />;
      case "testimonials": return <TestimonialsPanel />;
      case "gallery":      return <GalleryPanel />;
      case "settings":     return <SettingsPanel />;
    }
  };

  return (
    <View style={[styles.root, !isDesktop && styles.rootMobile]}>
      <AdminSidebar
        activeSection={section}
        onNavigate={setSection}
      />
      <View style={styles.content}>
        {renderPanel()}
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: P.bg,
  },
});
