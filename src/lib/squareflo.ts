export type CmsField = {
  key: string;
  label?: string;
  type?: string;
  value?: unknown;
  locked?: boolean;
  source_field?: string;
  [key: string]: unknown;
};

export type CmsBlock = {
  type: string;
  id?: string;
  content?: string;
  text?: string;
  level?: number;
  src?: string;
  alt?: string;
  url?: string;
  label?: string;
  variant?: string;
  style?: string;
  linkType?: string;
  linkValue?: string;
  align?: string;
  size?: number;
  height?: number;
  layout?: string;
  aspectRatio?: string;
  clickAction?: string;
  count?: number;
  fields?: CmsField[];
  section_template_id?: string;
  section_slug?: string;
  section_name?: string;
  section_description?: string;
  section_type?: string;
  dynamic_source?: string;
  dynamic_feed_id?: string;
  module_id?: string;
  feed_id?: string;
  columns?: Array<{ blocks?: CmsBlock[] }>;
  left?: { blocks?: CmsBlock[] };
  right?: { blocks?: CmsBlock[] };
  [key: string]: unknown;
};

export type CmsPage = {
  id?: string;
  slug: string;
  title: string;
  page_type?: string;
  is_home?: boolean;
  published?: boolean;
  headless_content?: {
    left?: { blocks?: CmsBlock[] };
    right?: { blocks?: CmsBlock[] };
  };
  hide_from_nav?: boolean;
  meta?: {
    title?: string;
    description?: string;
    og_title?: string;
    og_description?: string;
    og_image?: string;
    canonical_url?: string | null;
    no_index?: boolean;
    no_follow?: boolean;
    structured_data?: unknown;
  };
  custom_css?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type NavItem = {
  id: string;
  label: string;
  type: "label" | "page" | "external" | string;
  url?: string;
  open_in_new_tab?: boolean;
  location?: "header" | "footer" | "all" | string;
  sort_order?: number;
  children?: NavItem[];
};

export type SiteSettings = {
  site: {
    name: string;
    domain?: string;
    description?: string;
  };
  business: {
    name: string;
    short_description?: string;
    phone?: string;
    email?: string;
    timezone?: string;
    location_count?: number;
    logos?: {
      rectangular?: string;
      square?: string;
      favicon?: string;
    };
    locations?: Array<{
      id?: string;
      name?: string;
      street_address?: string;
      unit?: string;
      city?: string;
      state_province?: string;
      postal_code?: string;
      phone?: string;
      email?: string;
      place_id?: string | null;
      google_places?: {
        rating?: number;
        total_reviews?: number;
        business_status?: string;
        google_maps_url?: string;
        website?: string;
        phone?: string;
        phone_international?: string;
        open_now?: boolean;
        hours?: string[];
        types?: string[];
        lat?: number;
        lng?: number;
      } | null;
    }>;
  };
  design?: {
    colors?: Record<string, string>;
    typography?: Record<string, Record<string, string | number>>;
    buttons?: Record<string, Record<string, string | number>>;
    forms?: Record<string, string | number>;
    fonts?: Record<string, unknown>;
  };
  seo?: {
    default_title?: string;
    title_template?: string;
    default_description?: string;
    default_og_image?: string;
  };
};

export type Faq = {
  id: string;
  question: string;
  answer: string;
  category?: string;
  tags?: string[];
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
};

export type Review = {
  id: string;
  author_name: string;
  author_photo_url?: string;
  rating: number;
  text: string;
  relative_time?: string;
  review_time?: string;
  language?: string;
  source?: string;
  featured?: boolean;
  tags?: string[];
  location_id?: string;
  created_at?: string;
};

export type CmsFormField = {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  placeholder?: string;
  options?: Array<string | { label: string; value: string }>;
};

export type CmsForm = {
  id: string;
  name: string;
  fields: CmsFormField[];
  submit_label?: string;
  success_message?: string;
};

export type CmsModule = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  fields?: Array<{
    key: string;
    label: string;
    type: string;
    required?: boolean;
  }>;
  taxonomies?: unknown[];
  statuses?: unknown[];
};

export type FeedEntry = {
  id: string;
  title: string;
  slug: string;
  status?: string;
  published?: boolean;
  data?: Record<string, unknown>;
  categories?: string[];
  tags?: string[];
  author?: {
    first_name?: string;
    last_name?: string;
  };
  view_count?: number;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
  meta?: {
    title?: string;
    description?: string;
    og_title?: string;
    og_description?: string;
    og_image?: string;
    canonical_url?: string | null;
  };
};

export type FeedEntriesPage = {
  entries: FeedEntry[];
  total: number;
  limit: number;
  offset: number;
  module: string;
};

const DEFAULT_API_URL = "https://squareflo.com/api/v1";

export const squarefloApiUrl = (
  import.meta.env.VITE_SQUAREFLO_API_URL || DEFAULT_API_URL
).replace(/\/$/, "");

export const squarefloApiKey =
  import.meta.env.VITE_SQUAREFLO_API_KEY ||
  import.meta.env.VITE_SQUAREFLO_DRAFT_KEY ||
  "";

export const squarefloProxyUrl = import.meta.env.VITE_SQUAREFLO_PROXY_URL || "/api/squareflo";

export const contactFormId = import.meta.env.VITE_SQUAREFLO_CONTACT_FORM_ID || "";

export const hasCmsCredentials = Boolean(squarefloApiKey || squarefloProxyUrl);

export function normalizeContentKey(value: string) {
  return value.replace(/[\s_-]/g, "").toLowerCase();
}

export function slugifyContent(value?: string) {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function stringFrom(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map(stringFrom).filter(Boolean).join(" ");
  }
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (!value || typeof value !== "object") return "";

  const record = value as Record<string, unknown>;
  return stringFrom(
    record.text ||
      record.content ||
      record.label ||
      record.title ||
      record.name ||
      record.url ||
      record.src ||
      record.value,
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function contentBlocksToHtml(value: unknown) {
  if (!Array.isArray(value)) return stringFrom(value);

  return value
    .map((block) => {
      if (!block || typeof block !== "object") return "";
      const record = block as Record<string, unknown>;
      const type = normalizeContentKey(stringFrom(record.type));
      const text = stringFrom(record.content || record.text || record.value);
      if (!text) return "";
      if (type === "heading" || type === "h2" || type === "h3") return `<h2>${escapeHtml(text)}</h2>`;
      return `<p>${escapeHtml(text)}</p>`;
    })
    .filter(Boolean)
    .join("");
}

export function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function isEmpty(value: unknown) {
  return (
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  );
}

export function imageFrom(value: unknown) {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  return stringFrom(record.src || record.url || record.image || record.secure_url || record.value);
}

function findDataValue(data: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const exact = data[key];
    if (!isEmpty(exact)) return exact;
  }

  const normalizedKeys = keys.map(normalizeContentKey);
  for (const [key, value] of Object.entries(data)) {
    const normalized = normalizeContentKey(key);
    if (normalizedKeys.includes(normalized) && !isEmpty(value)) return value;
  }

  return undefined;
}

export function feedEntryDataValue(entry: FeedEntry, keys: string | string[]) {
  const keyList = Array.isArray(keys) ? keys : [keys];
  const data = entry.data || {};
  const normalizedKeys = keyList.map(normalizeContentKey);

  if (normalizedKeys.some((key) => key === "title" || key === "__title")) return entry.title;
  if (normalizedKeys.some((key) => key === "slug" || key === "__slug")) return entry.slug;
  if (normalizedKeys.some((key) => key === "status")) return entry.status;
  if (normalizedKeys.some((key) => key === "createdat" || key === "__createdat")) return entry.created_at;
  if (normalizedKeys.some((key) => key === "updatedat")) return entry.updated_at;
  if (normalizedKeys.some((key) => key === "viewcount")) return entry.view_count;
  if (normalizedKeys.some((key) => key === "sortorder")) return entry.sort_order;
  if (normalizedKeys.some((key) => key === "tags" || key === "__tags")) return entry.tags || data.tags;
  if (normalizedKeys.some((key) => key === "categories" || key === "category" || key === "__category")) {
    return entry.categories || data.category;
  }
  if (normalizedKeys.some((key) => key === "author" || key === "creator")) {
    return [entry.author?.first_name, entry.author?.last_name].filter(Boolean).join(" ");
  }

  return findDataValue(data, keyList);
}

function firstText(entry: FeedEntry, keys: string[]) {
  return stringFrom(feedEntryDataValue(entry, keys));
}

export function feedEntryTitle(entry: FeedEntry) {
  return firstText(entry, ["h1_heading", "heading", "title"]) || entry.title;
}

export function feedEntryBodyHtml(entry: FeedEntry) {
  const raw = feedEntryDataValue(entry, [
    "body",
    "content",
    "article",
    "post_body",
    "description",
    "details",
    "answer",
    "testimonial",
    "review",
  ]);
  return contentBlocksToHtml(raw);
}

export function feedEntryDescription(entry: FeedEntry) {
  const value =
    entry.meta?.description ||
    firstText(entry, [
      "excerpt",
      "summary",
      "first_paragraph",
      "description",
      "short_description",
      "intro",
      "answer",
      "body",
      "content",
    ]);
  return stripHtml(value);
}

export function feedEntryImage(entry: FeedEntry) {
  return (
    imageFrom(
      feedEntryDataValue(entry, [
        "featured_image",
        "thumbnail_image",
        "cover_image",
        "image",
        "photo",
        "og_image",
      ]),
    ) ||
    entry.meta?.og_image ||
    ""
  );
}

export function feedEntryAuthor(entry: FeedEntry) {
  return firstText(entry, ["author", "writer", "created_by", "name"]) ||
    [entry.author?.first_name, entry.author?.last_name].filter(Boolean).join(" ");
}

export function feedEntryDate(entry: FeedEntry) {
  return firstText(entry, [
    "date",
    "published_at",
    "event_date",
    "start_date",
    "start",
    "created_at",
  ]) || entry.created_at || "";
}

export function feedEntryStartDate(entry: FeedEntry) {
  return firstText(entry, ["start", "start_date", "event_date", "date"]) || entry.created_at || "";
}

export function feedEntryEndDate(entry: FeedEntry) {
  return firstText(entry, ["end", "end_date", "event_end_date"]);
}

export function feedEntryLocation(entry: FeedEntry) {
  return firstText(entry, ["location", "venue", "address", "event_location"]);
}

export function feedEntryTags(entry: FeedEntry) {
  const raw = feedEntryDataValue(entry, ["tags", "__tags"]);
  if (Array.isArray(raw)) return raw.map(stringFrom).filter(Boolean);
  if (typeof raw === "string") return raw.split(",").map((tag) => tag.trim()).filter(Boolean);
  return entry.tags || [];
}

export function feedEntryCategories(entry: FeedEntry) {
  const raw = feedEntryDataValue(entry, ["categories", "category", "__category"]);
  if (Array.isArray(raw)) return raw.map(stringFrom).filter(Boolean);
  if (typeof raw === "string") return [raw].filter(Boolean);
  return entry.categories || [];
}

function buildCmsRequest(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>,
) {
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const headers: Record<string, string> = {};
  const usesDirectApi = Boolean(squarefloApiKey);
  const url = usesDirectApi
    ? new URL(`${squarefloApiUrl}${path}`)
    : new URL(squarefloProxyUrl, window.location.origin);

  if (usesDirectApi) {
    headers["x-api-key"] = squarefloApiKey;
  } else {
    url.searchParams.set("path", path.replace(/^\/+/, ""));
  }

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return { headers, url };
}

export async function cms<T>(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  if (!squarefloApiKey && !squarefloProxyUrl) {
    throw new Error("Squareflo API key is not configured.");
  }

  const { headers, url } = buildCmsRequest(endpoint, params);

  const response = await fetch(url.toString(), {
    headers,
  });

  if (!response.ok) {
    throw new Error(`Squareflo API error ${response.status} for ${endpoint}`);
  }

  return response.json() as Promise<T>;
}

const fallbackSectionBlocks: CmsBlock[] = [
  {
    type: "section",
    id: "fallback-hero",
    section_slug: "hero-banner",
    section_name: "Hero Banner",
    fields: [
      { key: "heading", type: "text", source_field: "title", value: "", locked: true },
      { key: "description", type: "text", source_field: "description", value: "", locked: true },
      { key: "background_image", type: "image", source_field: "og_image", value: "", locked: true },
    ],
  },
  {
    type: "section",
    id: "fallback-proof",
    section_slug: "trust-band",
    section_name: "Trust Band",
    fields: [
      {
        key: "items",
        type: "json",
        value: [
          { label: "Frontend", title: "React interface" },
          { label: "Content", title: "Squareflo API" },
          { label: "Design", title: "CMS design tokens" },
          { label: "Launch", title: "Vercel ready" },
        ],
      },
    ],
  },
  {
    type: "section",
    id: "fallback-services",
    section_slug: "services",
    section_name: "Services",
    fields: [
      { key: "eyebrow", type: "text", value: "Services" },
      {
        key: "heading",
        type: "text",
        value: "Built for the moment when your website needs to look established now.",
      },
      {
        key: "description",
        type: "text",
        value:
          "The frontend is structured for dynamic CMS content while keeping the visual system focused, premium, and easy to scan.",
      },
      { key: "module", type: "text", value: "services" },
      { key: "limit", type: "number", value: 3 },
      { key: "view_all_label", type: "text", value: "View all services" },
      { key: "view_all_url", type: "text", value: "/services" },
    ],
  },
  {
    type: "section",
    id: "fallback-architecture",
    section_slug: "feature-architecture",
    section_name: "Headless architecture",
    fields: [
      { key: "eyebrow", type: "text", value: "Headless architecture" },
      {
        key: "heading",
        type: "text",
        value: "CMS data becomes a composed, branded frontend instead of a generic template.",
      },
      {
        key: "description",
        type: "text",
        value:
          "Pages, settings, navigation, reviews, FAQs, and form structures are fetched from Squareflo, then styled through a responsive React presentation layer.",
      },
      {
        key: "items",
        type: "json",
        value: [
          { text: "Runtime design tokens mapped to CSS variables" },
          { text: "CMS block renderer for two-column page content" },
          { text: "Contact form path ready for Squareflo submissions" },
        ],
      },
    ],
  },
  {
    type: "section",
    id: "fallback-process",
    section_slug: "process",
    section_name: "Process",
    fields: [
      { key: "eyebrow", type: "text", value: "Process" },
      {
        key: "heading",
        type: "text",
        value: "Disciplined enough for corporate stakeholders, quick enough for urgency.",
      },
      {
        key: "items",
        type: "json",
        value: [
          {
            label: "01",
            title: "Stabilize the brief",
            text: "Clarify the audience, pages, conversion goals, CMS modules, and the non-negotiables for launch.",
          },
          {
            label: "02",
            title: "Build the frontend",
            text: "Translate content into a sharp React experience with clean data boundaries and reusable components.",
          },
          {
            label: "03",
            title: "Ship and harden",
            text: "Test responsive states, connect forms, refine SEO, and prepare the site for confident handoff.",
          },
        ],
      },
    ],
  },
  {
    type: "section",
    id: "fallback-articles",
    section_slug: "articles",
    section_name: "Articles",
    fields: [
      { key: "eyebrow", type: "text", value: "Articles" },
      { key: "heading", type: "text", value: "Helpful updates from the CMS feed." },
      {
        key: "description",
        type: "text",
        value: "Blog and article cards are generated from feed entries and link to reusable detail pages.",
      },
      { key: "module", type: "text", value: "blog" },
      { key: "limit", type: "number", value: 3 },
      { key: "view_all_label", type: "text", value: "View all articles" },
      { key: "view_all_url", type: "text", value: "/blogs" },
    ],
  },
  {
    type: "section",
    id: "fallback-events",
    section_slug: "events",
    section_name: "Events",
    fields: [
      { key: "eyebrow", type: "text", value: "Events" },
      { key: "heading", type: "text", value: "Upcoming events can be listed or shown on a calendar." },
      {
        key: "description",
        type: "text",
        value: "The same event feed powers preview cards, calendar pages, event lists, and event detail pages.",
      },
      { key: "module", type: "text", value: "events" },
      { key: "limit", type: "number", value: 3 },
      { key: "sort", type: "text", value: "sort_order" },
      { key: "view_all_label", type: "text", value: "View event calendar" },
      { key: "view_all_url", type: "text", value: "/event-calendar/fullcalendar" },
    ],
  },
  {
    type: "section",
    id: "fallback-reviews",
    section_slug: "reviews",
    section_name: "Reviews",
    fields: [
      { key: "eyebrow", type: "text", value: "Proof" },
      {
        key: "heading",
        type: "text",
        value: "Clients should feel the site is already operating at the next level.",
      },
    ],
  },
  {
    type: "section",
    id: "fallback-faqs",
    section_slug: "faqs",
    section_name: "FAQs",
    fields: [
      { key: "eyebrow", type: "text", value: "Questions" },
      { key: "heading", type: "text", value: "Clear answers before the first call." },
    ],
  },
  {
    type: "section",
    id: "fallback-contact",
    section_slug: "contact",
    section_name: "Contact",
    fields: [
      { key: "eyebrow", type: "text", value: "Start the build" },
      {
        key: "heading",
        type: "text",
        value: "Bring the deadline. We will bring the structure, polish, and launch focus.",
      },
      {
        key: "background_image",
        type: "image",
        value:
          "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1800&q=82",
      },
    ],
  },
];

export const fallbackSettings: SiteSettings = {
  site: {
    name: "Rinae Web Studio",
    description: "Headless React websites for urgent, high-trust launches.",
  },
  business: {
    name: "Rinae Web Studio",
    short_description:
      "Senior frontend execution, headless CMS delivery, and conversion-focused web systems.",
    phone: "+1 (555) 014-2048",
    email: "hello@rinae.dev",
    timezone: "America/New_York",
    logos: {},
    locations: [
      {
        id: "main",
        name: "Remote Delivery Office",
        city: "New York",
        state_province: "NY",
        google_places: {
          rating: 4.9,
          total_reviews: 86,
          open_now: true,
        },
      },
    ],
  },
  design: {
    colors: {
      brand: "#11151c",
      accentLight: "#2563eb",
      accentDark: "#0f766e",
      bgTextLight: "#ffffff",
      bgTextDark: "#101318",
      pageBg: "#f7f8fb",
    },
    typography: {
      h1: {
        fontFamily: "Poppins",
        weight: 800,
        size: 66,
        lineHeight: 1.02,
        letterSpacing: 0,
      },
      h2: {
        fontFamily: "Poppins",
        weight: 700,
        size: 41,
        lineHeight: 1.14,
        letterSpacing: 0,
      },
      body: {
        fontFamily: "Poppins",
        weight: 400,
        size: 16,
        lineHeight: 1.6,
        letterSpacing: 0,
      },
    },
    buttons: {
      primary: {
        fillColor: "#2563eb",
        fillColorHover: "#1747b7",
        textColor: "#ffffff",
        textColorHover: "#ffffff",
        borderRadius: 8,
        fontSize: 14,
        fontWeight: "700",
        paddingH: 20,
        paddingV: 10,
      },
      secondary: {
        fillColor: "rgba(255, 255, 255, 0.08)",
        fillColorHover: "rgba(255, 255, 255, 0.16)",
        textColor: "#ffffff",
        borderColor: "rgba(255, 255, 255, 0.34)",
        borderRadius: 8,
      },
      outline: {
        fillColor: "transparent",
        textColor: "#11151c",
        borderColor: "#d6dbe4",
        borderRadius: 8,
      },
      ghost: {
        fillColor: "transparent",
        textColor: "#2563eb",
        borderRadius: 8,
      },
    },
    forms: {
      fieldBgColor: "#ffffff",
      fieldBorderColor: "#d6dbe4",
      fieldBorderColorFocus: "#2563eb",
      fieldTextColor: "#11151c",
      fieldBorderRadius: 8,
      fieldHeight: 48,
      fieldPaddingH: 14,
      placeholderColor: "#98a2b3",
      labelColor: "#2b3442",
      labelFontWeight: "700",
      submitButtonPreset: "primary",
    },
  },
  seo: {
    default_title: "Rinae Web Studio",
    title_template: "%s | Rinae Web Studio",
    default_description: "Sleek headless React websites for professional teams.",
  },
};

export const fallbackHomePage: CmsPage = {
  id: "fallback-home",
  slug: "home",
  title: "Web development agency for urgent launches",
  is_home: true,
  headless_content: {
    left: { blocks: fallbackSectionBlocks },
    right: { blocks: [] },
  },
  meta: {
    title: "Rinae Web Studio",
    description: "Headless React websites for urgent, high-trust launches.",
  },
};

export const fallbackNavigation: NavItem[] = [
  { id: "home", label: "Home", type: "page", url: "/", sort_order: 0, children: [] },
  { id: "services", label: "Services", type: "page", url: "/services", sort_order: 1, children: [] },
  { id: "blogs", label: "Articles", type: "page", url: "/blogs", sort_order: 2, children: [] },
  { id: "testimonials", label: "Testimonials", type: "page", url: "/testimonials", sort_order: 3, children: [] },
  { id: "events", label: "Events", type: "page", url: "/event-calendar/list/all", sort_order: 4, children: [] },
  { id: "contact", label: "Contact", type: "page", url: "#contact", sort_order: 5, children: [] },
];

export const fallbackFaqs: Faq[] = [
  {
    id: "faq-1",
    question: "How quickly can a polished site launch?",
    answer:
      "Most focused launch sites can move from brief to production in one to three weeks, depending on content readiness and integrations.",
    category: "Delivery",
    sort_order: 0,
  },
  {
    id: "faq-2",
    question: "Can the client manage content after launch?",
    answer:
      "Yes. The frontend is wired for Squareflo pages, navigation, settings, reviews, FAQs, forms, and feed entries.",
    category: "CMS",
    sort_order: 1,
  },
  {
    id: "faq-3",
    question: "Is the design suited for serious businesses?",
    answer:
      "The interface uses restrained motion, strong contrast, stable layouts, and clear calls to action for professional buyers.",
    category: "Design",
    sort_order: 2,
  },
];

export const fallbackReviews: Review[] = [
  {
    id: "review-1",
    author_name: "Maya Chen",
    rating: 5,
    text: "The launch felt calm, sharp, and deliberate. Exactly what our team needed before a major campaign.",
    relative_time: "3 weeks ago",
    featured: true,
  },
  {
    id: "review-2",
    author_name: "Daniel Hart",
    rating: 5,
    text: "Fast without feeling rushed. The new site looks premium and the CMS is clean enough for non-technical updates.",
    relative_time: "1 month ago",
    featured: true,
  },
  {
    id: "review-3",
    author_name: "Priya Shah",
    rating: 5,
    text: "They brought structure to a messy brief and shipped a polished frontend that made the brand feel established.",
    relative_time: "2 months ago",
    featured: true,
  },
];

export const fallbackModules: CmsModule[] = [
  {
    id: "module-services",
    name: "Services",
    slug: "services",
    description: "Reusable service pages powered by feed entries.",
    fields: [
      { key: "description", label: "Description", type: "rich_text" },
      { key: "featured_image", label: "Featured Image", type: "image" },
    ],
  },
  {
    id: "module-blog",
    name: "Blog",
    slug: "blog",
    description: "Articles and updates.",
    fields: [
      { key: "body", label: "Body", type: "rich_text" },
      { key: "featured_image", label: "Featured Image", type: "image" },
    ],
  },
  {
    id: "module-testimonials",
    name: "Testimonials",
    slug: "testimonials",
    description: "Client stories with optional detail pages.",
    fields: [
      { key: "body", label: "Story", type: "rich_text" },
      { key: "rating", label: "Rating", type: "number" },
    ],
  },
  {
    id: "module-faq",
    name: "FAQ",
    slug: "faq",
    description: "Question and answer entries.",
    fields: [
      { key: "answer", label: "Answer", type: "rich_text" },
      { key: "category", label: "Category", type: "text" },
    ],
  },
  {
    id: "module-events",
    name: "Events",
    slug: "events",
    description: "Events for list, calendar, and detail views.",
    fields: [
      { key: "start_date", label: "Start Date", type: "date" },
      { key: "location", label: "Location", type: "text" },
      { key: "body", label: "Details", type: "rich_text" },
    ],
  },
];

const fallbackFeedEntries: Record<string, FeedEntry[]> = {
  services: [
    {
      id: "service-sample",
      title: "Sample Service",
      slug: "sample-slug",
      published: true,
      data: {
        description:
          "A feed-backed service card. Clients create services in the CMS once, then this template renders preview, list, and detail pages automatically.",
        body:
          "<p>This service detail page is generated from a feed entry. The same record can appear on the homepage, the Services listing, and its own detail URL.</p>",
        icon: "layers",
      },
      categories: ["Services"],
      sort_order: 0,
      created_at: "2026-01-10T09:00:00Z",
    },
    {
      id: "service-cms",
      title: "CMS Implementation",
      slug: "cms-implementation",
      published: true,
      data: {
        description: "Connect Squareflo pages, feeds, sections, forms, navigation, and settings to a reusable frontend.",
        body: "<p>Use the right CMS module for each piece of content and keep editing workflows simple for clients.</p>",
        icon: "shield",
      },
      categories: ["Services"],
      sort_order: 1,
      created_at: "2026-01-12T09:00:00Z",
    },
    {
      id: "service-launch",
      title: "Launch Support",
      slug: "launch-support",
      published: true,
      data: {
        description: "Prepare content, routes, SEO metadata, forms, and responsive states for a confident launch.",
        body: "<p>Reusable templates should be easy to launch repeatedly without rebuilding core pages by hand.</p>",
        icon: "zap",
      },
      categories: ["Services"],
      sort_order: 2,
      created_at: "2026-01-14T09:00:00Z",
    },
  ],
  blog: [
    {
      id: "blog-sample",
      title: "Sample Article",
      slug: "sample-slug",
      published: true,
      data: {
        excerpt: "A feed-backed article that demonstrates the listing and detail flow.",
        body:
          "<p>Articles are regular feed entries. The homepage can preview recent entries, the blog route can list them all, and each article gets a reusable detail page.</p>",
        featured_image:
          "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=82",
      },
      categories: ["Updates"],
      tags: ["CMS", "Template"],
      sort_order: 0,
      created_at: "2026-02-02T12:00:00Z",
      meta: {
        title: "Sample Article",
        description: "A feed-backed article that demonstrates the listing and detail flow.",
      },
    },
    {
      id: "blog-modules",
      title: "Choosing the right CMS module",
      slug: "choosing-the-right-cms-module",
      published: true,
      data: {
        excerpt: "Pages, feeds, FAQs, reviews, and forms each have a job.",
        body: "<p>Use pages for composed static content, feeds for repeatable records, FAQs for answer libraries, and forms for submissions.</p>",
      },
      categories: ["Guides"],
      sort_order: 1,
      created_at: "2026-02-08T12:00:00Z",
    },
  ],
  testimonials: [
    {
      id: "testimonial-sample",
      title: "Sample Client",
      slug: "sample-slug",
      published: true,
      data: {
        author_name: "Sample Client",
        role: "Operations Lead",
        rating: 5,
        summary: "The CMS workflow finally matched how our team creates content.",
        body:
          "<p>The reusable module pages gave us room to publish services, articles, testimonials, and events without asking for new templates each time.</p>",
      },
      categories: ["Testimonials"],
      sort_order: 0,
      created_at: "2026-02-15T12:00:00Z",
    },
    {
      id: "testimonial-agency",
      title: "Agency Partner",
      slug: "agency-partner",
      published: true,
      data: {
        author_name: "Agency Partner",
        rating: 5,
        summary: "The template turned one CMS setup into repeatable client launches.",
        body: "<p>Feed-backed routes made the handoff cleaner for non-technical editors.</p>",
      },
      categories: ["Testimonials"],
      sort_order: 1,
      created_at: "2026-02-20T12:00:00Z",
    },
  ],
  faq: [
    {
      id: "faq-sample",
      title: "Can clients add new module pages without developers?",
      slug: "sample-slug",
      published: true,
      data: {
        question: "Can clients add new module pages without developers?",
        answer:
          "<p>Yes. For feed-backed modules, clients create entries in Squareflo and the frontend renders list and detail pages automatically.</p>",
        category: "CMS",
      },
      categories: ["CMS"],
      sort_order: 0,
      created_at: "2026-03-01T12:00:00Z",
    },
  ],
  events: [
    {
      id: "event-sample",
      title: "Sample Event",
      slug: "sample-slug",
      published: true,
      data: {
        start_date: "2026-06-10",
        end_date: "2026-06-10",
        location: "Online",
        summary: "A feed-backed event shown in both calendar and list views.",
        body:
          "<p>This event detail page is generated from the events feed. Add events in Squareflo to populate the calendar and event listings.</p>",
      },
      categories: ["Events"],
      sort_order: 0,
      created_at: "2026-03-05T12:00:00Z",
    },
    {
      id: "event-workshop",
      title: "CMS Content Workshop",
      slug: "cms-content-workshop",
      published: true,
      data: {
        start_date: "2026-07-18",
        location: "Main Office",
        summary: "A practical session for planning reusable sections and feed content.",
        body: "<p>Editors can prepare services, articles, testimonials, FAQs, and events in the CMS before launch.</p>",
      },
      categories: ["Events"],
      sort_order: 1,
      created_at: "2026-03-08T12:00:00Z",
    },
  ],
};

const fallbackFeedAliases: Record<string, string> = {
  service: "services",
  services: "services",
  article: "blog",
  articles: "blog",
  blog: "blog",
  blogs: "blog",
  testimonial: "testimonials",
  testimonials: "testimonials",
  review: "testimonials",
  reviews: "testimonials",
  question: "faq",
  questions: "faq",
  faq: "faq",
  faqs: "faq",
  event: "events",
  events: "events",
  calendar: "events",
  eventcalendar: "events",
};

export function fallbackModuleForSlug(module: string) {
  const normalized = normalizeContentKey(module);
  const alias = fallbackFeedAliases[normalized] || slugifyContent(module);
  return fallbackModules.find((candidate) => candidate.slug === alias);
}

export function fallbackFeedEntriesForModule(module: string) {
  const normalized = normalizeContentKey(module);
  const alias = fallbackFeedAliases[normalized] || slugifyContent(module);
  return fallbackFeedEntries[alias] || [];
}

export function canonicalModuleSlug(module: string) {
  const normalized = normalizeContentKey(module);
  return fallbackFeedAliases[normalized] || slugifyContent(module);
}

export function moduleListPath(module: string) {
  const slug = canonicalModuleSlug(module);
  if (slug === "services") return "/services";
  if (slug === "blog") return "/blogs";
  if (slug === "testimonials") return "/testimonials";
  if (slug === "faq") return "/faq";
  if (slug === "events") return "/event-calendar/list/all";
  return `/${slug}`;
}

export function moduleCalendarPath(module: string) {
  return canonicalModuleSlug(module) === "events" ? "/event-calendar/fullcalendar" : moduleListPath(module);
}

export function moduleEntryPath(module: string, entrySlug: string) {
  const slug = canonicalModuleSlug(module);
  if (slug === "services") return `/services/${entrySlug}`;
  if (slug === "blog") return `/blogs/post/${entrySlug}`;
  if (slug === "testimonials") return `/testimonials/${entrySlug}`;
  if (slug === "faq") return `/faq/${entrySlug}`;
  if (slug === "events") return `/event-calendar/post/${entrySlug}`;
  return `/${slug}/${entrySlug}`;
}

export function moduleQueryKey(module: CmsModule) {
  return module.id && !module.id.startsWith("module-") ? module.id : module.slug;
}

export async function getSettings(): Promise<SiteSettings> {
  try {
    return await cms<SiteSettings>("/settings");
  } catch {
    return fallbackSettings;
  }
}

export async function getNavigation(
  location: "header" | "footer" | "all" = "header",
): Promise<NavItem[]> {
  try {
    const data = await cms<{ navigation: NavItem[] }>("/navigation", { location });
    return data.navigation?.length ? data.navigation : fallbackNavigation;
  } catch {
    return location === "footer" ? [] : fallbackNavigation;
  }
}

export async function getHomePage(): Promise<CmsPage> {
  try {
    const data = await cms<{ pages: CmsPage[] }>("/pages", { home_only: true });
    if (data.pages?.[0]) return data.pages[0];
  } catch {
    // Continue to the broader page-list fallback below. The single-page CMS
    // endpoint currently omits headless_content, so it cannot render the page.
  }

  try {
    const data = await cms<{ pages: CmsPage[] }>("/pages");
    const pages = data.pages || [];
    return (
      pages.find((page) => page.is_home) ||
      pages.find((page) => page.slug === "home") ||
      pages[0] ||
      fallbackHomePage
    );
  } catch {
    return fallbackHomePage;
  }
}

export async function getPages(): Promise<CmsPage[]> {
  try {
    const data = await cms<{ pages: CmsPage[] }>("/pages");
    return data.pages || [];
  } catch {
    return [];
  }
}

function normalizePageSlug(pathname: string) {
  const path = pathname.split(/[?#]/)[0] || "/";
  return decodeURIComponent(path).replace(/^\/+|\/+$/g, "");
}

function pickHomePage(pages: CmsPage[]) {
  return (
    pages.find((page) => page.is_home) ||
    pages.find((page) => page.slug === "home") ||
    pages[0] ||
    fallbackHomePage
  );
}

export async function getPageForPath(pathname: string): Promise<CmsPage> {
  const slug = normalizePageSlug(pathname);

  try {
    const pages = await getPages();
    if (!slug) return pickHomePage(pages);

    return (
      pages.find((page) => page.slug === slug) || {
        ...fallbackHomePage,
        id: "not-found",
        slug,
        title: "Page not found",
        is_home: false,
        headless_content: {
          left: {
            blocks: [
              {
                type: "heading",
                id: "not-found-title",
                text: "Page not found",
                level: 1,
              },
              {
                type: "paragraph",
                id: "not-found-copy",
                text: "This page is not published in the CMS yet.",
              },
            ],
          },
          right: { blocks: [] },
        },
        meta: {
          title: "Page not found",
          description: "This page is not published in the CMS yet.",
          no_index: true,
        },
      }
    );
  } catch {
    return slug
      ? {
          ...fallbackHomePage,
          id: "not-found",
          slug,
          title: "Page not found",
          is_home: false,
          headless_content: {
            left: {
              blocks: [
                {
                  type: "heading",
                  id: "not-found-title",
                  text: "Page not found",
                  level: 1,
                },
                {
                  type: "paragraph",
                  id: "not-found-copy",
                  text: "This page is not published in the CMS yet.",
                },
              ],
            },
            right: { blocks: [] },
          },
          meta: {
            title: "Page not found",
            description: "This page is not published in the CMS yet.",
            no_index: true,
          },
        }
      : fallbackHomePage;
  }
}

export async function getFaqs(): Promise<Faq[]> {
  try {
    const data = await cms<{ faqs: Faq[] }>("/faqs");
    return data.faqs?.length
      ? data.faqs.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      : fallbackFaqs;
  } catch {
    return fallbackFaqs;
  }
}

export async function getReviews(): Promise<Review[]> {
  try {
    const data = await cms<{ reviews: Review[] }>("/reviews", {
      featured: true,
      limit: 6,
    });
    return data.reviews?.length ? data.reviews : fallbackReviews;
  } catch {
    return fallbackReviews;
  }
}

export async function getModules(): Promise<CmsModule[]> {
  try {
    const data = await cms<{ modules: CmsModule[] }>("/modules");
    return data.modules || [];
  } catch {
    return fallbackModules;
  }
}

function applyFallbackFeedParams(
  entries: FeedEntry[],
  params?: Record<string, string | number | boolean | undefined>,
) {
  let result = entries.slice();
  const category = params?.category ? String(params.category).toLowerCase() : "";
  const tag = params?.tag ? String(params.tag).toLowerCase() : "";
  const search = params?.search ? String(params.search).toLowerCase() : "";
  const sort = params?.sort ? String(params.sort) : "sort_order";

  if (category) {
    result = result.filter((entry) =>
      feedEntryCategories(entry).some((item) => item.toLowerCase() === category),
    );
  }

  if (tag) {
    result = result.filter((entry) =>
      feedEntryTags(entry).some((item) => item.toLowerCase() === tag),
    );
  }

  if (search) {
    result = result.filter((entry) =>
      [entry.title, entry.slug, feedEntryDescription(entry), feedEntryBodyHtml(entry)]
        .join(" ")
        .toLowerCase()
        .includes(search),
    );
  }

  const descending = sort.startsWith("-");
  const sortKey = descending ? sort.slice(1) : sort;
  result.sort((a, b) => {
    const aValue =
      sortKey === "title"
        ? a.title
        : sortKey === "created_at"
          ? a.created_at
          : sortKey === "updated_at"
            ? a.updated_at
            : sortKey === "view_count"
              ? a.view_count
              : a.sort_order;
    const bValue =
      sortKey === "title"
        ? b.title
        : sortKey === "created_at"
          ? b.created_at
          : sortKey === "updated_at"
            ? b.updated_at
            : sortKey === "view_count"
              ? b.view_count
              : b.sort_order;
    const order = String(aValue ?? "").localeCompare(String(bValue ?? ""), undefined, {
      numeric: true,
    });
    return descending ? -order : order;
  });

  return result;
}

export async function getFeedEntriesPage(
  module: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<FeedEntriesPage> {
  const limit = Number(params?.limit || 12);
  const offset = Number(params?.offset || 0);
  if (!module) {
    return { entries: [], total: 0, limit, offset, module: "" };
  }

  try {
    const data = await cms<FeedEntriesPage>("/feed-entries", {
      module,
      limit,
      offset,
      sort: "sort_order",
      ...params,
    });
    return {
      entries: data.entries || [],
      total: data.total || data.entries?.length || 0,
      limit: data.limit || limit,
      offset: data.offset || offset,
      module: data.module || module,
    };
  } catch {
    const fallbackEntries = applyFallbackFeedParams(fallbackFeedEntriesForModule(module), params);
    return {
      entries: fallbackEntries.slice(offset, offset + limit),
      total: fallbackEntries.length,
      limit,
      offset,
      module: fallbackModuleForSlug(module)?.slug || module,
    };
  }
}

export async function getFeedEntries(
  module: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<FeedEntry[]> {
  const data = await getFeedEntriesPage(module, params);
  return data.entries;
}

export async function getFeedEntry(module: string, slug: string): Promise<FeedEntry | null> {
  if (!module || !slug) return null;

  try {
    const data = await cms<{ entry: FeedEntry }>(`/feed-entries/${slug}`, { module });
    return data.entry || null;
  } catch {
    return fallbackFeedEntriesForModule(module).find((entry) => entry.slug === slug) || null;
  }
}

export async function getFormStructure(formId: string): Promise<CmsForm | null> {
  if (!formId) return null;

  try {
    const data = await cms<{ form: CmsForm }>(`/forms/${formId}/submit`);
    return data.form || null;
  } catch {
    return null;
  }
}

export async function submitForm(formId: string, values: Record<string, string>) {
  if (!formId) {
    throw new Error("Squareflo contact form id is not configured.");
  }

  if (!squarefloApiKey && !squarefloProxyUrl) {
    throw new Error("Squareflo API key is not configured.");
  }

  const { headers, url } = buildCmsRequest(`/forms/${formId}/submit`);
  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data: values }),
  });

  if (!response.ok) {
    throw new Error(`Squareflo form error ${response.status}`);
  }

  return response.json() as Promise<{
    submission: { id: string; created_at: string };
    message: string;
  }>;
}

function clean(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  return String(value);
}

function px(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "number") return `${value}px`;
  return String(value);
}

function percent(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "number") {
    const normalized = value > 0 && value <= 1 ? value * 100 : value;
    return `${Math.max(0, Math.min(100, normalized))}%`;
  }
  const raw = String(value).trim();
  if (raw.endsWith("%")) return raw;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? percent(parsed) : undefined;
}

function textCase(value: unknown) {
  const raw = clean(value)?.toLowerCase();
  if (!raw || raw === "none" || raw === "normal") return "none";
  if (raw === "upper" || raw === "uppercase") return "uppercase";
  if (raw === "lower" || raw === "lowercase") return "lowercase";
  if (raw === "title" || raw === "capitalize") return "capitalize";
  return "none";
}

function setToken(root: HTMLElement, key: string, value: unknown) {
  const nextValue = clean(value);
  if (nextValue) root.style.setProperty(key, nextValue);
}

function getTypography(
  typography: Record<string, Record<string, string | number>>,
  key: string,
  fallback?: Record<string, string | number>,
) {
  return typography[key] || fallback || {};
}

function addTypographyTokens(
  tokenMap: Record<string, unknown>,
  prefix: string,
  values: Record<string, string | number>,
  fallbackFont?: unknown,
) {
  tokenMap[`--font-${prefix}`] = values.fontFamily || fallbackFont;
  tokenMap[`--type-${prefix}-size`] = px(values.size);
  tokenMap[`--type-${prefix}-weight`] = values.weight;
  tokenMap[`--type-${prefix}-line`] = values.lineHeight;
  tokenMap[`--type-${prefix}-spacing`] = px(values.letterSpacing);
  tokenMap[`--type-${prefix}-case`] = textCase(values.textCase);
  tokenMap[`--type-${prefix}-color-light`] = values.colorLight;
  tokenMap[`--type-${prefix}-color-dark`] = values.colorDark;
}

function addButtonTokens(
  tokenMap: Record<string, unknown>,
  key: "primary" | "secondary" | "outline" | "ghost",
  values: Record<string, string | number>,
  fallback?: Record<string, string | number>,
) {
  tokenMap[`--button-${key}-bg`] = values.fillColor ?? fallback?.fillColor;
  tokenMap[`--button-${key}-bg-hover`] =
    values.fillColorHover ?? fallback?.fillColorHover ?? values.fillColor ?? fallback?.fillColor;
  tokenMap[`--button-${key}-text`] = values.textColor ?? fallback?.textColor;
  tokenMap[`--button-${key}-text-hover`] =
    values.textColorHover ?? fallback?.textColorHover ?? values.textColor ?? fallback?.textColor;
  tokenMap[`--button-${key}-border-width`] = px(values.borderWidth ?? fallback?.borderWidth ?? 0);
  tokenMap[`--button-${key}-border`] = values.borderColor ?? fallback?.borderColor ?? "transparent";
  tokenMap[`--button-${key}-border-hover`] =
    values.borderColorHover ?? fallback?.borderColorHover ?? values.borderColor ?? fallback?.borderColor;
  tokenMap[`--button-${key}-radius`] = px(values.borderRadius ?? fallback?.borderRadius);
  tokenMap[`--button-${key}-font`] = values.fontFamily ?? fallback?.fontFamily;
  tokenMap[`--button-${key}-font-size`] = px(values.fontSize ?? fallback?.fontSize);
  tokenMap[`--button-${key}-font-weight`] = values.fontWeight ?? fallback?.fontWeight;
  tokenMap[`--button-${key}-padding-h`] = px(values.paddingH ?? fallback?.paddingH);
  tokenMap[`--button-${key}-padding-v`] = px(values.paddingV ?? fallback?.paddingV);
  tokenMap[`--button-${key}-case`] = textCase(values.textCase ?? fallback?.textCase);
}

function primaryFontFamily(value: unknown) {
  return clean(value)
    ?.split(",")[0]
    ?.replace(/['"]/g, "")
    .trim();
}

function collectFontFamilyNames(settings: SiteSettings) {
  const families = new Set<string>();
  const typography = settings.design?.typography || {};
  const buttons = settings.design?.buttons || {};
  const forms = settings.design?.forms || {};

  Object.values(typography).forEach((item) => {
    const family = primaryFontFamily(item.fontFamily);
    if (family) families.add(family);
  });
  Object.values(buttons).forEach((item) => {
    const family = primaryFontFamily(item.fontFamily);
    if (family) families.add(family);
  });
  [forms.fieldFontFamily, forms.labelFontFamily].forEach((family) => {
    const nextFamily = primaryFontFamily(family);
    if (nextFamily) families.add(nextFamily);
  });

  return [...families].filter((family) => {
    const normalized = family.toLowerCase();
    return (
      !normalized.includes("system-ui") &&
      !normalized.includes("inherit") &&
      !normalized.includes("serif") &&
      !normalized.includes("sans-serif") &&
      !normalized.includes("monospace")
    );
  });
}

function loadCmsFonts(settings: SiteSettings) {
  const families = collectFontFamilyNames(settings);
  const existing = document.getElementById("cms-fonts") as HTMLLinkElement | null;

  if (!families.length) {
    existing?.remove();
    return;
  }

  const params = new URLSearchParams();
  families.forEach((family) => {
    const cleanFamily = family.replace(/['"]/g, "").trim().replace(/\s+/g, "+");
    params.append("family", `${cleanFamily}:wght@300;400;500;600;700;800`);
  });
  params.set("display", "swap");

  const href = `https://fonts.googleapis.com/css2?${params.toString()}`;
  if (existing?.href === href) return;

  const link = existing || document.createElement("link");
  link.id = "cms-fonts";
  link.rel = "stylesheet";
  link.href = href;
  if (!existing) document.head.appendChild(link);
}

export function applyDesignTokens(settings: SiteSettings) {
  const root = document.documentElement;
  const colors = settings.design?.colors || {};
  const typography = settings.design?.typography || {};
  const buttons = settings.design?.buttons || {};
  const forms = settings.design?.forms || {};
  const body = getTypography(typography, "body");
  const h1 = getTypography(typography, "h1", body);
  const h2 = getTypography(typography, "h2", h1);
  const h3 = getTypography(typography, "h3", h2);
  const h4 = getTypography(typography, "h4", h3);
  const h5 = getTypography(typography, "h5", h4);
  const h6 = getTypography(typography, "h6", h5);
  const small = getTypography(typography, "small", body);
  const nav = typography.nav || typography.navItem || typography.navigation || body;
  const primary = buttons.primary || {};
  const secondary = buttons.secondary || {};
  const outline = buttons.outline || {};
  const ghost = buttons.ghost || {};

  const tokenMap: Record<string, unknown> = {
    "--color-brand": colors.brand,
    "--color-accent-light": colors.accentLight,
    "--color-accent-dark": colors.accentDark,
    "--color-bg-text-light": colors.bgTextLight,
    "--color-bg-text-dark": colors.bgTextDark,
    "--color-page-bg": colors.pageBg,
    "--color-accent": colors.accentLight,
    "--color-accent-deep": colors.accentDark,
    "--color-bg-light": colors.bgTextLight,
    "--color-bg-dark": colors.bgTextDark,
    "--color-ink": colors.bgTextDark,
    "--color-on-dark": colors.bgTextLight,
    "--color-panel": colors.bgTextLight,
    "--font-body": body.fontFamily || h1.fontFamily,
    "--font-heading": h1.fontFamily || body.fontFamily,
    "--type-body-size": px(body.size),
    "--type-body-weight": body.weight,
    "--type-body-line": body.lineHeight,
    "--type-body-spacing": px(body.letterSpacing),
    "--type-body-case": textCase(body.textCase),
    "--type-body-color-light": body.colorLight,
    "--type-body-color-dark": body.colorDark,
    "--form-wrapper-bg": forms.wrapperBgColor,
    "--form-wrapper-opacity": percent(forms.wrapperBgOpacity ?? 100),
    "--field-bg": forms.fieldBgColor,
    "--field-bg-opacity": percent(forms.fieldBgOpacity ?? 100),
    "--field-border": forms.fieldBorderColor,
    "--field-border-focus": forms.fieldBorderColorFocus,
    "--field-text": forms.fieldTextColor,
    "--field-font": forms.fieldFontFamily,
    "--field-font-size": px(forms.fieldFontSize),
    "--field-font-weight": forms.fieldFontWeight,
    "--field-radius": px(forms.fieldBorderRadius),
    "--field-height": px(forms.fieldHeight),
    "--field-padding-h": px(forms.fieldPaddingH),
    "--placeholder-color": forms.placeholderColor,
    "--label-color": forms.labelColor,
    "--label-font": forms.labelFontFamily,
    "--label-font-size": px(forms.labelFontSize),
    "--label-font-weight": forms.labelFontWeight,
  };

  addTypographyTokens(tokenMap, "h1", h1, body.fontFamily);
  addTypographyTokens(tokenMap, "h2", h2, h1.fontFamily || body.fontFamily);
  addTypographyTokens(tokenMap, "h3", h3, h2.fontFamily || h1.fontFamily || body.fontFamily);
  addTypographyTokens(tokenMap, "h4", h4, h3.fontFamily || body.fontFamily);
  addTypographyTokens(tokenMap, "h5", h5, h4.fontFamily || body.fontFamily);
  addTypographyTokens(tokenMap, "h6", h6, h5.fontFamily || body.fontFamily);
  addTypographyTokens(tokenMap, "small", small, body.fontFamily);
  addTypographyTokens(tokenMap, "nav", nav, body.fontFamily);
  addButtonTokens(tokenMap, "primary", primary);
  addButtonTokens(tokenMap, "secondary", secondary, primary);
  addButtonTokens(tokenMap, "outline", outline, primary);
  addButtonTokens(tokenMap, "ghost", ghost, primary);

  Object.entries(tokenMap).forEach(([key, value]) => setToken(root, key, value));
  loadCmsFonts(settings);
}
