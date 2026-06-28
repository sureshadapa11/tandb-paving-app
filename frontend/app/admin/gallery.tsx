import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Image, ActivityIndicator, Alert, Platform,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/context/AuthContext";
import { api } from "@/src/api";
import AdminSidebar from "@/src/components/AdminSidebar";

const P = {
  bg: "#F7F4F0", card: "#FFFFFF", navy: "#1A2A3A", copper: "#B5651D",
  ink: "#1A2A3A", muted: "#7A6A5A", border: "#E8E0D4", error: "#DC2626",
};

type Photo = { id: number; caption: string; project_id?: number; image_base64: string; created_at: string };

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix, keep raw base64
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Gallery() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const fileInputRef = useRef<any>(null);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [fetching, setFetching] = useState(true);
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedBase64, setSelectedBase64] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/admin");
  }, [user, loading]);

  const load = useCallback(async () => {
    try {
      const data = await api.get("/photos");
      setPhotos(data || []);
    } catch {}
    setFetching(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleFileChange = async (e: any) => {
    const file: File = e.target.files?.[0];
    if (!file) return;
    const b64 = await readFileAsBase64(file);
    setSelectedBase64(b64);
    setPreview(`data:${file.type};base64,${b64}`);
  };

  const handleUpload = async () => {
    if (!selectedBase64) {
      Alert.alert("No image selected", "Please choose an image first.");
      return;
    }
    setUploading(true);
    try {
      await api.post("/photos", { caption: caption.trim() || "Gallery photo", image_base64: selectedBase64 });
      setCaption("");
      setPreview(null);
      setSelectedBase64(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await load();
    } catch (e: any) {
      Alert.alert("Upload failed", e.message || "Could not upload photo.");
    }
    setUploading(false);
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      "Delete Photo",
      "Are you sure you want to delete this photo? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete", style: "destructive",
          onPress: async () => {
            setDeletingId(id);
            try {
              await api.del(`/photos/${id}`);
              setPhotos((prev) => prev.filter((p) => p.id !== id));
            } catch {}
            setDeletingId(null);
          },
        },
      ]
    );
  };

  const cols = isDesktop ? 3 : 2;

  if (loading || fetching) {
    return <View style={styles.center}><ActivityIndicator size="large" color={P.copper} /></View>;
  }

  return (
    <View style={styles.root}>
      <AdminSidebar activeRoute="/admin/gallery" />

      <View style={styles.main}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Text style={styles.pageTitle}>Gallery Manager</Text>
          <View style={styles.topRight}>
            <Text style={styles.userName}>{user?.name}</Text>
            <TouchableOpacity onPress={async () => { await logout(); router.replace("/admin"); }} style={styles.iconBtn}>
              <Ionicons name="log-out-outline" size={20} color={P.muted} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Upload section */}
          <View style={styles.uploadCard}>
            <Text style={styles.sectionTitle}>Upload New Photo</Text>

            {/* Web file input */}
            {Platform.OS === "web" && (
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ marginBottom: 12, fontSize: 14, color: P.ink }}
                onChange={handleFileChange}
              />
            )}

            {preview ? (
              <Image source={{ uri: preview }} style={styles.previewImage} resizeMode="cover" />
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Ionicons name="image-outline" size={40} color={P.muted} />
                <Text style={styles.uploadHint}>Select an image above</Text>
              </View>
            )}

            <Text style={styles.fieldLabel}>Caption</Text>
            <TextInput
              style={styles.input}
              value={caption}
              onChangeText={setCaption}
              placeholder="e.g. Block paving driveway, Chelmsford"
              placeholderTextColor={P.muted}
            />

            <TouchableOpacity
              style={[styles.uploadBtn, (uploading || !selectedBase64) && styles.btnDisabled]}
              onPress={handleUpload}
              disabled={uploading || !selectedBase64}
              activeOpacity={0.8}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.uploadBtnText}>Upload Photo</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Photo grid */}
          <Text style={styles.sectionTitle}>Gallery ({photos.length} photos)</Text>

          {photos.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="images-outline" size={40} color={P.muted} />
              <Text style={styles.emptyText}>No photos uploaded yet.</Text>
            </View>
          ) : (
            <View style={[styles.grid, { gap: 12 }]}>
              {photos.map((photo) => (
                <View key={photo.id} style={[styles.photoCard, { width: `${(100 / cols) - 2}%` as any }]}>
                  <Image
                    source={{ uri: `data:image/jpeg;base64,${photo.image_base64}` }}
                    style={styles.photoImage}
                    resizeMode="cover"
                  />
                  <View style={styles.photoFooter}>
                    <Text style={styles.photoCaption} numberOfLines={2}>{photo.caption}</Text>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(photo.id)}
                      disabled={deletingId === photo.id}
                      activeOpacity={0.7}
                    >
                      {deletingId === photo.id ? (
                        <ActivityIndicator size="small" color={P.error} />
                      ) : (
                        <Ionicons name="trash-outline" size={18} color={P.error} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: "row", backgroundColor: "#F7F4F0" },
  main: { flex: 1, flexDirection: "column" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F7F4F0" },
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 24, paddingVertical: 16, backgroundColor: "#FFFFFF",
    borderBottomWidth: 1, borderBottomColor: P.border,
  },
  pageTitle: { fontSize: 20, fontWeight: "700", color: P.navy },
  topRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  userName: { fontSize: 14, color: P.muted, fontWeight: "500" },
  iconBtn: { padding: 8 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  uploadCard: {
    backgroundColor: "#FFFFFF", borderRadius: 14, padding: 20,
    marginBottom: 24, borderWidth: 1, borderColor: P.border,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: P.ink, marginBottom: 14 },
  previewImage: { width: "100%", height: 200, borderRadius: 10, marginBottom: 14 },
  uploadPlaceholder: {
    width: "100%", height: 160, borderRadius: 10, borderWidth: 2,
    borderColor: P.border, borderStyle: "dashed",
    justifyContent: "center", alignItems: "center", marginBottom: 14, gap: 8,
  },
  uploadHint: { color: P.muted, fontSize: 13 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: P.ink, marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: P.border, borderRadius: 8,
    paddingVertical: 10, paddingHorizontal: 12, fontSize: 14,
    color: P.ink, backgroundColor: "#FAFAF8", marginBottom: 12,
    outlineStyle: "none" as any,
  },
  uploadBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: P.copper, borderRadius: 10, paddingVertical: 12,
    justifyContent: "center",
  },
  uploadBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  btnDisabled: { opacity: 0.5 },
  emptyCard: {
    backgroundColor: "#FFFFFF", borderRadius: 12, padding: 32,
    alignItems: "center", borderWidth: 1, borderColor: P.border, gap: 10,
  },
  emptyText: { color: P.muted, fontSize: 14 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  photoCard: {
    backgroundColor: "#FFFFFF", borderRadius: 10,
    overflow: "hidden", borderWidth: 1, borderColor: P.border,
    marginBottom: 12,
  },
  photoImage: { width: "100%", height: 160 },
  photoFooter: {
    flexDirection: "row", alignItems: "center",
    padding: 10, gap: 8,
  },
  photoCaption: { flex: 1, fontSize: 12, color: P.muted, lineHeight: 16 },
  deleteBtn: { padding: 6 },
});
