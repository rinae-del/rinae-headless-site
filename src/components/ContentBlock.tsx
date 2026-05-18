import { type CSSProperties, type ElementType } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Code2,
  Gauge,
  Layers3,
  Mail,
  Phone,
  ShieldCheck,
  Star,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { ContactForm } from "./ContactForm";
import type {
  CmsBlock,
  CmsField,
  CmsForm,
  CmsPage,
  Faq,
  FeedEntry,
  Review,
  SiteSettings,
} from "../lib/squareflo";

export type CmsRenderContext = {
  page: CmsPage;
  settings: SiteSettings;
  faqs: Faq[];
  reviews: Review[];
  form: CmsForm | null;
  formId?: string;
  feedEntries?: Record<string, FeedEntry[]>;
};

type Props = {
  block: CmsBlock;
  context: CmsRenderContext;
};

type SectionItem = {
  label?: unknown;
  title?: unknown;
  heading?: unknown;
  question?: unknown;
  author_name?: unknown;
  text?: unknown;
  description?: unknown;
  body?: unknown;
  answer?: unknown;
  image?: unknown;
  featured_image?: unknown;
  icon?: unknown;
  url?: unknown;
  link?: unknown;
  href?: unknown;
  rating?: unknown;
  relative_time?: unknown;
  [key: string]: unknown;
};

const iconMap: Record<string, LucideIcon> = {
  bolt: Zap,
  gauge: Gauge,
  layers: Layers3,
  shield: ShieldCheck,
  team: Users,
  user: Users,
  users: Users,
  zap: Zap,
};

function normalizeKey(value: string) {
  return value.replace(/[\s_-]/g, "").toLowerCase();
}

function slugify(value?: string) {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function isEmpty(value: unknown) {
  return (
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  );
}

function fieldsOf(block: CmsBlock) {
  return Array.isArray(block.fields) ? block.fields : [];
}

function fieldKey(field: CmsField) {
  return stringFrom(field.key || field.name || field.slug || field.id);
}

function resolveSourceValue(field: CmsField, context: CmsRenderContext) {
  if (!isEmpty(field.value)) return field.value;

  const source = normalizeKey(String(field.source_field || ""));
  if (!source) return field.value;

  const { settings, page, faqs, reviews } = context;
  const business = settings.business;

  if (source === "title" || source === "pagetitle") return page.title;
  if (source === "description" || source === "pagedescription") {
    return page.meta?.description || settings.site.description || business.short_description;
  }
  if (source === "ogimage" || source === "image" || source === "heroimage") {
    return page.meta?.og_image || settings.seo?.default_og_image;
  }
  if (source === "sitename") return settings.site.name;
  if (source === "businessname" || source === "companyname") return business.name;
  if (source === "businessdescription" || source === "shortdescription") {
    return business.short_description || settings.site.description;
  }
  if (source === "phone" || source === "businessphone") return business.phone;
  if (source === "email" || source === "businessemail") return business.email;
  if (source === "reviews") return reviews;
  if (source === "faqs") return faqs;

  return field.value;
}

function fieldRaw(
  block: CmsBlock,
  keys: string[],
  context: CmsRenderContext,
): unknown {
  const normalizedKeys = keys.map(normalizeKey);
  const field = fieldsOf(block).find((candidate) =>
    normalizedKeys.includes(normalizeKey(fieldKey(candidate))),
  );

  return field ? resolveSourceValue(field, context) : undefined;
}

function stringFrom(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (!value || typeof value !== "object") return "";

  const record = value as Record<string, unknown>;
  return stringFrom(
    record.text ||
      record.content ||
      record.label ||
      record.title ||
      record.url ||
      record.src ||
      record.value,
  );
}

function fieldString(
  block: CmsBlock,
  keys: string[],
  context: CmsRenderContext,
  fallback = "",
) {
  const value = fieldRaw(block, keys, context);
  const text = stringFrom(value);
  return text || fallback;
}

function parseArrayValue(value: unknown): SectionItem[] {
  if (Array.isArray(value)) {
    return value.map((item) =>
      typeof item === "string" ? { label: item, title: item } : (item as SectionItem),
    );
  }
  if (typeof value !== "string" || !value.trim()) return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed as SectionItem[];
  } catch {
    return value
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, title, text, href] = line.split("|").map((part) => part.trim());
        return { label, title: title || label, text, href };
      });
  }

  return [];
}

function parseActionValue(value: unknown): SectionItem[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item !== "string") return item as SectionItem;
        const [label, href, style] = item.split("|").map((part) => part.trim());
        return { label, title: label, href, style };
      })
      .filter((item) => stringFrom(item.label || item.title));
  }

  if (typeof value !== "string" || !value.trim()) return [];

  try {
    const parsed = JSON.parse(value);
    return parseActionValue(parsed);
  } catch {
    return value
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, href, style] = line.split("|").map((part) => part.trim());
        return { label, title: label, href, style };
      })
      .filter((item) => stringFrom(item.label || item.title));
  }
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function entryToItem(entry: FeedEntry): SectionItem {
  const data = entry.data || {};
  const text = stringFrom(data.excerpt || data.description || data.summary || data.body);
  return {
    title: entry.title,
    text: stripHtml(text),
    image: data.featured_image || data.image || data.photo || data.thumbnail,
    url: `/${entry.slug}`,
    label: entry.categories?.[0],
  };
}

function sectionItems(
  block: CmsBlock,
  context: CmsRenderContext,
  keys = ["items", "cards", "features", "steps", "metrics", "stats", "entries"],
) {
  const directItems = parseArrayValue(fieldRaw(block, keys, context));
  if (directItems.length) return directItems;

  const moduleSlug = fieldString(
    block,
    ["module", "module_slug", "feed", "feed_slug", "source_module", "entries_module"],
    context,
  );
  const entries = moduleSlug ? context.feedEntries?.[moduleSlug] || [] : [];
  return entries.map(entryToItem);
}

function sectionId(block: CmsBlock, context: CmsRenderContext, fallback: string) {
  return slugify(fieldString(block, ["anchor", "section_id", "html_id", "id"], context, fallback));
}

function itemText(item: SectionItem, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = stringFrom(item[key]);
    if (value) return value;
  }
  return fallback;
}

function imageFrom(value: unknown) {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  return stringFrom(record.src || record.url || record.image || record.value);
}

function sectionImage(block: CmsBlock, context: CmsRenderContext) {
  return imageFrom(
    fieldRaw(
      block,
      [
        "background_image",
        "hero_background_image",
        "background",
        "backgroundImage",
        "bg_image",
        "image",
        "hero_image",
        "heroImage",
        "photo",
      ],
      context,
    ),
  );
}

function iconFor(item: SectionItem, index: number) {
  const name = normalizeKey(stringFrom(item.icon || item.label || item.title));
  const fallbackIcons = [Zap, Layers3, Gauge, ShieldCheck];
  return iconMap[name] || fallbackIcons[index % fallbackIcons.length];
}

function getBlocks(value: unknown): CmsBlock[] {
  if (!value || typeof value !== "object") return [];
  const maybeColumn = value as { blocks?: CmsBlock[] };
  return Array.isArray(maybeColumn.blocks) ? maybeColumn.blocks : [];
}

function blockText(block: CmsBlock) {
  return stringFrom(block.text || block.content || block.label);
}

function buttonHref(block: CmsBlock) {
  return stringFrom(block.linkValue || block.url || block.href) || "#";
}

function buttonStyle(value: string, fallback: string) {
  const normalized = value.toLowerCase();
  return ["primary", "secondary", "outline", "ghost"].includes(normalized)
    ? normalized
    : fallback;
}

function heroActions(block: CmsBlock, context: CmsRenderContext) {
  const listedActions = parseActionValue(fieldRaw(block, ["actions", "buttons", "ctas", "links"], context))
    .map((item, index) => ({
      label: itemText(item, ["label", "title", "text", "heading"]),
      href: itemText(item, ["href", "url", "link", "linkValue", "link_value"]),
      style: buttonStyle(
        itemText(item, ["style", "variant"]),
        index === 0 ? "primary" : "secondary",
      ),
    }))
    .filter((item) => item.label);

  if (listedActions.length) return listedActions;

  const primaryLabel = fieldString(
    block,
    [
      "primary_label",
      "primary_text",
      "primary_button_text",
      "primary_button_label",
      "primary_cta_text",
      "primary_cta_label",
      "button_text",
      "button_label",
      "cta_text",
      "cta_label",
      "start_text",
      "start_label",
    ],
    context,
  );
  const primaryLink = fieldString(
    block,
    [
      "primary_link",
      "primary_url",
      "primary_button_link",
      "primary_button_url",
      "primary_cta_link",
      "primary_cta_url",
      "button_link",
      "button_url",
      "cta_link",
      "cta_url",
      "start_link",
      "start_url",
      "link",
      "linkValue",
    ],
    context,
  );
  const secondaryLabel = fieldString(
    block,
    ["secondary_label", "secondary_text", "secondary_button_text", "secondary_button_label", "secondary_cta_text"],
    context,
  );
  const secondaryLink = fieldString(
    block,
    ["secondary_link", "secondary_url", "secondary_button_link", "secondary_button_url", "secondary_cta_url"],
    context,
  );

  return [
    primaryLabel ? { label: primaryLabel, href: primaryLink, style: "primary" } : null,
    secondaryLabel ? { label: secondaryLabel, href: secondaryLink, style: "secondary" } : null,
  ].filter(Boolean) as Array<{ label: string; href: string; style: string }>;
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

function HeroSection({ block, context }: Props) {
  const title = fieldString(
    block,
    ["heading", "hero_heading", "headline", "hero_headline", "title", "hero_title", "main_heading", "h1"],
    context,
    context.page.title,
  );
  const description = fieldString(
    block,
    [
      "description",
      "hero_description",
      "subtitle",
      "hero_subtitle",
      "subheading",
      "lede",
      "body",
      "copy",
      "text",
      "supporting_text",
    ],
    context,
    context.page.meta?.description ||
      context.settings.site.description ||
      context.settings.business.short_description ||
      "",
  );
  const eyebrow = fieldString(block, ["eyebrow", "hero_eyebrow", "kicker", "label", "pretitle", "small_heading"], context);
  const image = sectionImage(block, context) || context.page.meta?.og_image || "";
  const metrics = sectionItems(block, context, ["metrics", "stats"]);
  const actions = heroActions(block, context);
  const style = image
    ? ({
        "--hero-bg-image": `url("${image}")`,
      } as CSSProperties)
    : undefined;

  return (
    <section className="hero" id={sectionId(block, context, "home")} aria-labelledby="hero-title" style={style}>
      <div className="hero-inner">
        <div className="hero-copy">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h1 id="hero-title">{title}</h1>
          {description ? <p className="hero-lede">{description}</p> : null}
          {actions.length ? (
            <div className="hero-actions">
              {actions.map((action, index) => {
                const isPrimary = action.style === "primary";
                const Icon = isPrimary ? ArrowRight : ArrowUpRight;

                return (
                  <a
                    className={`btn btn-${action.style}`}
                    href={action.href || "#"}
                    key={`${action.label}-${index}`}
                  >
                    <span>{action.label}</span>
                    <Icon aria-hidden="true" size={18} />
                  </a>
                );
              })}
            </div>
          ) : null}
          {metrics.length ? (
            <div className="hero-metrics" aria-label="Highlights">
              {metrics.slice(0, 4).map((item, index) => {
                const label = itemText(item, ["label", "title", "heading"]);
                const description =
                  itemText(item, ["text", "description", "body"]) ||
                  (stringFrom(item.label) ? itemText(item, ["title", "heading"]) : "");

                return (
                  <div key={`${label}-${index}`}>
                    <strong>{label}</strong>
                    {description ? <span>{description}</span> : null}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ProofBand({ block, context }: Props) {
  const items = sectionItems(block, context);
  if (!items.length) return null;

  return (
    <section className="proof-band" id={sectionId(block, context, "proof")} aria-label={block.section_name || "Trust signals"}>
      <div className="proof-grid">
        {items.slice(0, 6).map((item, index) => (
          <div key={`${itemText(item, ["label", "title"])}-${index}`}>
            <span>{itemText(item, ["label"])}</span>
            <strong>{itemText(item, ["title", "heading", "text"])}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function CardSection({ block, context, variant }: Props & { variant: "services" | "cards" }) {
  const title = fieldString(block, ["heading", "headline", "title"], context, block.section_name || "");
  const description = fieldString(block, ["description", "subtitle", "body", "text"], context);
  const eyebrow = fieldString(block, ["eyebrow", "kicker", "label"], context, block.section_name || "");
  const items = sectionItems(block, context);
  const id = sectionId(block, context, variant === "services" ? "services" : slugify(block.section_slug));

  return (
    <section className={`section ${variant === "services" ? "services-section" : "cards-section"}`} id={id}>
      <div className="section-heading">
        {eyebrow ? <p className="eyebrow dark">{eyebrow}</p> : null}
        {title ? <h2>{title}</h2> : null}
        {description ? <p>{description}</p> : null}
      </div>

      {items.length ? (
        <div className={variant === "services" ? "services-grid" : "content-card-grid"}>
          {items.map((item, index) => {
            const Icon = iconFor(item, index);
            const image = imageFrom(item.image || item.featured_image);
            const itemTitle = itemText(item, ["title", "heading", "question", "label"]);
            const itemBody =
              itemText(item, ["text", "description", "body", "answer"]) ||
              (stringFrom(item.label) ? itemText(item, ["title", "heading"]) : "");
            const url = itemText(item, ["url", "link", "href"]);

            return (
              <article className={variant === "services" ? "service-card" : "content-card"} key={`${itemTitle}-${index}`}>
                {image ? <img className="card-image" src={image} alt={itemTitle} loading="lazy" /> : null}
                {!image ? (
                  <span className="icon-tile" aria-hidden="true">
                    <Icon size={24} />
                  </span>
                ) : null}
                {itemTitle ? <h3>{itemTitle}</h3> : null}
                {itemBody ? <p>{itemBody}</p> : null}
                {url ? (
                  <a className="card-link" href={url}>
                    <span>Learn more</span>
                    <ArrowUpRight aria-hidden="true" size={17} />
                  </a>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

function FeatureSection({ block, context }: Props) {
  const title = fieldString(block, ["heading", "headline", "title"], context, block.section_name || "");
  const description = fieldString(block, ["description", "subtitle", "body", "text"], context);
  const eyebrow = fieldString(block, ["eyebrow", "kicker", "label"], context, block.section_name || "");
  const items = sectionItems(block, context);
  const image = sectionImage(block, context);

  return (
    <section className="workbench-section" id={sectionId(block, context, slugify(block.section_slug) || "feature")}>
      <div className="workbench-copy">
        {eyebrow ? <p className="eyebrow dark">{eyebrow}</p> : null}
        {title ? <h2>{title}</h2> : null}
        {description ? <p>{description}</p> : null}
        {items.length ? (
          <ul className="check-list">
            {items.map((item, index) => (
              <li key={`${itemText(item, ["title", "text"])}-${index}`}>
                <CheckCircle2 aria-hidden="true" size={19} />
                {itemText(item, ["text", "title", "description"])}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {image ? (
        <figure className="feature-media">
          <img src={image} alt={title} loading="lazy" />
        </figure>
      ) : (
        <div className="terminal-visual" aria-label="CMS system preview">
          <div className="terminal-bar">
            <span />
            <span />
            <span />
            <strong>cms-page.tsx</strong>
          </div>
          <div className="terminal-body">
            <p>
              <span>fetch</span> /settings + /navigation
            </p>
            <p>
              <span>render</span> page.headless_content.blocks
            </p>
            <p>
              <span>apply</span> design.tokens.toCSS()
            </p>
            <div className="terminal-preview">
              <Code2 aria-hidden="true" size={26} />
              <div>
                <strong>Structured content</strong>
                <small>Fast frontend. Branded CMS control.</small>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function ProcessSection({ block, context }: Props) {
  const title = fieldString(block, ["heading", "headline", "title"], context, block.section_name || "");
  const description = fieldString(block, ["description", "subtitle", "body", "text"], context);
  const eyebrow = fieldString(block, ["eyebrow", "kicker", "label"], context, block.section_name || "");
  const items = sectionItems(block, context);

  return (
    <section className="section process-section" id={sectionId(block, context, "process")}>
      <div className="section-heading">
        {eyebrow ? <p className="eyebrow dark">{eyebrow}</p> : null}
        {title ? <h2>{title}</h2> : null}
        {description ? <p>{description}</p> : null}
      </div>
      {items.length ? (
        <div className="process-grid">
          {items.map((item, index) => (
            <article className="process-card" key={`${itemText(item, ["title", "heading"])}-${index}`}>
              <span>{itemText(item, ["label"], String(index + 1).padStart(2, "0"))}</span>
              <h3>{itemText(item, ["title", "heading"])}</h3>
              <p>{itemText(item, ["text", "description", "body"])}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function ReviewsSection({ block, context }: Props) {
  const business = context.settings.business;
  const primaryLocation = business.locations?.[0];
  const rating = primaryLocation?.google_places?.rating;
  const totalReviews = primaryLocation?.google_places?.total_reviews;
  const title = fieldString(block, ["heading", "headline", "title"], context, block.section_name || "Reviews");
  const description = fieldString(block, ["description", "subtitle", "body", "text"], context);
  const eyebrow = fieldString(block, ["eyebrow", "kicker", "label"], context, "Reviews");
  const fieldReviews = sectionItems(block, context, ["items", "reviews", "testimonials"]);
  const reviews = fieldReviews.length
    ? fieldReviews.map((item, index) => ({
        id: `${itemText(item, ["author_name", "title"], "review")}-${index}`,
        author_name: itemText(item, ["author_name", "title", "label"], "Client"),
        rating: Number(item.rating) || 5,
        text: itemText(item, ["text", "description", "body"]),
        relative_time: itemText(item, ["relative_time", "date"]),
      }))
    : context.reviews;

  if (!reviews.length) return null;

  return (
    <section className="section reviews-section" id={sectionId(block, context, "reviews")}>
      <div className="section-heading compact">
        {eyebrow ? <p className="eyebrow dark">{eyebrow}</p> : null}
        {title ? <h2>{title}</h2> : null}
        {description ? <p>{description}</p> : null}
        {rating ? (
          <p>
            {rating.toFixed(1)} average rating
            {totalReviews ? ` from ${totalReviews} reviews` : ""}
          </p>
        ) : null}
      </div>
      <div className="review-grid">
        {reviews.slice(0, 6).map((review) => (
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
  );
}

function FaqSection({ block, context }: Props) {
  const title = fieldString(block, ["heading", "headline", "title"], context, block.section_name || "FAQs");
  const description = fieldString(block, ["description", "subtitle", "body", "text"], context);
  const eyebrow = fieldString(block, ["eyebrow", "kicker", "label"], context, "Questions");
  const fieldFaqs = sectionItems(block, context, ["items", "faqs", "questions"]);
  const faqs = fieldFaqs.length
    ? fieldFaqs.map((item, index) => ({
        id: `${itemText(item, ["question", "title"], "faq")}-${index}`,
        question: itemText(item, ["question", "title", "heading"]),
        answer: itemText(item, ["answer", "text", "description", "body"]),
      }))
    : context.faqs;

  if (!faqs.length) return null;

  return (
    <section className="section faq-section" id={sectionId(block, context, "faqs")}>
      <div className="section-heading compact">
        {eyebrow ? <p className="eyebrow dark">{eyebrow}</p> : null}
        {title ? <h2>{title}</h2> : null}
        {description ? <p>{description}</p> : null}
      </div>
      <div className="faq-list">
        {faqs.slice(0, 8).map((faq, index) => (
          <details key={faq.id} open={index === 0}>
            <summary>{faq.question}</summary>
            <p dangerouslySetInnerHTML={{ __html: faq.answer }} />
          </details>
        ))}
      </div>
    </section>
  );
}

function ContactSection({ block, context }: Props) {
  const business = context.settings.business;
  const title = fieldString(block, ["heading", "headline", "title"], context, block.section_name || "Contact");
  const description = fieldString(
    block,
    ["description", "subtitle", "body", "text"],
    context,
    business.short_description || context.settings.site.description || "",
  );
  const eyebrow = fieldString(block, ["eyebrow", "kicker", "label"], context, "Contact");
  const email = fieldString(block, ["email", "contact_email"], context, business.email || "");
  const phone = fieldString(block, ["phone", "contact_phone"], context, business.phone || "");
  const formId = fieldString(block, ["form_id", "formId", "contact_form_id"], context, context.formId || "");
  const submitButtonPreset = String(context.settings.design?.forms?.submitButtonPreset || "primary");
  const image = sectionImage(block, context);
  const style = image
    ? ({
        "--contact-bg-image": `url("${image}")`,
      } as CSSProperties)
    : undefined;

  return (
    <section className="contact-section" id={sectionId(block, context, "contact")} style={style}>
      <div className="contact-inner">
        <div className="contact-copy">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          {title ? <h2>{title}</h2> : null}
          {description ? <p>{description}</p> : null}
          <div className="contact-links">
            {email ? (
              <a href={`mailto:${email}`}>
                <Mail aria-hidden="true" size={18} />
                {email}
              </a>
            ) : null}
            {phone ? (
              <a href={`tel:${phone}`}>
                <Phone aria-hidden="true" size={18} />
                {phone}
              </a>
            ) : null}
          </div>
        </div>
        <ContactForm
          form={context.form}
          formId={formId}
          email={email}
          submitButtonPreset={submitButtonPreset}
        />
      </div>
    </section>
  );
}

function GenericSection({ block, context }: Props) {
  const title = fieldString(block, ["heading", "headline", "title"], context, block.section_name || "");
  const description = fieldString(block, ["description", "subtitle", "body", "text"], context, block.section_description || "");
  const eyebrow = fieldString(block, ["eyebrow", "kicker", "label"], context);
  const image = sectionImage(block, context);
  const items = sectionItems(block, context);

  return (
    <section className="section generic-section" id={sectionId(block, context, slugify(block.section_slug || block.section_name) || "content")}>
      <div className={image ? "generic-layout" : "section-heading"}>
        <div>
          {eyebrow ? <p className="eyebrow dark">{eyebrow}</p> : null}
          {title ? <h2>{title}</h2> : null}
          {description ? <p>{description}</p> : null}
        </div>
        {image ? (
          <figure className="feature-media">
            <img src={image} alt={title} loading="lazy" />
          </figure>
        ) : null}
      </div>
      {items.length ? (
        <div className="content-card-grid">
          {items.map((item, index) => {
            const itemTitle = itemText(item, ["title", "heading", "question", "label"]);
            const itemBody = itemText(item, ["text", "description", "body", "answer"]);
            return (
              <article className="content-card" key={`${itemTitle}-${index}`}>
                {itemTitle ? <h3>{itemTitle}</h3> : null}
                {itemBody ? <p>{itemBody}</p> : null}
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

function SectionRenderer({ block, context }: Props) {
  const slug = slugify(block.section_slug || block.section_name || "");
  const normalizedSlug = normalizeKey(slug);

  if (normalizedSlug.includes("hero")) return <HeroSection block={block} context={context} />;
  if (normalizedSlug.includes("trust") || normalizedSlug.includes("proof") || normalizedSlug.includes("stat")) {
    return <ProofBand block={block} context={context} />;
  }
  if (normalizedSlug.includes("service") || normalizedSlug.includes("solution")) {
    return <CardSection block={block} context={context} variant="services" />;
  }
  if (
    normalizedSlug.includes("feature") ||
    normalizedSlug.includes("architecture") ||
    normalizedSlug.includes("about") ||
    normalizedSlug.includes("intro")
  ) {
    return <FeatureSection block={block} context={context} />;
  }
  if (normalizedSlug.includes("process") || normalizedSlug.includes("step")) {
    return <ProcessSection block={block} context={context} />;
  }
  if (normalizedSlug.includes("review") || normalizedSlug.includes("testimonial")) {
    return <ReviewsSection block={block} context={context} />;
  }
  if (normalizedSlug.includes("faq") || normalizedSlug.includes("question")) {
    return <FaqSection block={block} context={context} />;
  }
  if (normalizedSlug.includes("contact") || normalizedSlug.includes("form")) {
    return <ContactSection block={block} context={context} />;
  }
  if (sectionItems(block, context).length) {
    return <CardSection block={block} context={context} variant="cards" />;
  }

  return <GenericSection block={block} context={context} />;
}

export function ContentBlock({ block, context }: Props) {
  switch (block.type) {
    case "heading": {
      const level = Math.min(6, Math.max(1, Number(block.level) || 2));
      const Tag = `h${level}` as ElementType;
      return <Tag className="cms-heading">{blockText(block)}</Tag>;
    }

    case "paragraph":
      return (
        <div
          className="cms-rich-text"
          dangerouslySetInnerHTML={{ __html: blockText(block) }}
        />
      );

    case "image": {
      const src = stringFrom(block.src || block.url);
      if (!src) return null;
      return (
        <figure className="cms-image">
          <img src={src} alt={block.alt || ""} loading="lazy" />
          {block.alt ? <figcaption>{block.alt}</figcaption> : null}
        </figure>
      );
    }

    case "video": {
      const src = stringFrom(block.src || block.url);
      if (!src) return null;
      if (/\.(mp4|webm|ogg)(\?|$)/i.test(src)) {
        return (
          <video className="cms-video" src={src} controls />
        );
      }
      return (
        <div className="cms-video">
          <iframe src={src} title={block.label || "Embedded video"} allowFullScreen />
        </div>
      );
    }

    case "button":
      return (
        <a className={`btn btn-${block.style || block.variant || "primary"}`} href={buttonHref(block)}>
          <span>{blockText(block) || "Learn more"}</span>
          <ArrowUpRight aria-hidden="true" size={18} />
        </a>
      );

    case "spacer":
      return <div aria-hidden="true" style={{ height: Number(block.height || block.size) || 32 }} />;

    case "columns": {
      const columns = Array.isArray(block.columns)
        ? block.columns
        : [block.left, block.right].filter(Boolean);

      return (
        <div className="cms-columns">
          {columns.map((column, index) => (
            <div className="cms-column" key={`${block.type}-${index}`}>
              {getBlocks(column).map((child, childIndex) => (
                <ContentBlock block={child} context={context} key={`${child.type}-${childIndex}`} />
              ))}
            </div>
          ))}
        </div>
      );
    }

    case "section":
      return <SectionRenderer block={block} context={context} />;

    default:
      return null;
  }
}
