import React from "react";
import { View, Platform } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { C } from "@/src/theme";
import { useResponsive } from "@/src/hooks/use-responsive";
import TopNav from "@/src/components/TopNav";
import { NavProvider } from "@/src/contexts/nav-context";

export default function TabsLayout() {
  const { isDesktop } = useResponsive();

  return (
    <NavProvider>
      <View style={{ flex: 1 }}>
        <TopNav />
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: C.brand,
            tabBarInactiveTintColor: C.muted,
            tabBarStyle: isDesktop
              ? { display: "none" }
              : {
                  backgroundColor: C.surface,
                  borderTopWidth: 1,
                  borderTopColor: C.border,
                  height: Platform.OS === "ios" ? 88 : 66,
                  paddingTop: 8,
                },
            tabBarLabelStyle: { fontSize: 10, fontWeight: "700" },
          }}
        >
          <Tabs.Screen name="index"    options={{ title: "Home",     tabBarIcon: ({ color, size }) => <Ionicons name="home"       size={size} color={color} /> }} />
          <Tabs.Screen name="services" options={{ title: "Services", tabBarIcon: ({ color, size }) => <Ionicons name="construct"  size={size} color={color} /> }} />
          <Tabs.Screen name="gallery"  options={{ title: "Our Work", tabBarIcon: ({ color, size }) => <Ionicons name="images"     size={size} color={color} /> }} />
          <Tabs.Screen name="reviews"  options={{ title: "Reviews",  tabBarIcon: ({ color, size }) => <Ionicons name="star"       size={size} color={color} /> }} />
          <Tabs.Screen name="quote"    options={{ title: "Get Quote",tabBarIcon: ({ color, size }) => <Ionicons name="calculator" size={size} color={color} /> }} />
        </Tabs>
      </View>
    </NavProvider>
  );
}
