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
    og_image?: string;
    canonical_url?: string | null;
  };
};

const DEFAULT_API_URL = "https://hizl.net/api/v1";

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
      { key: "eyebrow", type: "text", value: "Headless React delivery" },
      { key: "heading", type: "text", value: "Web development agency for urgent launches" },
      {
        key: "description",
        type: "text",
        value:
          "Sleek, CMS-powered websites for teams that need the work to feel premium, move quickly, and stand up to serious scrutiny.",
      },
      {
        key: "background_image",
        type: "image",
        value:
          "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=82",
      },
      { key: "primary_label", type: "text", value: "Start a build" },
      { key: "primary_link", type: "text", value: "#contact" },
      { key: "secondary_label", type: "text", value: "View process" },
      { key: "secondary_link", type: "text", value: "#process" },
      {
        key: "metrics",
        type: "json",
        value: [
          { label: "1-3 wk", text: "focused launch windows" },
          { label: "CMS", text: "Squareflo managed content" },
          { label: "SEO", text: "metadata and structure ready" },
        ],
      },
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
      {
        key: "items",
        type: "json",
        value: [
          {
            icon: "zap",
            title: "Urgent launch sprints",
            text: "Focused React builds for campaigns, rebrands, and investor-facing moments that cannot drift.",
          },
          {
            icon: "layers",
            title: "Headless CMS systems",
            text: "Squareflo pages, navigation, settings, forms, FAQs, reviews, and feed content rendered with care.",
          },
          {
            icon: "gauge",
            title: "Performance polish",
            text: "Fast interfaces with stable layouts, responsive details, and conversion paths that stay obvious.",
          },
          {
            icon: "shield",
            title: "Professional trust layer",
            text: "Serious visual systems, accessible components, SEO metadata, and launch-ready structure.",
          },
        ],
      },
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
  { id: "services", label: "Services", type: "page", url: "#services", sort_order: 1, children: [] },
  { id: "process", label: "Process", type: "page", url: "#process", sort_order: 2, children: [] },
  { id: "proof", label: "Proof", type: "page", url: "#proof", sort_order: 3, children: [] },
  { id: "contact", label: "Contact", type: "page", url: "#contact", sort_order: 4, children: [] },
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
    try {
      const data = await cms<{ page: CmsPage }>("/pages/home");
      if (data.page) return data.page;
    } catch {
      return fallbackHomePage;
    }
  }

  return fallbackHomePage;
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
    return [];
  }
}

export async function getFeedEntries(
  module: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<FeedEntry[]> {
  if (!module) return [];

  try {
    const data = await cms<{ entries: FeedEntry[] }>("/feed-entries", {
      module,
      limit: 12,
      sort: "sort_order",
      ...params,
    });
    return data.entries || [];
  } catch {
    return [];
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
