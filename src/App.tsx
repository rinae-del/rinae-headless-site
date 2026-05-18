import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Menu, Phone, X } from "lucide-react";
import { ContentBlock, type CmsRenderContext } from "./components/ContentBlock";
import {
  applyDesignTokens,
  contactFormId,
  fallbackFaqs,
  fallbackHomePage,
  fallbackNavigation,
  fallbackReviews,
  fallbackSettings,
  getFaqs,
  getFeedEntries,
  getFormStructure,
  getPageForPath,
  getNavigation,
  getReviews,
  getSettings,
  type CmsBlock,
  type CmsForm,
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
    const moduleSlug = fieldString(block, [
      "module",
      "module_slug",
      "feed",
      "feed_slug",
      "source_module",
      "entries_module",
    ]);
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

function NavLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const hasChildren = Boolean(item.children?.length);
  const url = item.url || "#";

  if (item.type === "label" || (hasChildren && !item.url)) {
    return <span className="nav-link dropdown-trigger">{item.label}</span>;
  }

  return (
    <a
      className="nav-link"
      href={url}
      target={item.open_in_new_tab ? "_blank" : undefined}
      rel={item.open_in_new_tab || isExternalUrl(url) ? "noreferrer" : undefined}
      onClick={onClick}
    >
      {item.label}
    </a>
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
  const [page, setPage] = useState<CmsPage>(fallbackHomePage);
  const [navigation, setNavigation] = useState<NavItem[]>(fallbackNavigation);
  const [footerNavigation, setFooterNavigation] = useState<NavItem[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>(fallbackFaqs);
  const [reviews, setReviews] = useState<Review[]>(fallbackReviews);
  const [form, setForm] = useState<CmsForm | null>(null);
  const [activeFormId, setActiveFormId] = useState(contactFormId);
  const [feedEntries, setFeedEntries] = useState<Record<string, FeedEntry[]>>({});
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadCmsContent() {
      const pathname = window.location.pathname;
      const [nextSettings, nextHeaderNav, nextFooterNav, nextPage, nextFaqs, nextReviews] =
        await Promise.all([
          getSettings(),
          getNavigation("header"),
          getNavigation("footer"),
          getPageForPath(pathname),
          getFaqs(),
          getReviews(),
        ]);

      const inferredFormId = contactFormId || extractFormId(nextPage);
      const feedModules = extractFeedModules(nextPage);
      const [nextForm, feedPairs] = await Promise.all([
        getFormStructure(inferredFormId),
        Promise.all(
          feedModules.map(async (module) => [module, await getFeedEntries(module)] as const),
        ),
      ]);

      if (!active) return;

      applyDesignTokens(nextSettings);
      syncDocumentHead(nextPage, nextSettings);
      setSettings(nextSettings);
      setNavigation(nextHeaderNav);
      setFooterNavigation(nextFooterNav);
      setPage(nextPage);
      setFaqs(nextFaqs);
      setReviews(nextReviews);
      setForm(nextForm);
      setActiveFormId(inferredFormId);
      setFeedEntries(Object.fromEntries(feedPairs));
    }

    loadCmsContent();

    return () => {
      active = false;
    };
  }, []);

  const business = settings.business;
  const companyName = business.name || settings.site.name || "Rinae Web Studio";
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
    () => sortedNav(footerNavigation.length ? footerNavigation : navigation),
    [footerNavigation, navigation],
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
              <span className="brand-mark">{companyName.slice(0, 1)}</span>
            )}
            <span className="brand-name">{companyName}</span>
          </a>

          <nav className="nav-menu" aria-label="Primary navigation">
            {primaryNavItems.map((item) => (
              <div className="nav-item" key={item.id}>
                <NavLink item={item} />
                {item.children?.length ? (
                  <div className="dropdown-menu">
                    {sortedNav(item.children).map((child) => (
                      <NavLink item={child} key={child.id} />
                    ))}
                  </div>
                ) : null}
              </div>
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
            <div className="mobile-nav-item" key={item.id}>
              <NavLink item={item} onClick={() => setNavOpen(false)} />
              {item.children?.length ? (
                <div className="mobile-child-links">
                  {sortedNav(item.children).map((child) => (
                    <NavLink item={child} key={child.id} onClick={() => setNavOpen(false)} />
                  ))}
                </div>
              ) : null}
            </div>
          ))}
          {headerCta ? <NavCta item={headerCta} onClick={() => setNavOpen(false)} /> : null}
        </div>
      </header>

      <main>
        <ContentBlock block={hero} context={context} />
        <PageContent left={left} right={right} context={context} />
      </main>

      <footer className="site-footer">
        <div>
          <strong>{companyName}</strong>
          <span>{settings.site.description || business.short_description}</span>
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
        <a href="#home">Back to top</a>
      </footer>
    </div>
  );
}
