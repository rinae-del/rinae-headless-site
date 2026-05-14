import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Code2,
  Gauge,
  Layers3,
  Mail,
  Menu,
  Phone,
  Send,
  ShieldCheck,
  Star,
  X,
  Zap,
} from "lucide-react";
import { ContentBlock } from "./components/ContentBlock";
import {
  applyDesignTokens,
  contactFormId,
  fallbackFaqs,
  fallbackHomePage,
  fallbackNavigation,
  fallbackReviews,
  fallbackSettings,
  getFaqs,
  getFormStructure,
  getHomePage,
  getNavigation,
  getReviews,
  getSettings,
  submitForm,
  type CmsFormField,
  type CmsForm,
  type CmsPage,
  type Faq,
  type NavItem,
  type Review,
  type SiteSettings,
} from "./lib/squareflo";

const services = [
  {
    icon: Zap,
    title: "Urgent launch sprints",
    text: "Focused React builds for campaigns, rebrands, and investor-facing moments that cannot drift.",
  },
  {
    icon: Layers3,
    title: "Headless CMS systems",
    text: "Squareflo pages, navigation, settings, forms, FAQs, reviews, and feed content rendered with care.",
  },
  {
    icon: Gauge,
    title: "Performance polish",
    text: "Fast interfaces with stable layouts, responsive details, and conversion paths that stay obvious.",
  },
  {
    icon: ShieldCheck,
    title: "Professional trust layer",
    text: "Serious visual systems, accessible components, SEO metadata, and launch-ready structure.",
  },
];

const processSteps = [
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
];

const fallbackFields: CmsFormField[] = [
  { key: "name", label: "Name", type: "text", required: true },
  { key: "email", label: "Email", type: "email", required: true },
  { key: "project", label: "Project urgency", type: "text", required: true },
  { key: "message", label: "Brief", type: "textarea", required: true },
];

function hasHeadlessContent(page: CmsPage) {
  const left = page.headless_content?.left?.blocks || [];
  const right = page.headless_content?.right?.blocks || [];
  return left.length > 0 || right.length > 0;
}

function isExternalUrl(url?: string) {
  return Boolean(url && /^(https?:|mailto:|tel:)/.test(url));
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
      target={item.open_in_new_tab || isExternalUrl(url) ? "_blank" : undefined}
      rel={item.open_in_new_tab || isExternalUrl(url) ? "noreferrer" : undefined}
      onClick={onClick}
    >
      {item.label}
    </a>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="stars" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={16}
          aria-hidden="true"
          fill={index < Math.round(rating) ? "currentColor" : "none"}
        />
      ))}
    </div>
  );
}

function ContactForm({ form, email }: { form: CmsForm | null; email?: string }) {
  const fields = form?.fields?.length ? form.fields : fallbackFields;
  const [values, setValues] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");

    try {
      if (form?.id && contactFormId) {
        await submitForm(form.id, values);
      }
      setStatus("sent");
      setValues({});
    } catch {
      setStatus("error");
    }
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        {fields.map((field) => (
          <label className={field.type === "textarea" ? "field field-wide" : "field"} key={field.key}>
            <span>{field.label}</span>
            {field.type === "textarea" ? (
              <textarea
                required={field.required}
                value={values[field.key] || ""}
                placeholder={field.placeholder || ""}
                onChange={(event) =>
                  setValues((current) => ({ ...current, [field.key]: event.target.value }))
                }
              />
            ) : (
              <input
                type={field.type || "text"}
                required={field.required}
                value={values[field.key] || ""}
                placeholder={field.placeholder || ""}
                onChange={(event) =>
                  setValues((current) => ({ ...current, [field.key]: event.target.value }))
                }
              />
            )}
          </label>
        ))}
      </div>

      <div className="form-actions">
        <button className="btn btn-primary" type="submit" disabled={status === "sending"}>
          <span>
            {status === "sending"
              ? "Sending"
              : form?.submit_label || "Send brief"}
          </span>
          <Send aria-hidden="true" size={18} />
        </button>
        {email ? (
          <a className="text-link" href={`mailto:${email}`}>
            {email}
          </a>
        ) : null}
      </div>

      {status === "sent" ? (
        <p className="form-note success">
          {form?.success_message || "Brief received. We will follow up shortly."}
        </p>
      ) : null}
      {status === "error" ? (
        <p className="form-note error">The message could not send. Please use the email link.</p>
      ) : null}
    </form>
  );
}

export default function App() {
  const [settings, setSettings] = useState<SiteSettings>(fallbackSettings);
  const [page, setPage] = useState<CmsPage>(fallbackHomePage);
  const [navigation, setNavigation] = useState<NavItem[]>(fallbackNavigation);
  const [faqs, setFaqs] = useState<Faq[]>(fallbackFaqs);
  const [reviews, setReviews] = useState<Review[]>(fallbackReviews);
  const [form, setForm] = useState<CmsForm | null>(null);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadCmsContent() {
      const [nextSettings, nextNavigation, nextPage, nextFaqs, nextReviews, nextForm] =
        await Promise.all([
          getSettings(),
          getNavigation("header"),
          getHomePage(),
          getFaqs(),
          getReviews(),
          getFormStructure(contactFormId),
        ]);

      if (!active) return;

      applyDesignTokens(nextSettings);
      setSettings(nextSettings);
      setNavigation(nextNavigation);
      setPage(nextPage);
      setFaqs(nextFaqs);
      setReviews(nextReviews);
      setForm(nextForm);

      document.title = nextPage.meta?.title || nextSettings.seo?.default_title || nextSettings.site.name;
    }

    loadCmsContent();

    return () => {
      active = false;
    };
  }, []);

  const business = settings.business;
  const companyName = business.name || settings.site.name || "Rinae Web Studio";
  const primaryLocation = business.locations?.[0];
  const rating = primaryLocation?.google_places?.rating;
  const totalReviews = primaryLocation?.google_places?.total_reviews;
  const cmsContentAvailable = hasHeadlessContent(page);

  const navItems = useMemo(
    () => navigation.slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
    [navigation],
  );

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="/" aria-label={`${companyName} home`}>
            {/* {business.logos?.rectangular ? (
              <img src={business.logos.rectangular} alt={companyName} className="brand-logo" />
            ) : (
              <span className="brand-mark">R</span>
            )} */}
            <span className="brand-name">{companyName}</span>
          </a>

          <nav className="nav-menu" aria-label="Primary navigation">
            {navItems.map((item) => (
              <div className="nav-item" key={item.id}>
                <NavLink item={item} />
                {item.children?.length ? (
                  <div className="dropdown-menu">
                    {item.children.map((child) => (
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
            <a className="btn btn-header" href="#contact">
              Start
              <ArrowUpRight aria-hidden="true" size={17} />
            </a>
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
          {navItems.map((item) => (
            <NavLink item={item} key={item.id} onClick={() => setNavOpen(false)} />
          ))}
        </div>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-inner">
            <div className="hero-copy">
              <p className="eyebrow">Headless React delivery</p>
              <h1 id="hero-title">Web development agency for urgent launches</h1>
              <p className="hero-lede">
                Sleek, CMS-powered websites for teams that need the work to feel premium, move
                quickly, and stand up to serious scrutiny.
              </p>
              <div className="hero-actions">
                <a className="btn btn-primary" href="#contact">
                  <span>Start a build</span>
                  <ArrowRight aria-hidden="true" size={18} />
                </a>
                <a className="btn btn-secondary" href="#process">
                  <span>View process</span>
                  <ArrowUpRight aria-hidden="true" size={18} />
                </a>
              </div>
              <div className="hero-metrics" aria-label="Delivery highlights">
                <div>
                  <strong>1-3 wk</strong>
                  <span>focused launch windows</span>
                </div>
                <div>
                  <strong>CMS</strong>
                  <span>Squareflo managed content</span>
                </div>
                <div>
                  <strong>SEO</strong>
                  <span>metadata and structure ready</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="proof-band" id="proof" aria-label="Trust signals">
          <div className="proof-grid">
            <div>
              <span>Frontend</span>
              <strong>React interface</strong>
            </div>
            <div>
              <span>Content</span>
              <strong>Squareflo API</strong>
            </div>
            <div>
              <span>Design</span>
              <strong>Poppins system</strong>
            </div>
            <div>
              <span>Launch</span>
              <strong>Vercel ready</strong>
            </div>
          </div>
        </section>

        <section className="section services-section" id="services">
          <div className="section-heading">
            <p className="eyebrow dark">Services</p>
            <h2>Built for the moment when your website needs to look established now.</h2>
            <p>
              The frontend is structured for dynamic CMS content while keeping the visual system
              focused, premium, and easy to scan.
            </p>
          </div>

          <div className="services-grid">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <article className="service-card" key={service.title}>
                  <span className="icon-tile" aria-hidden="true">
                    <Icon size={24} />
                  </span>
                  <h3>{service.title}</h3>
                  <p>{service.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="workbench-section">
          <div className="workbench-copy">
            <p className="eyebrow dark">Headless architecture</p>
            <h2>CMS data becomes a composed, branded frontend instead of a generic template.</h2>
            <p>
              Pages, settings, navigation, reviews, FAQs, and form structures are fetched from
              Squareflo, then styled through a responsive React presentation layer.
            </p>
            <ul className="check-list">
              <li>
                <CheckCircle2 aria-hidden="true" size={19} />
                Runtime design tokens mapped to CSS variables
              </li>
              <li>
                <CheckCircle2 aria-hidden="true" size={19} />
                CMS block renderer for two-column page content
              </li>
              <li>
                <CheckCircle2 aria-hidden="true" size={19} />
                Contact form path ready for Squareflo submissions
              </li>
            </ul>
          </div>

          <div className="terminal-visual" aria-label="Frontend system preview">
            <div className="terminal-bar">
              <span />
              <span />
              <span />
              <strong>headless-site.tsx</strong>
            </div>
            <div className="terminal-body">
              <p>
                <span>const</span> page = await cms("/pages/home")
              </p>
              <p>
                <span>render</span> &lt;Hero content=&#123;page&#125; /&gt;
              </p>
              <p>
                <span>apply</span> design.tokens.toCSS()
              </p>
              <div className="terminal-preview">
                <Code2 aria-hidden="true" size={26} />
                <div>
                  <strong>Structured content</strong>
                  <small>Fast frontend. Serious brand feel.</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        {cmsContentAvailable ? (
          <section className="section cms-section">
            <div className="section-heading compact">
              <p className="eyebrow dark">CMS page</p>
              <h2>{page.title}</h2>
            </div>
            <div className="cms-layout">
              <div>
                {page.headless_content?.left?.blocks?.map((block, index) => (
                  <ContentBlock block={block} key={`${block.type}-${index}`} />
                ))}
              </div>
              <div>
                {page.headless_content?.right?.blocks?.map((block, index) => (
                  <ContentBlock block={block} key={`${block.type}-${index}`} />
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="section process-section" id="process">
          <div className="section-heading">
            <p className="eyebrow dark">Process</p>
            <h2>Disciplined enough for corporate stakeholders, quick enough for urgency.</h2>
          </div>
          <div className="process-grid">
            {processSteps.map((step) => (
              <article className="process-card" key={step.label}>
                <span>{step.label}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section reviews-section">
          <div className="section-heading compact">
            <p className="eyebrow dark">Proof</p>
            <h2>Clients should feel the site is already operating at the next level.</h2>
            {rating ? (
              <p>
                {rating.toFixed(1)} average rating
                {totalReviews ? ` from ${totalReviews} reviews` : ""}
              </p>
            ) : null}
          </div>
          <div className="review-grid">
            {reviews.map((review) => (
              <article className="review-card" key={review.id}>
                <StarRating rating={review.rating} />
                <p>{review.text}</p>
                <footer>
                  <strong>{review.author_name}</strong>
                  {review.relative_time ? <span>{review.relative_time}</span> : null}
                </footer>
              </article>
            ))}
          </div>
        </section>

        <section className="section faq-section">
          <div className="section-heading compact">
            <p className="eyebrow dark">Questions</p>
            <h2>Clear answers before the first call.</h2>
          </div>
          <div className="faq-list">
            {faqs.map((faq, index) => (
              <details key={faq.id} open={index === 0}>
                <summary>{faq.question}</summary>
                <p dangerouslySetInnerHTML={{ __html: faq.answer }} />
              </details>
            ))}
          </div>
        </section>

        <section className="contact-section" id="contact">
          <div className="contact-inner">
            <div className="contact-copy">
              <p className="eyebrow">Start the build</p>
              <h2>Bring the deadline. We will bring the structure, polish, and launch focus.</h2>
              <p>{business.short_description || settings.site.description}</p>
              <div className="contact-links">
                {business.email ? (
                  <a href={`mailto:${business.email}`}>
                    <Mail aria-hidden="true" size={18} />
                    {business.email}
                  </a>
                ) : null}
                {business.phone ? (
                  <a href={`tel:${business.phone}`}>
                    <Phone aria-hidden="true" size={18} />
                    {business.phone}
                  </a>
                ) : null}
              </div>
            </div>
            <ContactForm form={form} email={business.email} />
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div>
          <strong>{companyName}</strong>
          <span>{settings.site.description || business.short_description}</span>
        </div>
        <a href="#hero-title">Back to top</a>
      </footer>
    </div>
  );
}
