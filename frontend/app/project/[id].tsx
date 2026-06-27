import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { api } from "@/src/api";
import { C, S, F, statusColor } from "@/src/theme";
import { Btn, Field, EmptyState, Tag } from "@/src/components/ui";
import { Sheet } from "@/src/components/Sheet";

export default function ProjectDetail() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [seg, setSeg] = useState<"timeline" | "media">("timeline");
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");

  const load = useCallback(async () => {
    try {
      const [p, t, ph] = await Promise.all([
        api.get(`/projects/${id}`), api.get(`/tasks?project_id=${id}`), api.get(`/photos?project_id=${id}`),
      ]);
      setProject(p); setTasks(t); setPhotos(ph);
    } catch {}
  }, [id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const addTask = async () => {
    if (!taskTitle) return;
    await api.post("/tasks", { project_id: id, title: taskTitle, assignee: taskAssignee, status: "todo" });
    setTaskTitle(""); setTaskAssignee(""); setTaskOpen(false); load();
  };

  const toggleTask = async (t: any) => {
    const next = t.status === "done" ? "todo" : t.status === "todo" ? "in_progress" : "done";
    await api.put(`/tasks/${t.id}`, { ...t, status: next });
    load();
  };

  const setProgress = async (delta: number) => {
    const p = Math.max(0, Math.min(100, (project.progress || 0) + delta));
    await api.put(`/projects/${id}`, { ...project, progress: p });
    load();
  };

  const addPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], base64: true, quality: 0.4 });
    if (!res.canceled && res.assets[0]?.base64) {
      const img = `data:image/jpeg;base64,${res.assets[0].base64}`;
      await api.post("/photos", { project_id: id, image: img, caption: "" });
      load();
    }
  };

  if (!project) return <View style={{ flex: 1, backgroundColor: C.surface }} />;

  return (
    <View style={{ flex: 1, backgroundColor: C.surface }}>
      <View style={styles.hero}>
        <Image source={{ uri: project.cover_image }} style={StyleSheet.absoluteFill} contentFit="cover" />
        <View style={styles.scrim} />
        <Pressable testID="back-btn" onPress={() => router.back()} style={[styles.back, { top: insets.top + S.sm }]}>
          <Ionicons name="arrow-back" size={22} color={C.onSurfaceInverse} />
        </Pressable>
        <View style={styles.heroText}>
          <Tag label={project.status} color={statusColor(project.status)} />
          <Text style={styles.heroTitle}>{project.name.toUpperCase()}</Text>
          <Text style={styles.heroSub}>{project.client_name} · ${(project.budget || 0).toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.progressCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.progressLabel}>PROGRESS</Text>
          <Text style={styles.progressVal}>{project.progress || 0}%</Text>
        </View>
        <Pressable testID="progress-minus" onPress={() => setProgress(-10)} style={styles.stepBtn}><Ionicons name="remove" size={20} color={C.onSurface} /></Pressable>
        <Pressable testID="progress-plus" onPress={() => setProgress(10)} style={styles.stepBtn}><Ionicons name="add" size={20} color={C.onSurface} /></Pressable>
      </View>

      <View style={styles.segment}>
        {(["timeline", "media"] as const).map((s) => (
          <Pressable key={s} testID={`seg-${s}`} style={[styles.segBtn, seg === s && styles.segActive]} onPress={() => setSeg(s)}>
            <Text style={[styles.segText, seg === s && styles.segTextActive]}>{s.toUpperCase()}</Text>
          </Pressable>
        ))}
      </View>

      {seg === "timeline" ? (
        <FlatList
          data={tasks}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: S.lg, paddingBottom: 100 }}
          ListEmptyComponent={<EmptyState testID="tasks-empty" icon="list-outline" title="No Tasks" subtitle="Add tasks to track site progress." />}
          renderItem={({ item }) => (
            <Pressable testID={`task-${item.id}`} onPress={() => toggleTask(item)} style={styles.task}>
              <Ionicons name={item.status === "done" ? "checkbox" : "square-outline"} size={22} color={item.status === "done" ? C.success : C.onSurface} />
              <View style={{ flex: 1, marginLeft: S.md }}>
                <Text style={[styles.taskTitle, item.status === "done" && { textDecorationLine: "line-through", color: C.muted }]}>{item.title}</Text>
                {!!item.assignee && <Text style={styles.taskSub}>{item.assignee}</Text>}
              </View>
              <Tag label={item.status} color={statusColor(item.status)} />
            </Pressable>
          )}
        />
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(i) => i.id}
          numColumns={2}
          contentContainerStyle={{ padding: S.lg, paddingBottom: 100 }}
          columnWrapperStyle={{ gap: S.md }}
          ListEmptyComponent={<EmptyState testID="photos-empty" icon="images-outline" title="No Media Logged" subtitle="Capture site progress photos." />}
          renderItem={({ item }) => <Image source={{ uri: item.image }} style={styles.photo} contentFit="cover" />}
        />
      )}

      <View style={[styles.fab, { paddingBottom: insets.bottom || S.md }]}>
        {seg === "timeline" ? (
          <Btn testID="add-task-btn" label="Add Task" icon="add" onPress={() => setTaskOpen(true)} />
        ) : (
          <Btn testID="add-photo-btn" label="Add Photo" icon="camera" onPress={addPhoto} />
        )}
      </View>

      <Sheet visible={taskOpen} onClose={() => setTaskOpen(false)} title="NEW TASK" testID="task-sheet">
        <Field label="Task Title" testID="tf-title" value={taskTitle} onChangeText={setTaskTitle} placeholder="Pour foundation" />
        <Field label="Assignee" testID="tf-assignee" value={taskAssignee} onChangeText={setTaskAssignee} placeholder="Mike Mason" />
        <Btn testID="tf-save" label="Add Task" onPress={addTask} />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { height: 200 },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  back: { position: "absolute", left: S.lg, width: 44, height: 44, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: C.onSurfaceInverse },
  heroText: { position: "absolute", bottom: S.md, left: S.lg, right: S.lg },
  heroTitle: { ...F.display, fontSize: 30, color: C.onSurfaceInverse, marginTop: S.sm },
  heroSub: { fontSize: 13, fontWeight: "700", color: "#E4E4E7", marginTop: 2 },
  progressCard: { flexDirection: "row", alignItems: "center", gap: S.sm, borderBottomWidth: 2, borderColor: C.borderStrong, padding: S.lg },
  progressLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 1, color: C.muted },
  progressVal: { ...F.display, fontSize: 32, color: C.onSurface },
  stepBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: C.borderStrong },
  segment: { flexDirection: "row", borderBottomWidth: 2, borderColor: C.borderStrong },
  segBtn: { flex: 1, paddingVertical: 14, alignItems: "center" },
  segActive: { backgroundColor: C.onSurface },
  segText: { fontWeight: "800", letterSpacing: 1, color: C.onSurface },
  segTextActive: { color: C.onSurfaceInverse },
  task: { flexDirection: "row", alignItems: "center", borderWidth: 2, borderColor: C.borderStrong, padding: S.md, marginBottom: S.sm },
  taskTitle: { ...F.heavy, fontSize: 15, color: C.onSurface },
  taskSub: { fontSize: 12, color: C.muted, marginTop: 2 },
  photo: { flex: 1, height: 150, marginBottom: S.md, borderWidth: 2, borderColor: C.borderStrong },
  fab: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: S.lg, paddingTop: S.sm, backgroundColor: C.surface, borderTopWidth: 2, borderColor: C.borderStrong },
});
