import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, ChevronDown, ChevronRight, Menu, Phone, X } from "lucide-react";
import { ContentBlock, type CmsRenderContext } from "./components/ContentBlock";
import {
  EventCalendarPage,
  ModuleDetailPage,
  ModuleListPage,
  type ModuleKind,
} from "./components/ModulePages";
import {
  applyDesignTokens,
  contactFormId,
  fallbackModuleForSlug,
  fallbackFaqs,
  fallbackHomePage,
  fallbackNavigation,
  fallbackReviews,
  fallbackSettings,
  feedEntryDescription,
  feedEntryImage,
  feedEntryTitle,
  getFaqs,
  getFeedEntry,
  getFeedEntries,
  getFeedEntriesPage,
  getFormStructure,
  getModules,
  getPages,
  getNavigation,
  getReviews,
  getSettings,
  moduleQueryKey,
  slugifyContent,
  type CmsBlock,
  type CmsForm,
  type CmsModule,
  type CmsPage,
  type Faq,
  type FeedEntry,
  type NavItem,
  type Review,
  type SiteSettings,
} from "./lib/squareflo";

function normalizeKey(value: string) {
  return value.replace(/[\s_-]/g, "").toLowerCase();
}

function slugify(value?: string) {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function stringFrom(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (!value || typeof value !== "object") return "";

  const record = value as Record<string, unknown>;
  return stringFrom(record.value || record.text || record.label || record.title || record.url || record.src);
}

function fieldString(block: CmsBlock, keys: string[]) {
  const normalizedKeys = keys.map(normalizeKey);
  const field = block.fields?.find((candidate) =>
    normalizedKeys.includes(normalizeKey(candidate.key)),
  );
  return field ? stringFrom(field.value) : "";
}

function blockFeedIdentifier(block: CmsBlock) {
  const sectionSlug = slugify(block.section_slug || block.section_name || "");
  const knownSectionModules: Record<string, string> = {
    service: "services",
    services: "services",
    article: "blog",
    articles: "blog",
    blog: "blog",
    blogs: "blog",
    event: "events",
    events: "events",
    calendar: "events",
    hero: "hero-slides",
    heroslides: "hero-slides",
    heroslider: "hero-slides",
    slider: "hero-slides",
    slides: "hero-slides",
  };

  return (
    stringFrom(block.dynamic_feed_id) ||
    stringFrom(block.feed_id) ||
    stringFrom(block.module_id) ||
    fieldString(block, [
      "module",
      "module_id",
      "module_slug",
      "feed",
      "feed_id",
      "feed_slug",
      "source_module",
      "source_module_id",
      "entries_module",
      "entries_module_id",
    ])
    || knownSectionModules[sectionSlug]
  );
}

function walkBlocks(blocks: CmsBlock[], visit: (block: CmsBlock) => void) {
  blocks.forEach((block) => {
    visit(block);
    if (Array.isArray(block.columns)) {
      block.columns.forEach((column) => walkBlocks(column.blocks || [], visit));
    }
    if (block.left?.blocks) walkBlocks(block.left.blocks, visit);
    if (block.right?.blocks) walkBlocks(block.right.blocks, visit);
  });
}

function pageBlocks(page: CmsPage) {
  return {
    left: page.headless_content?.left?.blocks || [],
    right: page.headless_content?.right?.blocks || [],
  };
}

function isHeroBlock(block: CmsBlock) {
  if (block.type !== "section") return false;
  const slug = normalizeKey(slugify(block.section_slug || block.section_name || ""));
  return slug.includes("hero");
}

function splitHero(page: CmsPage): {
  hero: CmsBlock;
  left: CmsBlock[];
  right: CmsBlock[];
} {
  const { left, right } = pageBlocks(page);
  const hero = [...left, ...right].find(isHeroBlock);

  if (hero) {
    return {
      hero,
      left: left.filter((block) => block !== hero),
      right: right.filter((block) => block !== hero),
    };
  }

  return {
    hero: {
      type: "section",
      id: "derived-hero",
      section_slug: "hero-banner",
      section_name: "Hero",
      fields: [
        { key: "heading", source_field: "title", locked: true, value: "" },
        { key: "description", source_field: "description", locked: true, value: "" },
        { key: "background_image", source_field: "og_image", locked: true, value: "" },
        { key: "module", value: "hero-slides" },
      ],
    },
    left,
    right,
  };
}

function extractFormId(page: CmsPage) {
  let found = "";
  const { left, right } = pageBlocks(page);

  walkBlocks([...left, ...right], (block) => {
    if (found || block.type !== "section") return;
    found = fieldString(block, ["form_id", "formId", "contact_form_id"]);
  });

  return found;
}

function extractFeedModules(page: CmsPage) {
  const modules = new Set<string>();
  const { left, right } = pageBlocks(page);

  walkBlocks([...left, ...right], (block) => {
    if (block.type !== "section") return;
    const moduleSlug = blockFeedIdentifier(block);
    if (moduleSlug) modules.add(moduleSlug);
  });

  return [...modules];
}

function isExternalUrl(url?: string) {
  return Boolean(url && /^(https?:|mailto:|tel:)/.test(url));
}

function sortedNav(items: NavItem[]) {
  return items.slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
}

type ModuleRouteIntent = {
  moduleKind: ModuleKind;
  moduleCandidates: string[];
  copy: {
    eyebrow?: string;
    title: string;
    description?: string;
  };
  apiModule?: "faq" | "reviews";
  mode?: "list" | "calendar";
  detailSlug?: string;
};

type ModuleFilters = {
  category?: string;
  tag?: string;
  search?: string;
};

type ResolvedRoute =
  | { type: "page"; page: CmsPage }
  | {
      type: "module-list";
      page: CmsPage;
      module?: CmsModule;
      moduleKind: ModuleKind;
      entries: FeedEntry[];
      copy: ModuleRouteIntent["copy"];
      filters?: ModuleFilters;
    }
  | {
      type: "module-detail";
      page: CmsPage;
      module: CmsModule;
      moduleKind: ModuleKind;
      entry: FeedEntry;
      related: FeedEntry[];
      copy: ModuleRouteIntent["copy"];
    }
  | {
      type: "event-calendar";
      page: CmsPage;
      module?: CmsModule;
      entries: FeedEntry[];
      mode: "list" | "calendar";
      copy: ModuleRouteIntent["copy"];
      filters?: ModuleFilters;
    };

const routeCopy: Record<Exclude<ModuleKind, "generic">, ModuleRouteIntent["copy"]> = {
  services: {
    eyebrow: "Services",
    title: "Services",
    description: "Browse all services published in the CMS feed.",
  },
  blog: {
    eyebrow: "Articles",
    title: "Articles",
    description: "Read the latest articles, updates, and resources from the CMS feed.",
  },
  testimonials: {
    eyebrow: "Testimonials",
    title: "Testimonials",
    description: "Client stories and reviews can be listed here from feeds or review data.",
  },
  faq: {
    eyebrow: "FAQ",
    title: "FAQ",
    description: "Answers from the FAQ module, with feed detail pages when available.",
  },
  events: {
    eyebrow: "Events",
    title: "Events",
    description: "Upcoming events from the events feed.",
  },
};

function createNotFoundPage(slug: string): CmsPage {
  return {
    ...fallbackHomePage,
    id: `not-found-${slug || "home"}`,
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
  };
}

function routePage(slug: string, title: string, description?: string, image?: string): CmsPage {
  return {
    ...fallbackHomePage,
    id: `route-${slug || "home"}`,
    slug,
    title,
    is_home: false,
    headless_content: { left: { blocks: [] }, right: { blocks: [] } },
    meta: {
      title,
      description,
      og_title: title,
      og_description: description,
      og_image: image,
    },
  };
}

function normalizePath(pathname: string) {
  return decodeURIComponent(pathname.split(/[?#]/)[0] || "/").replace(/^\/+|\/+$/g, "");
}

function routeFilters(searchParams?: URLSearchParams): ModuleFilters {
  if (!searchParams) return {};

  return {
    category: searchParams.get("category") || undefined,
    tag: searchParams.get("tag") || undefined,
    search: searchParams.get("search") || undefined,
  };
}

function moduleKindForSlug(slug: string): ModuleKind {
  const normalized = normalizeKey(slug);
  if (["service", "services"].includes(normalized)) return "services";
  if (["blog", "blogs", "article", "articles"].includes(normalized)) return "blog";
  if (["testimonial", "testimonials", "review", "reviews"].includes(normalized)) return "testimonials";
  if (["faq", "faqs", "question", "questions"].includes(normalized)) return "faq";
  if (["event", "events", "calendar", "eventcalendar"].includes(normalized)) return "events";
  return "generic";
}

function defaultCopyForModule(module: CmsModule, moduleKind: ModuleKind): ModuleRouteIntent["copy"] {
  if (moduleKind !== "generic") return routeCopy[moduleKind];
  return {
    eyebrow: module.name,
    title: module.name,
    description: module.description || `Browse ${module.name.toLowerCase()} entries from the CMS feed.`,
  };
}

function knownRouteIntent(slug: string): ModuleRouteIntent | null {
  const segments = slug.split("/").filter(Boolean);
  const [first, second, third] = segments;

  if (first === "services") {
    return {
      moduleKind: "services",
      moduleCandidates: ["services", "service"],
      copy: routeCopy.services,
      detailSlug: second,
    };
  }

  if (first === "blogs") {
    return {
      moduleKind: "blog",
      moduleCandidates: ["blog", "blogs", "article", "articles"],
      copy: routeCopy.blog,
      detailSlug: second === "post" ? third : second,
    };
  }

  if (first === "testimonials") {
    return {
      moduleKind: "testimonials",
      moduleCandidates: ["testimonials", "testimonial", "reviews", "review"],
      copy: routeCopy.testimonials,
      detailSlug: second,
    };
  }

  if (first === "reviews") {
    return {
      moduleKind: "testimonials",
      moduleCandidates: ["reviews", "review"],
      copy: {
        ...routeCopy.testimonials,
        eyebrow: "Reviews",
        title: "Reviews",
      },
      apiModule: "reviews",
      detailSlug: second,
    };
  }

  if (first === "faq" || first === "faqs") {
    return {
      moduleKind: "faq",
      moduleCandidates: ["faq", "faqs", "questions", "question"],
      copy: routeCopy.faq,
      apiModule: "faq",
      detailSlug: second,
    };
  }

  if (first === "event-calendar") {
    return {
      moduleKind: "events",
      moduleCandidates: ["events", "event", "calendar", "event-calendar"],
      copy: routeCopy.events,
      mode: second === "fullcalendar" ? "calendar" : "list",
      detailSlug: second === "post" ? third : undefined,
    };
  }

  return null;
}

function findCmsPage(pages: CmsPage[], slug: string) {
  if (!slug) {
    return (
      pages.find((page) => page.is_home) ||
      pages.find((page) => page.slug === "home") ||
      pages[0] ||
      fallbackHomePage
    );
  }

  return pages.find((page) => normalizePath(page.slug) === slug);
}

function findModule(modules: CmsModule[], candidates: string[]) {
  const normalizedCandidates = candidates.map(normalizeKey);
  const found = modules.find((module) => {
    const moduleValues = [module.slug, module.name, module.id].map((value) => normalizeKey(value || ""));
    return moduleValues.some((value) => normalizedCandidates.includes(value));
  });

  if (found) return found;

  const isFallbackSet = modules.length > 0 && modules.every((module) => module.id.startsWith("module-"));
  return isFallbackSet ? fallbackModuleForSlug(candidates[0]) : undefined;
}

function faqToFeedEntry(faq: Faq): FeedEntry {
  return {
    id: faq.id,
    title: faq.question,
    slug: slugifyContent(faq.question) || faq.id,
    published: true,
    data: {
      question: faq.question,
      answer: faq.answer,
      body: faq.answer,
      category: faq.category,
    },
    categories: faq.category ? [faq.category] : [],
    tags: faq.tags || [],
    sort_order: faq.sort_order,
    created_at: faq.created_at,
    updated_at: faq.updated_at,
  };
}

async function buildModuleRoute(
  slug: string,
  intent: ModuleRouteIntent,
  modules: CmsModule[],
  faqs: Faq[],
  reviews: Review[],
  filters: ModuleFilters = {},
): Promise<ResolvedRoute> {
  const module = intent.apiModule ? undefined : findModule(modules, intent.moduleCandidates);
  const copy = module ? defaultCopyForModule(module, intent.moduleKind) : intent.copy;
  const moduleSlug = module?.slug || intent.moduleCandidates[0];
  const queryKey = module ? moduleQueryKey(module) : moduleSlug;

  if (intent.detailSlug) {
    const entry = module
      ? await getFeedEntry(queryKey, intent.detailSlug)
      : intent.moduleKind === "faq"
        ? faqs.map(faqToFeedEntry).find((faq) => faq.slug === intent.detailSlug || faq.id === intent.detailSlug) || null
        : null;

    if (!entry) return { type: "page", page: createNotFoundPage(slug) };

    const detailModule =
      module ||
      ({
        id: "api-faq",
        name: "FAQ",
        slug: "faq",
        description: routeCopy.faq.description,
      } satisfies CmsModule);
    const related = module ? await getFeedEntries(queryKey, { limit: 4, sort: "sort_order" }) : [];
    const title = feedEntryTitle(entry);
    const description = feedEntryDescription(entry);
    const page = routePage(slug, title, description, feedEntryImage(entry));
    return {
      type: "module-detail",
      page,
      module: detailModule,
      moduleKind: intent.moduleKind,
      entry,
      related,
      copy,
    };
  }

  if (intent.moduleKind === "events") {
    const data = module
      ? await getFeedEntriesPage(queryKey, { limit: 100, sort: "sort_order", ...filters })
      : { entries: [], total: 0, limit: 100, offset: 0, module: moduleSlug };
    const page = routePage(slug, copy.title, copy.description);
    return {
      type: "event-calendar",
      page,
      module,
      entries: data.entries,
      mode: intent.mode || "list",
      copy,
      filters,
    };
  }

  const data = module
    ? await getFeedEntriesPage(queryKey, { limit: 100, sort: "sort_order", ...filters })
    : { entries: [], total: 0, limit: 100, offset: 0, module: moduleSlug };
  const page = routePage(slug, copy.title, copy.description);
  return {
    type: "module-list",
    page,
    module,
    moduleKind: intent.moduleKind,
    entries: data.entries,
    copy,
    filters,
  };
}

async function resolveRoute(
  pathname: string,
  pages: CmsPage[],
  modules: CmsModule[],
  faqs: Faq[],
  reviews: Review[],
  searchParams?: URLSearchParams,
): Promise<ResolvedRoute> {
  const slug = normalizePath(pathname);
  const filters = routeFilters(searchParams);
  if (!slug) return { type: "page", page: findCmsPage(pages, slug) || fallbackHomePage };

  const knownIntent = knownRouteIntent(slug);
  if (knownIntent) return buildModuleRoute(slug, knownIntent, modules, faqs, reviews, filters);

  const page = findCmsPage(pages, slug);
  if (page) return { type: "page", page };

  const segments = slug.split("/").filter(Boolean);
  if (segments.length === 1 || segments.length === 2 || (segments.length === 3 && segments[1] === "post")) {
    const module = findModule(modules, [segments[0]]);
    if (module) {
      return buildModuleRoute(
        slug,
        {
          moduleKind: moduleKindForSlug(module.slug),
          moduleCandidates: [module.slug, module.name],
          copy: defaultCopyForModule(module, moduleKindForSlug(module.slug)),
          detailSlug: segments[1] === "post" ? segments[2] : segments[1],
        },
        modules,
        faqs,
        reviews,
        filters,
      );
    }
  }

  return { type: "page", page: createNotFoundPage(slug) };
}

function upsertMeta(selector: string, create: () => HTMLMetaElement, content?: string) {
  if (!content) return;
  const existing = document.head.querySelector<HTMLMetaElement>(selector);
  const element = existing || create();
  element.setAttribute("content", content);
  if (!existing) document.head.appendChild(element);
}

function syncDocumentHead(page: CmsPage, settings: SiteSettings) {
  const title =
    page.meta?.title ||
    (settings.seo?.title_template && page.title
      ? settings.seo.title_template.replace("%s", page.title)
      : settings.seo?.default_title) ||
    settings.site.name;
  const description =
    page.meta?.description || settings.seo?.default_description || settings.site.description || "";

  document.title = title;

  upsertMeta(
    'meta[name="description"]',
    () => {
      const element = document.createElement("meta");
      element.setAttribute("name", "description");
      return element;
    },
    description,
  );

  upsertMeta(
    'meta[property="og:title"]',
    () => {
      const element = document.createElement("meta");
      element.setAttribute("property", "og:title");
      return element;
    },
    page.meta?.og_title || title,
  );

  upsertMeta(
    'meta[property="og:description"]',
    () => {
      const element = document.createElement("meta");
      element.setAttribute("property", "og:description");
      return element;
    },
    page.meta?.og_description || description,
  );

  upsertMeta(
    'meta[property="og:image"]',
    () => {
      const element = document.createElement("meta");
      element.setAttribute("property", "og:image");
      return element;
    },
    page.meta?.og_image || settings.seo?.default_og_image,
  );

  const robots = [page.meta?.no_index ? "noindex" : "", page.meta?.no_follow ? "nofollow" : ""]
    .filter(Boolean)
    .join(",");
  upsertMeta(
    'meta[name="robots"]',
    () => {
      const element = document.createElement("meta");
      element.setAttribute("name", "robots");
      return element;
    },
    robots,
  );

  if (page.meta?.canonical_url) {
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", page.meta.canonical_url);
  }

  if (settings.business.logos?.favicon) {
    let icon = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!icon) {
      icon = document.createElement("link");
      icon.setAttribute("rel", "icon");
      document.head.appendChild(icon);
    }
    icon.setAttribute("href", settings.business.logos.favicon);
  }

  if (page.meta?.structured_data) {
    let script = document.head.querySelector<HTMLScriptElement>("#cms-structured-data");
    if (!script) {
      script = document.createElement("script");
      script.id = "cms-structured-data";
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent =
      typeof page.meta.structured_data === "string"
        ? page.meta.structured_data
        : JSON.stringify(page.meta.structured_data);
  }
}

function NavLink({
  item,
  depth = 0,
  hasChildren = false,
  onClick,
}: {
  item: NavItem;
  depth?: number;
  hasChildren?: boolean;
  onClick?: () => void;
}) {
  const url = item.url || "#";
  const Caret = depth === 0 ? ChevronDown : ChevronRight;
  const content = (
    <>
      <span>{item.label}</span>
      {hasChildren ? <Caret aria-hidden="true" className="nav-caret" size={15} /> : null}
    </>
  );

  if (item.type === "label" || (hasChildren && !item.url)) {
    return (
      <span className={hasChildren ? "nav-link dropdown-trigger has-children" : "nav-link dropdown-trigger"}>
        {content}
      </span>
    );
  }

  return (
    <a
      className={hasChildren ? "nav-link has-children" : "nav-link"}
      href={url}
      aria-haspopup={hasChildren ? "true" : undefined}
      target={item.open_in_new_tab ? "_blank" : undefined}
      rel={item.open_in_new_tab || isExternalUrl(url) ? "noreferrer" : undefined}
      onClick={onClick}
    >
      {content}
    </a>
  );
}

function DesktopNavItem({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const children = sortedNav(item.children || []);
  const hasChildren = children.length > 0;
  const className = depth === 0 ? "nav-item" : "nav-subitem";

  return (
    <div className={`${className} nav-depth-${Math.min(depth, 3)}`} key={item.id}>
      <NavLink item={item} depth={depth} hasChildren={hasChildren} />
      {hasChildren ? (
        <div className={depth === 0 ? "dropdown-menu nav-submenu" : "nav-submenu"}>
          {children.map((child) => (
            <DesktopNavItem item={child} depth={depth + 1} key={child.id} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MobileNavItem({
  item,
  depth = 0,
  onNavigate,
}: {
  item: NavItem;
  depth?: number;
  onNavigate: () => void;
}) {
  const children = sortedNav(item.children || []);
  const hasChildren = children.length > 0;
  const style = { "--nav-depth": depth } as CSSProperties;

  return (
    <div className="mobile-nav-item" key={item.id} style={style}>
      <NavLink item={item} depth={depth} hasChildren={hasChildren} onClick={onNavigate} />
      {hasChildren ? (
        <div className="mobile-child-links">
          {children.map((child) => (
            <MobileNavItem item={child} depth={depth + 1} key={child.id} onNavigate={onNavigate} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function canRenderNavCta(item?: NavItem) {
  return Boolean(item?.url && item.type !== "label" && !item.children?.length);
}

function NavCta({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const url = item.url || "#";

  return (
    <a
      className="btn btn-header"
      href={url}
      target={item.open_in_new_tab ? "_blank" : undefined}
      rel={item.open_in_new_tab || isExternalUrl(url) ? "noreferrer" : undefined}
      onClick={onClick}
    >
      <span>{item.label}</span>
      <ArrowUpRight aria-hidden="true" size={17} />
    </a>
  );
}

function PageContent({
  left,
  right,
  context,
}: {
  left: CmsBlock[];
  right: CmsBlock[];
  context: CmsRenderContext;
}) {
  if (!left.length && !right.length) return null;

  if (right.length) {
    return (
      <section className="section cms-section">
        <div className="cms-layout">
          <div>
            {left.map((block, index) => (
              <ContentBlock block={block} context={context} key={`${block.type}-${block.id || index}`} />
            ))}
          </div>
          <div>
            {right.map((block, index) => (
              <ContentBlock block={block} context={context} key={`${block.type}-${block.id || index}`} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="page-blocks">
      {left.map((block, index) => (
        <ContentBlock block={block} context={context} key={`${block.type}-${block.id || index}`} />
      ))}
    </div>
  );
}

export default function App() {
  const [settings, setSettings] = useState<SiteSettings>(fallbackSettings);
  const [route, setRoute] = useState<ResolvedRoute>({ type: "page", page: fallbackHomePage });
  const [navigation, setNavigation] = useState<NavItem[]>(fallbackNavigation);
  const [footerNavigation, setFooterNavigation] = useState<NavItem[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>(fallbackFaqs);
  const [reviews, setReviews] = useState<Review[]>(fallbackReviews);
  const [form, setForm] = useState<CmsForm | null>(null);
  const [activeFormId, setActiveFormId] = useState(contactFormId);
  const [feedEntries, setFeedEntries] = useState<Record<string, FeedEntry[]>>({});
  const [cmsReady, setCmsReady] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadCmsContent() {
      try {
        const pathname = window.location.pathname;
        const [nextSettings, nextHeaderNav, nextFooterNav, pages, modules, nextFaqs, nextReviews] =
          await Promise.all([
            getSettings(),
            getNavigation("header"),
            getNavigation("footer"),
            getPages(),
            getModules(),
            getFaqs(),
            getReviews(),
          ]);
        const nextRoute = await resolveRoute(
          pathname,
          pages,
          modules,
          nextFaqs,
          nextReviews,
          new URLSearchParams(window.location.search),
        );
        const nextPage = nextRoute.page;

        const inferredFormId = contactFormId || extractFormId(nextPage);
        const feedModules = new Set(extractFeedModules(nextPage));
        if (normalizePath(pathname) === "" && !feedModules.has("hero-slides")) {
          feedModules.add("hero-slides");
        }
        const [nextForm, feedPairs] = await Promise.all([
          getFormStructure(inferredFormId),
          Promise.all(
            [...feedModules].map(async (moduleName) => {
              const cmsModule = findModule(modules, [moduleName]);
              const queryKey = cmsModule ? moduleQueryKey(cmsModule) : moduleName;
              return {
                keys: [moduleName, cmsModule?.slug, cmsModule?.id].filter(Boolean) as string[],
                entries: await getFeedEntries(queryKey),
              };
            }),
          ),
        ]);

        if (!active) return;

        applyDesignTokens(nextSettings);
        syncDocumentHead(nextPage, nextSettings);
        setSettings(nextSettings);
        setNavigation(nextHeaderNav);
        setFooterNavigation(nextFooterNav);
        setRoute(nextRoute);
        setFaqs(nextFaqs);
        setReviews(nextReviews);
        setForm(nextForm);
        setActiveFormId(inferredFormId);
        setFeedEntries(
          feedPairs.reduce<Record<string, FeedEntry[]>>((current, pair) => {
            pair.keys.forEach((key) => {
              current[key] = pair.entries;
            });
            return current;
          }, {}),
        );
      } finally {
        if (active) setCmsReady(true);
      }
    }

    loadCmsContent();

    return () => {
      active = false;
    };
  }, []);

  const page = route.page;

  useEffect(() => {
    if (!cmsReady) return;

    const sections = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".page-blocks > .proof-band, .page-blocks > .section, .page-blocks > .workbench-section, .page-blocks > .contact-section, .page-blocks > .module-hero, .page-blocks > .module-detail, .site-footer",
      ),
    );

    if (!sections.length) return;

    const isServicesPage = "moduleKind" in route && route.moduleKind === "services";

    if (isServicesPage) {
      sections.forEach((section) => {
        section.classList.add("section-reveal", "section-visible");
      });
      return;
    }

    sections.forEach((section) => section.classList.add("section-reveal"));

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      sections.forEach((section) => section.classList.add("section-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("section-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [cmsReady, page.id, route]);

  const business = settings.business;
  const companyName = business.name || settings.site.name || "Rinae Web Studio";
  const footerDescription =
    business.short_description && business.short_description.trim().toLowerCase() !== companyName.trim().toLowerCase()
      ? business.short_description
      : "";
  const navItems = useMemo(() => sortedNav(navigation), [navigation]);
  const headerCta = useMemo(() => {
    const lastItem = navItems[navItems.length - 1];
    return canRenderNavCta(lastItem) ? lastItem : undefined;
  }, [navItems]);
  const primaryNavItems = useMemo(
    () => (headerCta ? navItems.slice(0, -1) : navItems),
    [headerCta, navItems],
  );
  const footerItems = useMemo(
    () => sortedNav(footerNavigation),
    [footerNavigation],
  );
  const { hero, left, right } = useMemo(() => splitHero(page), [page]);
  const context = useMemo<CmsRenderContext>(
    () => ({
      page,
      settings,
      faqs,
      reviews,
      form,
      formId: activeFormId,
      feedEntries,
    }),
    [activeFormId, faqs, feedEntries, form, page, reviews, settings],
  );

  if (!cmsReady) {
    return <div className="site-loading" aria-label="Loading site content" />;
  }

  return (
    <div className="site-shell">
      {page.custom_css ? <style>{page.custom_css}</style> : null}

      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="/" aria-label={`${companyName} home`}>
            {business.logos?.rectangular ? (
              <img src={business.logos.rectangular} alt={companyName} className="brand-logo" />
            ) : business.logos?.square ? (
              <img src={business.logos.square} alt={companyName} className="brand-logo square" />
            ) : (
              <>
                <span className="brand-mark">{companyName.slice(0, 1)}</span>
                <span className="brand-name">{companyName}</span>
              </>
            )}
          </a>

          <nav className="nav-menu" aria-label="Primary navigation">
            {primaryNavItems.map((item) => (
              <DesktopNavItem item={item} key={item.id} />
            ))}
          </nav>

          <div className="header-actions">
            {business.phone ? (
              <a className="icon-action" href={`tel:${business.phone}`} aria-label="Call">
                <Phone aria-hidden="true" size={18} />
              </a>
            ) : null}
            {headerCta ? <NavCta item={headerCta} /> : null}
            <button
              className="icon-action menu-toggle"
              type="button"
              aria-label="Toggle navigation"
              aria-expanded={navOpen}
              onClick={() => setNavOpen((open) => !open)}
            >
              {navOpen ? <X aria-hidden="true" size={22} /> : <Menu aria-hidden="true" size={22} />}
            </button>
          </div>
        </div>

        <div className={navOpen ? "mobile-nav open" : "mobile-nav"}>
          {primaryNavItems.map((item) => (
            <MobileNavItem item={item} key={item.id} onNavigate={() => setNavOpen(false)} />
          ))}
          {headerCta ? <NavCta item={headerCta} onClick={() => setNavOpen(false)} /> : null}
        </div>
      </header>

      <main>
        {route.type === "page" ? (
          <>
            <ContentBlock block={hero} context={context} />
            <PageContent left={left} right={right} context={context} />
          </>
        ) : route.type === "module-list" ? (
          <ModuleListPage
            module={route.module}
            kind={route.moduleKind}
            entries={route.entries}
            faqs={faqs}
            reviews={reviews}
            settings={settings}
            copy={route.copy}
            filters={route.filters}
          />
        ) : route.type === "module-detail" ? (
          <ModuleDetailPage
            module={route.module}
            kind={route.moduleKind}
            entry={route.entry}
            related={route.related}
            copy={route.copy}
            settings={settings}
          />
        ) : (
          <EventCalendarPage
            module={route.module}
            entries={route.entries}
            mode={route.mode}
            copy={route.copy}
          />
        )}
      </main>

      <footer className="site-footer">
        <div className="footer-brand">
          {business.logos?.rectangular ? (
            <img src={business.logos.rectangular} alt={companyName} className="footer-logo" />
          ) : business.logos?.square ? (
            <img src={business.logos.square} alt={companyName} className="footer-logo square" />
          ) : (
            <strong>{companyName}</strong>
          )}
          {footerDescription ? <span>{footerDescription}</span> : null}
        </div>
        {footerItems.length ? (
          <nav className="footer-nav" aria-label="Footer navigation">
            {footerItems.slice(0, 6).map((item) => (
              <a
                key={item.id}
                href={item.url || "#"}
                target={item.open_in_new_tab ? "_blank" : undefined}
                rel={item.open_in_new_tab ? "noreferrer" : undefined}
              >
                {item.label}
              </a>
            ))}
          </nav>
        ) : null}
      </footer>
    </div>
  );
}
