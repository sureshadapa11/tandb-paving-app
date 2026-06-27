import React from "react";
import { Modal, View, Text, StyleSheet, Pressable, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C, S, F } from "@/src/theme";

export function Sheet({ visible, onClose, title, children, testID }: any) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={{ flex: 1 }} onPress={onClose} testID="sheet-backdrop" />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + S.lg }]} testID={testID}>
            <View style={styles.handleRow}>
              <Text style={styles.title}>{title}</Text>
              <Pressable onPress={onClose} testID="sheet-close" style={styles.close}>
                <Ionicons name="close" size={22} color={C.onSurface} />
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 520 }}>{children}</ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: { backgroundColor: C.surface, borderTopWidth: 2, borderColor: C.borderStrong, padding: S.lg },
  handleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: S.lg },
  title: { ...F.display, fontSize: 22, color: C.onSurface },
  close: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: C.borderStrong },
});
