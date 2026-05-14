export type CmsBlock = {
  type: string;
  content?: string;
  level?: number;
  src?: string;
  alt?: string;
  url?: string;
  label?: string;
  variant?: string;
  size?: number;
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
  headless_content?: {
    left?: { blocks?: CmsBlock[] };
    right?: { blocks?: CmsBlock[] };
  };
  meta?: {
    title?: string;
    description?: string;
    og_image?: string;
    canonical_url?: string | null;
    no_index?: boolean;
    no_follow?: boolean;
  };
};

export type NavItem = {
  id: string;
  label: string;
  type: "label" | "page" | "external" | string;
  url?: string;
  open_in_new_tab?: boolean;
  location?: "header" | "footer" | string;
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
      google_places?: {
        rating?: number;
        total_reviews?: number;
        google_maps_url?: string;
        open_now?: boolean;
        hours?: string[];
      } | null;
    }>;
  };
  design?: {
    colors?: Record<string, string>;
    typography?: Record<string, Record<string, string | number>>;
    buttons?: Record<string, Record<string, string | number>>;
    forms?: Record<string, string | number>;
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
};

export type Review = {
  id: string;
  author_name: string;
  author_photo_url?: string;
  rating: number;
  text: string;
  relative_time?: string;
  featured?: boolean;
};

export type CmsFormField = {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  placeholder?: string;
};

export type CmsForm = {
  id: string;
  name: string;
  fields: CmsFormField[];
  submit_label?: string;
  success_message?: string;
};

const DEFAULT_API_URL = "https://test-site-rinae.flodev.ca/api/v1";

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
    buttons: {
      primary: {
        fillColor: "#2563eb",
        fillColorHover: "#1747b7",
        textColor: "#ffffff",
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
    left: { blocks: [] },
    right: { blocks: [] },
  },
  meta: {
    title: "Rinae Web Studio",
    description: "Headless React websites for urgent, high-trust launches.",
  },
};

export const fallbackNavigation: NavItem[] = [
  { id: "home", label: "Home", type: "page", url: "/", children: [] },
  { id: "services", label: "Services", type: "page", url: "#services", children: [] },
  { id: "process", label: "Process", type: "page", url: "#process", children: [] },
  { id: "proof", label: "Proof", type: "page", url: "#proof", children: [] },
  { id: "contact", label: "Contact", type: "page", url: "#contact", children: [] },
];

export const fallbackFaqs: Faq[] = [
  {
    id: "faq-1",
    question: "How quickly can a polished site launch?",
    answer:
      "Most focused launch sites can move from brief to production in one to three weeks, depending on content readiness and integrations.",
    category: "Delivery",
  },
  {
    id: "faq-2",
    question: "Can the client manage content after launch?",
    answer:
      "Yes. The frontend is wired for Squareflo pages, navigation, settings, reviews, FAQs, forms, and feed entries.",
    category: "CMS",
  },
  {
    id: "faq-3",
    question: "Is the design suited for serious businesses?",
    answer:
      "The interface uses restrained motion, strong contrast, stable layouts, and clear calls to action for professional buyers.",
    category: "Design",
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

export async function getNavigation(location: "header" | "footer" = "header"): Promise<NavItem[]> {
  try {
    const data = await cms<{ navigation: NavItem[] }>("/navigation", { location });
    return data.navigation?.length ? data.navigation : fallbackNavigation;
  } catch {
    return fallbackNavigation;
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
    return data.faqs?.length ? data.faqs.slice(0, 5) : fallbackFaqs;
  } catch {
    return fallbackFaqs;
  }
}

export async function getReviews(): Promise<Review[]> {
  try {
    const data = await cms<{ reviews: Review[] }>("/reviews", {
      featured: true,
      limit: 3,
    });
    return data.reviews?.length ? data.reviews : fallbackReviews;
  } catch {
    return fallbackReviews;
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

export function applyDesignTokens(settings: SiteSettings) {
  const root = document.documentElement;
  const colors = settings.design?.colors || {};
  const buttons = settings.design?.buttons || {};
  const forms = settings.design?.forms || {};
  const primary = buttons.primary || {};

  const tokenMap: Record<string, string | number | undefined> = {
    "--color-brand": colors.brand,
    "--color-accent": colors.accentLight,
    "--color-accent-deep": colors.accentDark,
    "--color-page-bg": colors.pageBg,
    "--color-bg-light": colors.bgTextLight,
    "--color-bg-dark": colors.bgTextDark,
    "--button-primary-bg": primary.fillColor,
    "--button-primary-bg-hover": primary.fillColorHover,
    "--button-primary-text": primary.textColor,
    "--button-radius": primary.borderRadius ? `${primary.borderRadius}px` : undefined,
    "--field-bg": forms.fieldBgColor,
    "--field-border": forms.fieldBorderColor,
    "--field-border-focus": forms.fieldBorderColorFocus,
    "--field-text": forms.fieldTextColor,
    "--field-radius": forms.fieldBorderRadius ? `${forms.fieldBorderRadius}px` : undefined,
    "--field-height": forms.fieldHeight ? `${forms.fieldHeight}px` : undefined,
  };

  Object.entries(tokenMap).forEach(([key, value]) => {
    if (value) root.style.setProperty(key, String(value));
  });
}
