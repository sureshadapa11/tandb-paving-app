// T&B Paving — all static brand content (owner can edit anytime)
export const BIZ = {
  name: "T&B Paving",
  tagline: "Driveways · Patios · Paths",
  since: "Trusted Since 2009",
  headline: "Expert Driveways, Patios & Paths Built to Last",
  intro:
    "From your first call to a finished driveway, we keep things straightforward, transparent and stress-free at every stage.",
  phone: "01376 618683",
  mobile: "07717 315528",
  email: "bbirdpaving@gmail.com",
  hours: "Mon–Sat: 7:30am – 6:00pm",
  area: "Manchester & the North West",
};

export const STATS = [
  { value: "15+", label: "Years Trading" },
  { value: "300+", label: "Driveways Installed" },
  { value: "10yr", label: "Guarantee" },
  { value: "5★", label: "Rated" },
];

export const TRUST = [
  { icon: "shield-checkmark", label: "10-Year Guarantee" },
  { icon: "ribbon", label: "Checkatrade Approved" },
  { icon: "clipboard", label: "Free Site Survey" },
  { icon: "star", label: "5-Star Rated" },
  { icon: "lock-closed", label: "Fully Insured" },
];

export const SERVICES = [
  { id: "block-paving", icon: "grid",               title: "Block Paving",               desc: "Durable, stylish driveways in countless colours and patterns.",           bgImg: require("../assets/images/block-paving-lawn.jpg") },
  { id: "patios",       icon: "square",              title: "Patios & Paving",            desc: "Natural stone, porcelain & concrete patios built to impress.",            bgImg: require("../assets/images/grey-porcelain-patio.jpg") },
  { id: "cleaning",     icon: "water",               title: "Driveway Cleaning & Sealing",desc: "Restore and protect your existing driveway for years to come.",           bgImg: require("../assets/images/sandstone-patio.jpg") },
  { id: "concrete",     icon: "cube",                title: "Concrete Driveways",         desc: "Hard-wearing, low-maintenance concrete surfaces.",                        bgImg: require("../assets/images/hero-excavator.webp") },
  { id: "tarmac",       icon: "car-sport",           title: "Tarmac Driveways",           desc: "Smooth, cost-effective tarmac for drives of any size.",                  bgImg: require("../assets/images/block-paving-garden.jpg") },
  { id: "gravel",       icon: "ellipsis-horizontal", title: "Gravel & Shingle",           desc: "Decorative, well-drained gravel finishes.",                              bgImg: require("../assets/images/gravel-driveway.jpg") },
  { id: "resin",        icon: "color-fill",          title: "Resin Bound Surfacing",      desc: "Seamless, permeable resin in modern finishes.",                          bgImg: require("../assets/images/large-resin-driveway.jpg") },
  { id: "permeable",    icon: "rainy",               title: "Permeable Paving",           desc: "SuDS-compliant, drainage-friendly paving.",                              bgImg: require("../assets/images/poolside-paving.jpg") },
  { id: "bonded",       icon: "apps",                title: "Bonded Aggregate",           desc: "Textured, slip-resistant decorative surfacing.",                         bgImg: require("../assets/images/resin-installation.jpg") },
  { id: "soakaways",    icon: "git-network",         title: "Soakaways & Drainage",       desc: "Proper drainage solutions that genuinely last.",                         bgImg: require("../assets/images/hero-excavator.webp") },
  { id: "paths",        icon: "walk",                title: "Garden Paths",               desc: "Beautiful, safe paths around your home and garden.",                     bgImg: require("../assets/images/garden-steps-1.jpg") },
];

export const STEPS = [
  { n: "01", icon: "call", title: "Free Consultation", desc: "Tell us what you need — we'll arrange a free, no-obligation visit." },
  { n: "02", icon: "document-text", title: "Design & Quote", desc: "Clear, transparent pricing with no hidden costs." },
  { n: "03", icon: "hammer", title: "Expert Installation", desc: "Our tidy, professional team gets the job done right." },
  { n: "04", icon: "shield-checkmark", title: "10-Year Guarantee", desc: "Relax — your new surface is built to last and fully guaranteed." },
];

// Real T&B Paving project photos
export const HERO_IMG = require("../assets/images/hero-excavator.webp");
export const ABOUT_IMG = require("../assets/images/grey-porcelain-patio.jpg");

export const GALLERY: { img: any; label: string; town: string }[] = [
  { img: require("../assets/images/grey-porcelain-patio.jpg"),   label: "Grey Porcelain Patio",          town: "Essex" },
  { img: require("../assets/images/grey-porcelain-patio-2.jpg"), label: "Porcelain Patio & Garden",      town: "Essex" },
  { img: require("../assets/images/large-resin-driveway.jpg"),   label: "Large Resin Bound Driveway",    town: "Suffolk" },
  { img: require("../assets/images/resin-installation.jpg"),     label: "Resin Driveway Installation",   town: "Suffolk" },
  { img: require("../assets/images/poolside-paving.jpg"),        label: "Poolside Porcelain Paving",     town: "North West" },
  { img: require("../assets/images/sandstone-patio.jpg"),        label: "Indian Sandstone Patio",        town: "Stockport" },
  { img: require("../assets/images/patio-garden.jpg"),           label: "Patio & Garden Design",         town: "Salford" },
  { img: require("../assets/images/compass-feature.jpg"),        label: "Bespoke Compass Feature",       town: "North West" },
  { img: require("../assets/images/block-paving-lawn.jpg"),      label: "Block Paving & Turf Laying",    town: "Manchester" },
  { img: require("../assets/images/block-paving-garden.jpg"),    label: "Block Paving & Garden Path",    town: "Bolton" },
  { img: require("../assets/images/gravel-driveway.jpg"),        label: "Gravel Driveway",               town: "Chorley" },
  { img: require("../assets/images/circular-patio.jpg"),         label: "Circular Feature Patio",        town: "Cheshire" },
  { img: require("../assets/images/garden-steps-1.jpg"),         label: "Garden Steps & Lawn",           town: "Altrincham" },
  { img: require("../assets/images/garden-steps-2.jpg"),         label: "Garden Paths & Steps",          town: "Sale" },
  { img: require("../assets/images/sandstone-steps.jpg"),        label: "Sandstone Patio & Steps",       town: "Bury" },
  { img: require("../assets/images/hero-excavator.webp"),        label: "Professional Groundworks",      town: "North West" },
];

export const TESTIMONIALS = [
  { name: "Sarah K.", town: "Salford", job: "Natural Stone Patio", stars: 5, text: "Had our patio replaced with natural stone. The team were polite, punctual, and the result is stunning." },
  { name: "James R.", town: "Stockport", job: "Block Paving Driveway", stars: 5, text: "Brilliant from start to finish. Fair quote, no mess left behind and the driveway looks fantastic." },
  { name: "Linda M.", town: "Bolton", job: "Resin Driveway", stars: 5, text: "Really pleased with our new resin drive. Professional, tidy and exactly what was quoted." },
];

export const REVIEW_PLATFORMS = ["Checkatrade", "Google", "Facebook", "Yell", "Trustpilot"];

export const AREAS = [
  "Manchester", "Salford", "Bolton", "Bury", "Wigan", "Oldham", "Rochdale",
  "Stockport", "Trafford", "Tameside", "Leigh", "Warrington", "Chorley",
  "Preston", "Blackburn", "Burnley", "Altrincham", "Sale", "Stretford", "Accrington",
];

export const FAQS = [
  { q: "How long does a typical driveway take?", a: "Most driveways are completed in 3–7 days depending on size and finish, weather permitting. We'll give you a clear timeline with your quote." },
  { q: "Do you offer a guarantee?", a: "Yes — every installation comes with our 10-year workmanship guarantee for complete peace of mind." },
  { q: "Can you match my existing paving?", a: "Absolutely. We'll source materials to complement your home and any existing surfaces." },
  { q: "Do I need planning permission?", a: "Most projects don't, especially with permeable surfaces. We'll advise you during your free site survey." },
  { q: "Which areas do you cover?", a: "All of Manchester and the North West. Check our coverage list or call us to confirm your area." },
  { q: "How much does a new driveway cost?", a: "It depends on size, materials and groundwork. Try our instant AI estimate, or book a free, no-obligation site survey for an exact price." },
];
