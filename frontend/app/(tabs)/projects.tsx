import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/src/api";
import { C, S, F, statusColor } from "@/src/theme";
import { Btn, Field, EmptyState, Tag, Chip } from "@/src/components/ui";
import { Sheet } from "@/src/components/Sheet";

const COVER = "https://images.pexels.com/photos/14989321/pexels-photo-14989321.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";
const FILTERS = ["all", "active", "on_hold", "completed"];

export default function Projects() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ name: "", client_name: "", address: "", budget: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try { setItems(await api.get("/projects")); } catch {} finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const save = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      await api.post("/projects", { ...form, budget: parseFloat(form.budget) || 0, cover_image: COVER, status: "active" });
      setOpen(false); setForm({ name: "", client_name: "", address: "", budget: "" }); load();
    } catch {} finally { setSaving(false); }
  };

  const data = filter === "all" ? items : items.filter((p) => p.status === filter);

  return (
    <View style={{ flex: 1, backgroundColor: C.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + S.md }]}>
        <Text style={styles.title}>PROJECTS</Text>
        <Pressable testID="add-project-btn" onPress={() => setOpen(true)} style={styles.addBtn}>
          <Ionicons name="add" size={26} color={C.onBrand} />
        </Pressable>
      </View>
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: S.sm, paddingHorizontal: S.lg }}>
          {FILTERS.map((f) => <Chip key={f} testID={`filter-${f}`} label={f.replace("_", " ")} active={filter === f} onPress={() => setFilter(f)} />)}
        </ScrollView>
      </View>

      <FlatList
        data={data}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: S.lg, paddingBottom: S["3xl"], gap: S.md }}
        ListEmptyComponent={!loading ? <EmptyState testID="projects-empty" icon="business-outline" title="No Projects Yet" subtitle="Create your first construction site to get started." /> : null}
        renderItem={({ item }) => (
          <Pressable testID={`project-${item.id}`} style={styles.card} onPress={() => router.push(`/project/${item.id}` as any)}>
            <Image source={{ uri: item.cover_image || COVER }} style={styles.cardImg} contentFit="cover" />
            <View style={styles.cardBody}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.name.toUpperCase()}</Text>
                <Tag label={item.status} color={statusColor(item.status)} />
              </View>
              <Text style={styles.cardSub} numberOfLines={1}>{item.client_name || "No client"} · {item.address || "No address"}</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${item.progress || 0}%` }]} />
              </View>
              <Text style={styles.cardMeta}>{item.progress || 0}% COMPLETE · ${(item.budget || 0).toLocaleString()}</Text>
            </View>
          </Pressable>
        )}
      />

      <Sheet visible={open} onClose={() => setOpen(false)} title="NEW PROJECT" testID="project-sheet">
        <Field label="Project Name" testID="pf-name" value={form.name} onChangeText={(t: string) => setForm({ ...form, name: t })} placeholder="Downtown Office Tower" />
        <Field label="Client Name" testID="pf-client" value={form.client_name} onChangeText={(t: string) => setForm({ ...form, client_name: t })} placeholder="Acme Corp" />
        <Field label="Address" testID="pf-address" value={form.address} onChangeText={(t: string) => setForm({ ...form, address: t })} placeholder="123 Main St" />
        <Field label="Budget ($)" testID="pf-budget" value={form.budget} onChangeText={(t: string) => setForm({ ...form, budget: t })} keyboardType="numeric" placeholder="500000" />
        <Btn testID="pf-save" label="Create Project" onPress={save} loading={saving} />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: S.lg, paddingBottom: S.md },
  title: { ...F.display, fontSize: 30, color: C.onSurface },
  addBtn: { width: 48, height: 48, backgroundColor: C.brand, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: C.borderStrong },
  filterRow: { height: 56, justifyContent: "center", borderBottomWidth: 2, borderTopWidth: 2, borderColor: C.borderStrong },
  card: { borderWidth: 2, borderColor: C.borderStrong, backgroundColor: C.surface },
  cardImg: { width: "100%", height: 130 },
  cardBody: { padding: S.md, borderTopWidth: 2, borderColor: C.borderStrong },
  cardTitle: { ...F.heavy, fontSize: 16, color: C.onSurface, flex: 1, marginRight: S.sm },
  cardSub: { fontSize: 12, color: C.muted, marginTop: 4 },
  progressTrack: { height: 8, backgroundColor: C.surfaceTertiary, marginTop: S.md, borderWidth: 1, borderColor: C.borderStrong },
  progressFill: { height: "100%", backgroundColor: C.brand },
  cardMeta: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5, color: C.onSurface, marginTop: 6 },
});
