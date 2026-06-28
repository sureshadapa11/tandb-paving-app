import React from "react";
import { View } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { C } from "@/src/theme";
import TopNav from "@/src/components/TopNav";
import { NavProvider } from "@/src/contexts/nav-context";
import ChatBubble from "@/src/components/ChatBubble";

export default function TabsLayout() {
  return (
    <NavProvider>
      <View style={{ flex: 1 }}>
        <TopNav />
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: { display: "none" },
          }}
        >
          <Tabs.Screen name="index"    options={{ title: "Home",     tabBarIcon: ({ color, size }) => <Ionicons name="home"       size={size} color={color} /> }} />
          <Tabs.Screen name="services" options={{ title: "Services", tabBarIcon: ({ color, size }) => <Ionicons name="construct"  size={size} color={color} /> }} />
          <Tabs.Screen name="gallery"  options={{ title: "Our Work", tabBarIcon: ({ color, size }) => <Ionicons name="images"     size={size} color={color} /> }} />
          <Tabs.Screen name="reviews"  options={{ title: "Reviews",  tabBarIcon: ({ color, size }) => <Ionicons name="star"       size={size} color={color} /> }} />
          <Tabs.Screen name="quote"    options={{ title: "Get Quote",tabBarIcon: ({ color, size }) => <Ionicons name="calculator" size={size} color={color} /> }} />
        </Tabs>
        <ChatBubble />
      </View>
    </NavProvider>
  );
}
