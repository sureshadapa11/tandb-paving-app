import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert, useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/context/AuthContext";
import { api } from "@/src/api";
import AdminSidebar from "@/src/components/AdminSidebar";
import { BIZ, FAQS, SERVICES, AREAS, STATS, STEPS } from "@/src/brand";
import { P } from "@/src/adminTheme";

type Tab = "biz" | "faqs" | "hero" | "hero-images" | "services" | "areas" | "stats" | "steps";
type FAQ = { q: string; a: string };
type HeroSlide = { headline: string; sub: string };
type Service = { id: string; title: string; desc: string };
type Stat = { value: string; label: string };
type Step = { n: string; icon: string; title: string; desc: string };

const DEFAULT_SLIDES: HeroSlide[] = [
  { headline: "Professional Groundworks &\nExpert Installation", sub: "From first call to finished driveway — straightforward, transparent and stress-free." },
  { headline: "Stunning Patios &\nGarden Spaces", sub: "Natural stone, porcelain & Indian sandstone. Designed and built to impress." },
  { headline: "Resin Bound Driveways\nBuilt to Last", sub: "Seamless, permeable resin surfaces in modern finishes. Free site survey available." },
  { headline: "Beautifully Crafted\nOutdoor Living Spaces", sub: "Transform your garden into a space you love. Quality workmanship, guaranteed." },
  { headline: "Indian Sandstone —\nTimeless Elegance", sub: "Hand-laid natural sandstone that weathers beautifully and lasts a lifetime." },
];

export default function Settings() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [tab, setTab] = useState<Tab>("biz");
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedTab, setSavedTab] = useState<Tab | null>(null);

  // Business info
  const [bizName, setBizName] = useState(BIZ.name);
  const [tagline, setTagline] = useState(BIZ.tagline);
  const [since, setSince] = useState(BIZ.since);
  const [headline, setHeadline] = useState(BIZ.headline);
  const [intro, setIntro] = useState(BIZ.intro);
  const [phone, setPhone] = useState(BIZ.phone);
  const [mobile, setMobile] = useState(BIZ.mobile);
  const [email, setEmail] = useState(BIZ.email);
  const [hours, setHours] = useState(BIZ.hours);
  const [area, setArea] = useState(BIZ.area);

  // FAQs
  const [faqs, setFaqs] = useState<FAQ[]>(FAQS.map(f => ({ q: f.q, a: f.a })));
  const [editingFaq, setEditingFaq] = useState<number | null>(null);
  const [faqDraft, setFaqDraft] = useState<FAQ>({ q: "", a: "" });
  const [addingFaq, setAddingFaq] = useState(false);
  const [newFaq, setNewFaq] = useState<FAQ>({ q: "", a: "" });

  // Hero slides
  const [slides, setSlides] = useState<HeroSlide[]>(DEFAULT_SLIDES);

  // Services
  const [services, setServices] = useState<Service[]>(
    SERVICES.map(s => ({ id: s.id, title: s.title, desc: s.desc }))
  );

  // Areas
  const [areas, setAreas] = useState<string[]>([...AREAS]);
  const [newArea, setNewArea] = useState("");

  // Stats
  const [stats, setStats] = useState<Stat[]>(STATS.map(s => ({ value: s.value, label: s.label })));

  // Steps
  const [steps, setSteps] = useState<Step[]>(STEPS.map(s => ({ n: s.n, icon: s.icon, title: s.title, desc: s.desc })));

  // Hero images (base64 per slot, "" = use default local asset)
  const [heroImages, setHeroImages] = useState<string[]>(["", "", "", "", ""]);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [heroPreview, setHeroPreview] = useState<string[]>(["", "", "", "", ""]);

  useEffect(() => {
    if (!loading && !user) router.replace("/admin");
  }, [user, loading]);

  const load = useCallback(async () => {
    try {
      const data = await api.get("/site-settings");
      if (data && Object.keys(data).length > 0) {
        if (data.biz_name) setBizName(data.biz_name);
        if (data.tagline) setTagline(data.tagline);
        if (data.since) setSince(data.since);
        if (data.headline) setHeadline(data.headline);
        if (data.intro) setIntro(data.intro);
        if (data.phone) setPhone(data.phone);
        if (data.mobile) setMobile(data.mobile);
        if (data.email) setEmail(data.email);
        if (data.hours) setHours(data.hours);
        if (data.area) setArea(data.area);
        if (data.faqs?.length) setFaqs(data.faqs);
        if (data.hero_slides?.length) setSlides(data.hero_slides);
        if (data.services?.length) setServices(data.services);
        if (data.areas?.length) setAreas(data.areas);
        if (data.stats?.length) setStats(data.stats);
        if (data.steps?.length) setSteps(data.steps);
        if (data.hero_images?.length) {
          const imgs = [...data.hero_images];
          while (imgs.length < 5) imgs.push("");
          setHeroImages(imgs);
          setHeroPreview(imgs.map((b: string) => b ? `data:image/jpeg;base64,${b}` : ""));
        }
      }
    } catch {
      setFetchError(true);
    }
    setFetching(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (which: Tab) => {
    setSaving(true);
    try {
      await api.put("/site-settings", {
        biz_name: bizName, tagline, since, headline, intro,
        phone, mobile, email, hours, area,
        faqs, hero_slides: slides,
        services, areas, stats, steps,
      });
      setSavedTab(which);
      setTimeout(() => setSavedTab(null), 2500);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not save settings.");
    }
    setSaving(false);
  };

  const updateSlide = (i: number, field: keyof HeroSlide, val: string) => {
    setSlides(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  };

  const startEditFaq = (i: number) => {
    setEditingFaq(i);
    setFaqDraft({ ...faqs[i] });
  };

  const saveFaqEdit = () => {
    if (!faqDraft.q.trim() || !faqDraft.a.trim()) return;
    setFaqs(prev => prev.map((f, i) => i === editingFaq ? faqDraft : f));
    setEditingFaq(null);
  };

  const deleteFaq = (i: number) => {
    Alert.alert("Delete FAQ", "Remove this question?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => setFaqs(prev => prev.filter((_, idx) => idx !== i)) },
    ]);
  };

  const addFaq = () => {
    if (!newFaq.q.trim() || !newFaq.a.trim()) return;
    setFaqs(prev => [...prev, newFaq]);
    setNewFaq({ q: "", a: "" });
    setAddingFaq(false);
  };

  const moveFaq = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= faqs.length) return;
    const updated = [...faqs];
    [updated[i], updated[j]] = [updated[j], updated[i]];
    setFaqs(updated);
  };

  if (loading || fetching) {
    return <View style={styles.center}><ActivityIndicator size="large" color={P.copper} /></View>;
  }

  if (fetchError) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={40} color={P.muted} />
        <Text style={{ color: P.ink, fontSize: 16, fontWeight: "700", marginTop: 12 }}>Failed to load settings</Text>
        <Text style={{ color: P.muted, fontSize: 13, marginTop: 4, marginBottom: 16 }}>Check your connection and try again.</Text>
        <TouchableOpacity
          style={{ backgroundColor: P.copper, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24 }}
          onPress={() => { setFetchError(false); setFetching(true); load(); }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const updateService = (i: number, field: keyof Service, val: string) =>
    setServices(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));

  const addArea = () => {
    const v = newArea.trim();
    if (!v || areas.includes(v)) return;
    setAreas(prev => [...prev, v]);
    setNewArea("");
  };

  const removeArea = (i: number) =>
    setAreas(prev => prev.filter((_, idx) => idx !== i));

  const updateStat = (i: number, field: keyof Stat, val: string) =>
    setStats(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));

  const updateStep = (i: number, field: keyof Step, val: string) =>
    setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));

  const uploadHeroImage = async (slot: number, file: File) => {
    setUploadingSlot(slot);
    try {
      const reader = new FileReader();
      const b64: string = await new Promise((res, rej) => {
        reader.onload = () => res((reader.result as string).split(",")[1]);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      setHeroPreview(prev => { const a = [...prev]; a[slot] = `data:${file.type};base64,${b64}`; return a; });
      await api.put(`/site-settings/hero-image/${slot}`, { image_base64: b64 });
      setHeroImages(prev => { const a = [...prev]; a[slot] = b64; return a; });
      Alert.alert("Uploaded", `Slide ${slot + 1} image updated.`);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Upload failed.");
    }
    setUploadingSlot(null);
  };

  const removeHeroImage = async (slot: number) => {
    Alert.alert("Remove Image", "Restore the default image for this slide?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => {
        try {
          await api.del(`/site-settings/hero-image/${slot}`);
          setHeroImages(prev => { const a = [...prev]; a[slot] = ""; return a; });
          setHeroPreview(prev => { const a = [...prev]; a[slot] = ""; return a; });
        } catch (e: any) {
          Alert.alert("Error", e.message || "Could not remove.");
        }
      }},
    ]);
  };

  const TABS: { key: Tab; label: string; icon: any }[] = [
    { key: "biz",         label: "Business Info", icon: "business-outline" },
    { key: "faqs",        label: "FAQs",          icon: "help-circle-outline" },
    { key: "hero",        label: "Hero Text",     icon: "text-outline" },
    { key: "hero-images", label: "Hero Images",   icon: "image-outline" },
    { key: "services",    label: "Services",      icon: "construct-outline" },
    { key: "areas",       label: "Areas",         icon: "location-outline" },
    { key: "stats",       label: "Stats",         icon: "bar-chart-outline" },
    { key: "steps",       label: "How It Works",  icon: "list-outline" },
  ];

  const SaveBar = ({ which }: { which: Tab }) => (
    <View style={styles.saveBar}>
      {savedTab === which && (
        <View style={styles.savedBadge}>
          <Ionicons name="checkmark-circle" size={16} color={P.success} />
          <Text style={styles.savedText}>Saved — website updated!</Text>
        </View>
      )}
      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.btnDisabled]}
        onPress={() => save(which)}
        disabled={saving}
        activeOpacity={0.85}
      >
        {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
          <>
            <Ionicons name="cloud-upload-outline" size={16} color="#FFFFFF" />
            <Text style={styles.saveBtnText}>Save & Publish</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.root, !isDesktop && { flexDirection: "column" }]}>
      <AdminSidebar activeRoute="/admin/settings" />

      <View style={styles.main}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Text style={styles.pageTitle}>Site Settings</Text>
          <View style={styles.topRight}>
            <Text style={styles.userName}>{user?.name}</Text>
            <TouchableOpacity onPress={async () => { await logout(); router.replace("/admin"); }} style={styles.iconBtn}>
              <Ionicons name="log-out-outline" size={20} color={P.muted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab bar */}
        <View style={styles.tabBarWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarContent}>
            {TABS.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
                onPress={() => setTab(t.key)}
                activeOpacity={0.7}
              >
                <Ionicons name={t.icon} size={15} color={tab === t.key ? "#FFFFFF" : P.muted} />
                <Text style={[styles.tabBtnText, tab === t.key && styles.tabBtnTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

          {/* ── BUSINESS INFO ── */}
          {tab === "biz" && (
            <View>
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={16} color={P.copper} />
                <Text style={styles.infoText}>Changes go live on the website immediately after saving.</Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Contact & Identity</Text>

                <View style={isDesktop ? styles.row2 : undefined}>
                  <View style={[styles.field, isDesktop && { flex: 1 }]}>
                    <Text style={styles.label}>Business Name</Text>
                    <TextInput style={styles.input} value={bizName} onChangeText={setBizName} placeholderTextColor={P.muted} />
                  </View>
                  <View style={[styles.field, isDesktop && { flex: 1 }]}>
                    <Text style={styles.label}>Nav Tagline</Text>
                    <TextInput style={styles.input} value={tagline} onChangeText={setTagline} placeholder="e.g. Driveways · Patios · Paths" placeholderTextColor={P.muted} />
                  </View>
                </View>

                <View style={isDesktop ? styles.row2 : undefined}>
                  <View style={[styles.field, isDesktop && { flex: 1 }]}>
                    <Text style={styles.label}>Phone</Text>
                    <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor={P.muted} />
                  </View>
                  <View style={[styles.field, isDesktop && { flex: 1 }]}>
                    <Text style={styles.label}>Mobile</Text>
                    <TextInput style={styles.input} value={mobile} onChangeText={setMobile} keyboardType="phone-pad" placeholderTextColor={P.muted} />
                  </View>
                </View>

                <View style={isDesktop ? styles.row2 : undefined}>
                  <View style={[styles.field, isDesktop && { flex: 1 }]}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor={P.muted} />
                  </View>
                  <View style={[styles.field, isDesktop && { flex: 1 }]}>
                    <Text style={styles.label}>Working Hours</Text>
                    <TextInput style={styles.input} value={hours} onChangeText={setHours} placeholder="Mon–Sat: 7:30am – 6:00pm" placeholderTextColor={P.muted} />
                  </View>
                </View>

                <View style={isDesktop ? styles.row2 : undefined}>
                  <View style={[styles.field, isDesktop && { flex: 1 }]}>
                    <Text style={styles.label}>Coverage Area</Text>
                    <TextInput style={styles.input} value={area} onChangeText={setArea} placeholder="e.g. Essex & Suffolk" placeholderTextColor={P.muted} />
                  </View>
                  <View style={[styles.field, isDesktop && { flex: 1 }]}>
                    <Text style={styles.label}>"Trusted Since" Badge</Text>
                    <TextInput style={styles.input} value={since} onChangeText={setSince} placeholder="e.g. Trusted Since 2009" placeholderTextColor={P.muted} />
                  </View>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Homepage Copy</Text>

                <View style={styles.field}>
                  <Text style={styles.label}>Main Headline</Text>
                  <TextInput style={styles.input} value={headline} onChangeText={setHeadline} placeholder="Expert Driveways, Patios & Paths Built to Last" placeholderTextColor={P.muted} />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Intro Paragraph</Text>
                  <TextInput
                    style={[styles.input, styles.textarea]} value={intro} onChangeText={setIntro}
                    multiline numberOfLines={3} textAlignVertical="top" placeholderTextColor={P.muted}
                  />
                </View>
              </View>

              <SaveBar which="biz" />
            </View>
          )}

          {/* ── FAQs ── */}
          {tab === "faqs" && (
            <View>
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={16} color={P.copper} />
                <Text style={styles.infoText}>Edit, reorder or delete FAQs. Hit Save & Publish when done.</Text>
              </View>

              {faqs.map((faq, i) => (
                <View key={i} style={styles.faqCard}>
                  {editingFaq === i ? (
                    <View>
                      <Text style={styles.label}>Question</Text>
                      <TextInput
                        style={styles.input} value={faqDraft.q}
                        onChangeText={(v) => setFaqDraft(d => ({ ...d, q: v }))}
                        placeholderTextColor={P.muted}
                      />
                      <Text style={[styles.label, { marginTop: 8 }]}>Answer</Text>
                      <TextInput
                        style={[styles.input, styles.textarea]} value={faqDraft.a}
                        onChangeText={(v) => setFaqDraft(d => ({ ...d, a: v }))}
                        multiline numberOfLines={3} textAlignVertical="top"
                        placeholderTextColor={P.muted}
                      />
                      <View style={styles.faqEditBtns}>
                        <TouchableOpacity style={styles.faqSaveBtn} onPress={saveFaqEdit} activeOpacity={0.8}>
                          <Ionicons name="checkmark-outline" size={16} color="#FFFFFF" />
                          <Text style={styles.faqSaveBtnText}>Save</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.faqCancelBtn} onPress={() => setEditingFaq(null)} activeOpacity={0.8}>
                          <Text style={styles.faqCancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View>
                      <View style={styles.faqHeader}>
                        <Text style={styles.faqIndex}>Q{i + 1}</Text>
                        <View style={styles.faqHeaderBtns}>
                          <TouchableOpacity onPress={() => moveFaq(i, -1)} style={styles.faqIconBtn} disabled={i === 0}>
                            <Ionicons name="chevron-up-outline" size={18} color={i === 0 ? P.border : P.muted} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => moveFaq(i, 1)} style={styles.faqIconBtn} disabled={i === faqs.length - 1}>
                            <Ionicons name="chevron-down-outline" size={18} color={i === faqs.length - 1 ? P.border : P.muted} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => startEditFaq(i)} style={styles.faqIconBtn}>
                            <Ionicons name="pencil-outline" size={18} color={P.copper} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => deleteFaq(i)} style={styles.faqIconBtn}>
                            <Ionicons name="trash-outline" size={18} color={P.error} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <Text style={styles.faqQ}>{faq.q}</Text>
                      <Text style={styles.faqA}>{faq.a}</Text>
                    </View>
                  )}
                </View>
              ))}

              {/* Add new FAQ */}
              {addingFaq ? (
                <View style={[styles.faqCard, styles.addFaqCard]}>
                  <Text style={styles.cardTitle}>New Question</Text>
                  <View style={styles.field}>
                    <Text style={styles.label}>Question</Text>
                    <TextInput
                      style={styles.input} value={newFaq.q}
                      onChangeText={(v) => setNewFaq(f => ({ ...f, q: v }))}
                      placeholder="e.g. How long does installation take?" placeholderTextColor={P.muted}
                    />
                  </View>
                  <View style={styles.field}>
                    <Text style={styles.label}>Answer</Text>
                    <TextInput
                      style={[styles.input, styles.textarea]} value={newFaq.a}
                      onChangeText={(v) => setNewFaq(f => ({ ...f, a: v }))}
                      multiline numberOfLines={3} textAlignVertical="top"
                      placeholder="Write the answer..." placeholderTextColor={P.muted}
                    />
                  </View>
                  <View style={styles.faqEditBtns}>
                    <TouchableOpacity style={styles.faqSaveBtn} onPress={addFaq} activeOpacity={0.8}>
                      <Ionicons name="add-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.faqSaveBtnText}>Add FAQ</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.faqCancelBtn} onPress={() => { setAddingFaq(false); setNewFaq({ q: "", a: "" }); }}>
                      <Text style={styles.faqCancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={styles.addFaqBtn} onPress={() => setAddingFaq(true)} activeOpacity={0.8}>
                  <Ionicons name="add-circle-outline" size={18} color={P.copper} />
                  <Text style={styles.addFaqBtnText}>Add New FAQ</Text>
                </TouchableOpacity>
              )}

              <SaveBar which="faqs" />
            </View>
          )}

          {/* ── HERO TEXT ── */}
          {tab === "hero" && (
            <View>
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={16} color={P.copper} />
                <Text style={styles.infoText}>Edit the headline and subtitle for each hero slide. Images stay the same.</Text>
              </View>

              {slides.map((slide, i) => (
                <View key={i} style={styles.card}>
                  <View style={styles.slideHeader}>
                    <View style={styles.slideBadge}>
                      <Text style={styles.slideBadgeText}>Slide {i + 1}</Text>
                    </View>
                    <Text style={styles.slidePreview} numberOfLines={1}>{slide.headline.replace("\n", " ")}</Text>
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>Headline</Text>
                    <TextInput
                      style={[styles.input, styles.textarea]}
                      value={slide.headline}
                      onChangeText={(v) => updateSlide(i, "headline", v)}
                      multiline numberOfLines={2} textAlignVertical="top"
                      placeholderTextColor={P.muted}
                    />
                    <Text style={styles.hint}>Use \n for a line break</Text>
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>Subtitle</Text>
                    <TextInput
                      style={[styles.input, styles.textarea]}
                      value={slide.sub}
                      onChangeText={(v) => updateSlide(i, "sub", v)}
                      multiline numberOfLines={2} textAlignVertical="top"
                      placeholderTextColor={P.muted}
                    />
                  </View>
                </View>
              ))}

              <SaveBar which="hero" />
            </View>
          )}

          {/* ── SERVICES ── */}
          {tab === "services" && (
            <View>
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={16} color={P.copper} />
                <Text style={styles.infoText}>Edit the name and description of each service. Icons and images stay the same.</Text>
              </View>

              {services.map((svc, i) => (
                <View key={svc.id} style={styles.card}>
                  <View style={styles.slideHeader}>
                    <View style={styles.slideBadge}>
                      <Text style={styles.slideBadgeText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.slidePreview} numberOfLines={1}>{svc.title}</Text>
                  </View>
                  <View style={styles.field}>
                    <Text style={styles.label}>Service Name</Text>
                    <TextInput
                      style={styles.input} value={svc.title}
                      onChangeText={(v) => updateService(i, "title", v)}
                      placeholderTextColor={P.muted}
                    />
                  </View>
                  <View style={styles.field}>
                    <Text style={styles.label}>Short Description</Text>
                    <TextInput
                      style={[styles.input, styles.textarea]} value={svc.desc}
                      onChangeText={(v) => updateService(i, "desc", v)}
                      multiline numberOfLines={2} textAlignVertical="top"
                      placeholderTextColor={P.muted}
                    />
                  </View>
                </View>
              ))}

              <SaveBar which="services" />
            </View>
          )}

          {/* ── AREAS ── */}
          {tab === "areas" && (
            <View>
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={16} color={P.copper} />
                <Text style={styles.infoText}>Add or remove towns and areas you cover. Tap × to remove.</Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Coverage Towns</Text>
                <View style={styles.areaGrid}>
                  {areas.map((a, i) => (
                    <View key={i} style={styles.areaChip}>
                      <Text style={styles.areaChipText}>{a}</Text>
                      <TouchableOpacity onPress={() => removeArea(i)} style={styles.areaChipRemove} activeOpacity={0.7}>
                        <Ionicons name="close" size={13} color={P.muted} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>

                <View style={styles.addAreaRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={newArea} onChangeText={setNewArea}
                    placeholder="Add a town…" placeholderTextColor={P.muted}
                    onSubmitEditing={addArea} returnKeyType="done"
                  />
                  <TouchableOpacity style={styles.addAreaBtn} onPress={addArea} activeOpacity={0.8}>
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

              <SaveBar which="areas" />
            </View>
          )}

          {/* ── STATS ── */}
          {tab === "stats" && (
            <View>
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={16} color={P.copper} />
                <Text style={styles.infoText}>Update the 4 headline numbers shown in the stats bar on the homepage.</Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Homepage Stats</Text>
                {stats.map((st, i) => (
                  <View key={i} style={[styles.row2, { marginBottom: 12 }]}>
                    <View style={[styles.field, { flex: 0.4, marginBottom: 0 }]}>
                      <Text style={styles.label}>Value</Text>
                      <TextInput
                        style={styles.input} value={st.value}
                        onChangeText={(v) => updateStat(i, "value", v)}
                        placeholder="e.g. 15+"
                        placeholderTextColor={P.muted}
                      />
                    </View>
                    <View style={[styles.field, { flex: 1, marginBottom: 0 }]}>
                      <Text style={styles.label}>Label</Text>
                      <TextInput
                        style={styles.input} value={st.label}
                        onChangeText={(v) => updateStat(i, "label", v)}
                        placeholder="e.g. Years Trading"
                        placeholderTextColor={P.muted}
                      />
                    </View>
                  </View>
                ))}
              </View>

              <SaveBar which="stats" />
            </View>
          )}

          {/* ── HOW IT WORKS (STEPS) ── */}
          {tab === "steps" && (
            <View>
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={16} color={P.copper} />
                <Text style={styles.infoText}>Edit the title and description for each step. Step numbers and icons stay the same.</Text>
              </View>

              {steps.map((step, i) => (
                <View key={step.n} style={styles.card}>
                  <View style={styles.slideHeader}>
                    <View style={styles.slideBadge}>
                      <Text style={styles.slideBadgeText}>Step {step.n}</Text>
                    </View>
                    <Text style={styles.slidePreview} numberOfLines={1}>{step.title}</Text>
                  </View>
                  <View style={styles.field}>
                    <Text style={styles.label}>Title</Text>
                    <TextInput
                      style={styles.input} value={step.title}
                      onChangeText={(v) => updateStep(i, "title", v)}
                      placeholderTextColor={P.muted}
                    />
                  </View>
                  <View style={styles.field}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                      style={[styles.input, styles.textarea]} value={step.desc}
                      onChangeText={(v) => updateStep(i, "desc", v)}
                      multiline numberOfLines={2} textAlignVertical="top"
                      placeholderTextColor={P.muted}
                    />
                  </View>
                </View>
              ))}

              <SaveBar which="steps" />
            </View>
          )}

          {/* ── HERO IMAGES ── */}
          {tab === "hero-images" && (
            <View>
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={16} color={P.copper} />
                <Text style={styles.infoText}>Replace the background image for any hero slide. Saves immediately on upload. Recommended: 1920×1080 JPG.</Text>
              </View>

              {DEFAULT_SLIDES.map((slide, i) => (
                <View key={i} style={styles.card}>
                  <View style={styles.slideHeader}>
                    <View style={styles.slideBadge}>
                      <Text style={styles.slideBadgeText}>Slide {i + 1}</Text>
                    </View>
                    <Text style={styles.slidePreview} numberOfLines={1}>{slide.headline.replace("\n", " ")}</Text>
                  </View>

                  {heroPreview[i] ? (
                    <View style={styles.heroImgPreviewWrap}>
                      <Image source={{ uri: heroPreview[i] }} style={styles.heroImgPreview} resizeMode="cover" />
                      <TouchableOpacity style={styles.heroImgRemove} onPress={() => removeHeroImage(i)} activeOpacity={0.8}>
                        <Ionicons name="trash-outline" size={14} color="#FFFFFF" />
                        <Text style={styles.heroImgRemoveText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.heroImgPlaceholder}>
                      <Ionicons name="image-outline" size={32} color={P.muted} />
                      <Text style={styles.heroImgPlaceholderText}>Using default image</Text>
                    </View>
                  )}

                  {/* File input — web only */}
                  <View style={styles.heroUploadRow}>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      id={`hero-img-${i}`}
                      onChange={(e: any) => {
                        const file = e.target.files?.[0];
                        if (file) uploadHeroImage(i, file);
                        e.target.value = "";
                      }}
                    />
                    <TouchableOpacity
                      style={[styles.heroUploadBtn, uploadingSlot === i && styles.btnDisabled]}
                      disabled={uploadingSlot === i}
                      activeOpacity={0.8}
                      onPress={() => {
                        const el = document.getElementById(`hero-img-${i}`);
                        if (el) (el as HTMLInputElement).click();
                      }}
                    >
                      {uploadingSlot === i
                        ? <ActivityIndicator size="small" color="#FFFFFF" />
                        : <>
                            <Ionicons name="cloud-upload-outline" size={15} color="#FFFFFF" />
                            <Text style={styles.heroUploadBtnText}>{heroImages[i] ? "Replace Image" : "Upload Image"}</Text>
                          </>
                      }
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
  root: { flex: 1, flexDirection: "row", backgroundColor: P.bg },
  main: { flex: 1, flexDirection: "column" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: P.bg },
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 24, paddingVertical: 16, backgroundColor: P.card,
    borderBottomWidth: 1, borderBottomColor: P.border,
  },
  pageTitle: { fontSize: 20, fontWeight: "700", color: P.navy },
  topRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  userName: { fontSize: 14, color: P.muted, fontWeight: "500" },
  iconBtn: { padding: 8 },
  tabBarWrap: {
    height: 58, flexShrink: 0,
    backgroundColor: P.card, borderBottomWidth: 1, borderBottomColor: P.border,
  },
  tabBarContent: { paddingHorizontal: 16, gap: 8, flexDirection: "row", alignItems: "center", height: 58 },
  tabBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, height: 38,
    backgroundColor: P.bg, borderWidth: 1, borderColor: P.border,
  },
  tabBtnActive: { backgroundColor: P.copper, borderColor: P.copper },
  tabBtnText: { fontSize: 14, fontWeight: "600", color: P.muted },
  tabBtnTextActive: { color: "#FFFFFF" },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 60 },
  infoBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FEF3C7", borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: "#FDE68A", marginBottom: 16,
  },
  infoText: { flex: 1, fontSize: 13, color: "#92400E", lineHeight: 18 },
  card: {
    backgroundColor: P.card, borderRadius: 14, padding: 20,
    borderWidth: 1, borderColor: P.border, marginBottom: 16,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: P.navy, marginBottom: 16 },
  row2: { flexDirection: "row", gap: 12 },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "600", color: P.ink, marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: P.border, borderRadius: 8,
    paddingVertical: 10, paddingHorizontal: 12, fontSize: 14,
    color: P.ink, backgroundColor: "#FAFAF8", outlineStyle: "none" as any,
  },
  textarea: { minHeight: 72, paddingTop: 10 },
  hint: { fontSize: 11, color: P.muted, marginTop: 4 },
  saveBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "flex-end",
    gap: 12, marginTop: 8, paddingTop: 16,
    borderTopWidth: 1, borderTopColor: P.border,
  },
  savedBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  savedText: { fontSize: 13, color: P.success, fontWeight: "600" },
  saveBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: P.copper, borderRadius: 10,
    paddingVertical: 12, paddingHorizontal: 22,
  },
  saveBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  btnDisabled: { opacity: 0.6 },
  faqCard: {
    backgroundColor: P.card, borderRadius: 12, padding: 16,
    marginBottom: 10, borderWidth: 1, borderColor: P.border,
  },
  addFaqCard: { borderColor: P.copper, borderStyle: "dashed" },
  faqHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  faqIndex: {
    fontSize: 11, fontWeight: "800", color: P.copper,
    backgroundColor: "#FEF3C7", paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20, marginRight: 10,
  },
  faqHeaderBtns: { flex: 1, flexDirection: "row", justifyContent: "flex-end", gap: 4 },
  faqIconBtn: { padding: 6, borderRadius: 8, backgroundColor: P.bg },
  faqQ: { fontSize: 14, fontWeight: "700", color: P.ink, marginBottom: 6 },
  faqA: { fontSize: 13, color: P.muted, lineHeight: 19 },
  faqEditBtns: { flexDirection: "row", gap: 10, marginTop: 12 },
  faqSaveBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: P.success, borderRadius: 8, paddingVertical: 11,
  },
  faqSaveBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  faqCancelBtn: {
    flex: 1, alignItems: "center", justifyContent: "center",
    backgroundColor: P.bg, borderRadius: 8, paddingVertical: 11,
    borderWidth: 1, borderColor: P.border,
  },
  faqCancelBtnText: { color: P.muted, fontSize: 14, fontWeight: "600" },
  addFaqBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderWidth: 1.5, borderColor: P.copper, borderStyle: "dashed",
    borderRadius: 12, paddingVertical: 14, marginBottom: 16,
  },
  addFaqBtnText: { color: P.copper, fontSize: 14, fontWeight: "700" },
  slideHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  slideBadge: {
    backgroundColor: P.navy, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  slideBadgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
  slidePreview: { flex: 1, fontSize: 13, color: P.muted, fontStyle: "italic" },
  areaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  areaChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#F0EBE4", borderRadius: 20, borderWidth: 1, borderColor: P.border,
    paddingVertical: 6, paddingHorizontal: 12,
  },
  areaChipText: { fontSize: 13, fontWeight: "600", color: P.ink },
  areaChipRemove: { padding: 2 },
  addAreaRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  addAreaBtn: {
    width: 42, height: 42, borderRadius: 10,
    backgroundColor: P.copper, alignItems: "center", justifyContent: "center",
  },
  heroImgPreviewWrap: { borderRadius: 10, overflow: "hidden", marginBottom: 12, position: "relative" },
  heroImgPreview: { width: "100%", height: 160, borderRadius: 10 },
  heroImgRemove: {
    position: "absolute", top: 8, right: 8,
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(220,38,38,0.85)", borderRadius: 8,
    paddingVertical: 5, paddingHorizontal: 10,
  },
  heroImgRemoveText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  heroImgPlaceholder: {
    height: 100, borderRadius: 10, borderWidth: 1.5, borderColor: P.border,
    borderStyle: "dashed", alignItems: "center", justifyContent: "center",
    backgroundColor: "#FAFAF8", marginBottom: 12, gap: 6,
  },
  heroImgPlaceholderText: { fontSize: 13, color: P.muted },
  heroUploadRow: { flexDirection: "row" },
  heroUploadBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: P.navy, borderRadius: 10,
    paddingVertical: 11, paddingHorizontal: 18,
  },
  heroUploadBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
});
