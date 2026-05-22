import { Fragment } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { ArrowLeft, ArrowUpRight, CalendarDays, MapPin, Star, Tag } from "lucide-react";
import {
  feedEntryAuthor,
  feedEntryBodyHtml,
  feedEntryCategories,
  feedEntryDate,
  feedEntryDescription,
  feedEntryEndDate,
  feedEntryImage,
  feedEntryLocation,
  feedEntryStartDate,
  feedEntryTags,
  feedEntryTitle,
  moduleCalendarPath,
  moduleEntryPath,
  moduleListPath,
  slugifyContent,
  stripHtml,
  type CmsForm,
  type CmsModule,
  type Faq,
  type FeedEntry,
  type Review,
  type SiteSettings,
} from "../lib/squareflo";
import { ContactForm } from "./ContactForm";

export type ModuleKind = "services" | "blog" | "testimonials" | "faq" | "events" | "generic";

type ModulePageCopy = {
  eyebrow?: string;
  title: string;
  description?: string;
};

type ModuleFilters = {
  category?: string;
  tag?: string;
  search?: string;
};

type ModuleListProps = {
  module?: CmsModule;
  kind: ModuleKind;
  entries: FeedEntry[];
  faqs?: Faq[];
  reviews?: Review[];
  settings: SiteSettings;
  copy: ModulePageCopy;
  filters?: ModuleFilters;
  form?: CmsForm | null;
  formId?: string;
};

type ModuleDetailProps = {
  module: CmsModule;
  kind: ModuleKind;
  entry: FeedEntry;
  related: FeedEntry[];
  copy: ModulePageCopy;
  settings?: SiteSettings;
  form?: CmsForm | null;
  formId?: string;
};

type EventPageProps = {
  module?: CmsModule;
  entries: FeedEntry[];
  copy: ModulePageCopy;
  mode: "calendar" | "list";
};

function formatDate(value?: string) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function moduleSlug(module: CmsModule | undefined, kind: ModuleKind) {
  if (module?.slug) return module.slug;
  if (kind === "blog") return "blog";
  if (kind === "generic") return "content";
  return kind;
}

function taxonomyHref(module: CmsModule | undefined, kind: ModuleKind, type: "category" | "tag", label: string) {
  return `${moduleListPath(moduleSlug(module, kind))}/${type}/${slugifyContent(label)}`;
}

function entryTaxonomy(entry: FeedEntry) {
  const tags = feedEntryTags(entry);
  const categories = feedEntryCategories(entry);
  return tags.length
    ? tags.map((label) => ({ label, type: "tag" as const }))
    : categories.map((label) => ({ label, type: "category" as const }));
}

function entrySummary(entry: FeedEntry) {
  return feedEntryDescription(entry) || stripHtml(feedEntryBodyHtml(entry)).slice(0, 220);
}

function entryRating(entry: FeedEntry) {
  const raw = entry.data?.rating;
  const rating = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(rating) && rating > 0 ? Math.min(5, Math.max(1, rating)) : 0;
}

function PageHero({ copy, kind }: { copy: ModulePageCopy; kind?: ModuleKind }) {
  return (
    <section className={`module-hero ${kind ? `module-hero-${kind}` : ""}`}>
      <div>
        {copy.eyebrow ? <p className="eyebrow dark">{copy.eyebrow}</p> : null}
        <h1>{copy.title}</h1>
        {copy.description ? <p>{copy.description}</p> : null}
      </div>
    </section>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="module-empty">
      <h2>No {label.toLowerCase()} published yet</h2>
      <p>Once entries are created in Squareflo, this page will populate automatically.</p>
    </div>
  );
}

function TaxonomyLinks({
  entry,
  module,
  kind,
}: {
  entry: FeedEntry;
  module?: CmsModule;
  kind: ModuleKind;
}) {
  const items = entryTaxonomy(entry);
  if (!items.length) return null;

  return (
    <span className={kind === "services" ? "entry-taxonomy entry-taxonomy-services" : "entry-taxonomy"}>
      <Tag aria-hidden="true" size={13} />
      <span className="entry-taxonomy-links">
        {items.map((item, index) => (
          <Fragment key={`${item.type}-${item.label}`}>
            {index > 0 ? <span className="entry-taxonomy-separator">/</span> : null}
            <a href={taxonomyHref(module, kind, item.type, item.label)} rel={item.type === "tag" ? "tag" : undefined}>
              {item.label}
            </a>
          </Fragment>
        ))}
      </span>
    </span>
  );
}

function ServiceTaxonomyPanel({
  entry,
  module,
}: {
  entry: FeedEntry;
  module?: CmsModule;
}) {
  const categories = feedEntryCategories(entry);
  const tags = feedEntryTags(entry);

  if (!categories.length && !tags.length) return null;

  return (
    <div className="service-taxonomy-panel" aria-label="Service taxonomy">
      <h4>Categories</h4>
      {categories.length ? (
        <div className="service-taxonomy-list">
          {categories.map((category) => (
            <a href={taxonomyHref(module, "services", "category", category)} key={category}>
              {category}
            </a>
          ))}
        </div>
      ) : (
        <p>No categories set</p>
      )}

      {tags.length ? (
        <>
          <h4>Tags</h4>
          <div className="service-tag-cloud">
            {tags.map((tag) => (
              <a href={taxonomyHref(module, "services", "tag", tag)} key={tag} rel="tag">
                {tag}
              </a>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function EntryMeta({ entry, module, kind }: { entry: FeedEntry; module?: CmsModule; kind: ModuleKind }) {
  const date = formatDate(feedEntryDate(entry));
  const location = feedEntryLocation(entry);
  const author = feedEntryAuthor(entry);

  return (
    <div className="entry-meta">
      {date ? (
        <span>
          <CalendarDays aria-hidden="true" size={16} />
          {date}
        </span>
      ) : null}
      {kind === "events" && location ? (
        <span>
          <MapPin aria-hidden="true" size={16} />
          {location}
        </span>
      ) : null}
      {kind === "blog" && author ? <span>{author}</span> : null}
      <TaxonomyLinks entry={entry} module={module} kind={kind} />
    </div>
  );
}

function Rating({ value }: { value: number }) {
  if (!value) return null;
  return (
    <div className="stars" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={16}
          aria-hidden="true"
          fill={index < Math.round(value) ? "currentColor" : "none"}
        />
      ))}
    </div>
  );
}

function EntryCard({
  entry,
  module,
  kind,
}: {
  entry: FeedEntry;
  module?: CmsModule;
  kind: ModuleKind;
}) {
  const slug = moduleSlug(module, kind);
  const title = kind === "faq" ? entry.data?.question?.toString() || feedEntryTitle(entry) : feedEntryTitle(entry);
  const image = feedEntryImage(entry);
  const summary = entrySummary(entry);
  const href = moduleEntryPath(slug, entry.slug);

  return (
    <article className={`module-card module-card-${kind}`}>
      {image ? <img className="card-image" src={image} alt={title} loading="lazy" /> : null}
      <div className="module-card-body">
        <EntryMeta entry={entry} module={module} kind={kind} />
        <Rating value={entryRating(entry)} />
        <h2>{title}</h2>
        {summary ? <p>{summary}</p> : null}
        <a className="card-link" href={href}>
          <span>{kind === "faq" ? "Read answer" : "View details"}</span>
          <ArrowUpRight aria-hidden="true" size={17} />
        </a>
      </div>
    </article>
  );
}

function FaqApiList({ faqs }: { faqs: Faq[] }) {
  if (!faqs.length) return <EmptyState label="FAQs" />;

  return (
    <div className="faq-list module-faq-list">
      {faqs.map((faq, index) => (
        <details key={faq.id} open={index === 0}>
          <summary>{faq.question}</summary>
          <p dangerouslySetInnerHTML={{ __html: faq.answer }} />
        </details>
      ))}
    </div>
  );
}

function ReviewsApiList({ reviews }: { reviews: Review[] }) {
  if (!reviews.length) return <EmptyState label="testimonials" />;

  return (
    <div className="review-grid module-review-grid">
      {reviews.map((review) => (
        <article className="review-card" key={review.id}>
          <Rating value={review.rating} />
          <p>{review.text}</p>
          <footer>
            <strong>{review.author_name}</strong>
            {review.relative_time ? <span>{review.relative_time}</span> : null}
          </footer>
        </article>
      ))}
    </div>
  );
}

function ServiceListRow({
  entry,
  module,
}: {
  entry: FeedEntry;
  module?: CmsModule;
}) {
  const slug = moduleSlug(module, "services");
  const title = feedEntryTitle(entry);
  const image = feedEntryImage(entry);
  const summary = entrySummary(entry);
  const href = moduleEntryPath(slug, entry.slug);

  return (
    <article className="service-list-row">
      {image ? (
        <a href={href} className="service-list-row-image">
          <img src={image} alt={title} loading="lazy" />
        </a>
      ) : null}
      <div className="service-list-row-body">
        <div className="service-list-row-meta">
          <Rating value={entryRating(entry)} />
        </div>
        <h3>
          <a href={href}>{title}</a>
        </h3>
        <TaxonomyLinks entry={entry} module={module} kind="services" />
        {summary ? <p>{summary}</p> : null}
        <a className="service-list-row-link" href={href}>
          <span>View details</span>
          <ArrowUpRight aria-hidden="true" size={16} />
        </a>
      </div>
    </article>
  );
}

export function ModuleListPage({
  module,
  kind,
  entries,
  faqs = [],
  reviews = [],
  copy,
  settings,
  filters,
  form,
  formId,
}: ModuleListProps) {
  const label = module?.name || copy.title;
  const useFaqApi = kind === "faq" && !module;
  const useReviewsApi = kind === "testimonials" && !module;
  const activeFilter = filters?.tag || filters?.category || filters?.search || "";
  const activeFilterType = filters?.tag ? "tagged" : filters?.category ? "in" : filters?.search ? "matching" : "";
  const activeFilterLabel = activeFilter.replace(/-/g, " ");
  const clearFilterHref = moduleListPath(moduleSlug(module, kind));

  const business = settings?.business;

  return (
    <div className="page-blocks">
      <PageHero copy={copy} kind={kind} />
      <section className="section module-list-section">
        {activeFilter ? (
          <div className="module-filter-status">
            <span>
              Showing {label.toLowerCase()} {activeFilterType} <strong>{activeFilterLabel}</strong>
            </span>
            <a href={clearFilterHref}>Clear filter</a>
          </div>
        ) : null}
        {useFaqApi ? (
          <FaqApiList faqs={faqs} />
        ) : useReviewsApi ? (
          <ReviewsApiList reviews={reviews} />
        ) : kind === "services" && entries.length ? (
          <div className="module-detail-layout">
            <div className="module-detail-main">
              <div className="service-list-container">
                {entries.map((entry) => (
                  <ServiceListRow entry={entry} module={module} key={entry.id} />
                ))}
              </div>
            </div>
            
            {business ? (
              <aside className="module-detail-sidebar">
                <div className="sidebar-cta-card sidebar-form-card">
                  <h3>Interested in our Services?</h3>
                  <p>Tell us what you need and we will point you to the right service.</p>
                  
                  <ContactForm
                    compact
                    form={form || null}
                    formId={formId}
                    submitButtonPreset={settings?.design?.forms?.submitButtonPreset?.toString()}
                    extraData={{
                      inquiry_context: "services_listing",
                      services_url:
                        typeof window !== "undefined" ? window.location.href : moduleListPath(moduleSlug(module, "services")),
                    }}
                  />
                </div>
              </aside>
            ) : null}
          </div>
        ) : entries.length ? (
          <div className="module-grid">
            {entries.map((entry) => (
              <EntryCard entry={entry} module={module} kind={kind} key={entry.id} />
            ))}
          </div>
        ) : (
          <EmptyState label={label} />
        )}
      </section>
    </div>
  );
}

export function ModuleDetailPage({ module, kind, entry, related, copy, settings, form, formId }: ModuleDetailProps) {
  const slug = moduleSlug(module, kind);
  const title = kind === "faq" ? entry.data?.question?.toString() || feedEntryTitle(entry) : feedEntryTitle(entry);
  const image = feedEntryImage(entry);
  const body = feedEntryBodyHtml(entry);
  const summary = entrySummary(entry);

  const business = settings?.business;

  return (
    <div className="page-blocks">
      <article className={`module-detail module-detail-${kind}`}>
        <a className="module-back-link" href={moduleListPath(slug)}>
          <ArrowLeft aria-hidden="true" size={17} />
          Back to {copy.title}
        </a>
        
        <div className="module-detail-layout">
          <div className="module-detail-main">
            <header>
              <EntryMeta entry={entry} module={module} kind={kind} />
              <Rating value={entryRating(entry)} />
              <h1>{title}</h1>
              {summary ? <p className="detail-summary">{summary}</p> : null}
            </header>
            {image ? (
              <figure className="module-detail-media">
                <img src={image} alt={title} />
              </figure>
            ) : null}
            {body ? (
              <div className="cms-rich-text module-detail-body" dangerouslySetInnerHTML={{ __html: body }} />
            ) : null}
          </div>

          {kind === "services" && business ? (
            <aside className="module-detail-sidebar">
              <div className="sidebar-cta-card sidebar-form-card">
                <h3>Interested in this Service?</h3>
                <ServiceTaxonomyPanel entry={entry} module={module} />
                <p>Send a quick note and we will follow up with details for {title}.</p>
                <ContactForm
                  compact
                  form={form || null}
                  formId={formId}
                  submitButtonPreset={settings?.design?.forms?.submitButtonPreset?.toString()}
                  extraData={{
                    service_title: title,
                    service_slug: entry.slug,
                    service_url: typeof window !== "undefined" ? window.location.href : moduleEntryPath(slug, entry.slug),
                  }}
                />
              </div>

              {related.filter((candidate) => candidate.id !== entry.id).length ? (
                <div className="sidebar-related-card">
                  <h4>More Services</h4>
                  <div className="sidebar-related-list">
                    {related
                      .filter((candidate) => candidate.id !== entry.id)
                      .slice(0, 3)
                      .map((candidate) => {
                        const itemTitle = feedEntryTitle(candidate);
                        const itemImage = feedEntryImage(candidate);
                        const itemHref = moduleEntryPath(slug, candidate.slug);
                        return (
                          <a href={itemHref} className="sidebar-related-item" key={candidate.id}>
                            {itemImage ? <img src={itemImage} alt={itemTitle} /> : null}
                            <div className="sidebar-related-item-text">
                              <strong>{itemTitle}</strong>
                              <span>Learn more &rarr;</span>
                            </div>
                          </a>
                        );
                      })}
                  </div>
                </div>
              ) : null}
            </aside>
          ) : null}
        </div>
      </article>

      {related.length && kind !== "services" ? (
        <section className="section related-section">
          <div className="section-heading compact">
            <p className="eyebrow dark">More</p>
            <h2>{kind === "events" ? "Upcoming events" : `More ${copy.title.toLowerCase()}`}</h2>
          </div>
          <div className="module-grid compact">
            {related
              .filter((candidate) => candidate.id !== entry.id)
              .slice(0, 3)
              .map((candidate) => (
                <EntryCard entry={candidate} module={module} kind={kind} key={candidate.id} />
              ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function EventList({ entries, module }: { entries: FeedEntry[]; module?: CmsModule }) {
  if (!entries.length) return <EmptyState label="events" />;

  return (
    <div className="event-list">
      {entries.map((entry) => {
        const title = feedEntryTitle(entry);
        const date = formatDate(feedEntryStartDate(entry));
        const location = feedEntryLocation(entry);
        const summary = entrySummary(entry);
        const href = moduleEntryPath(moduleSlug(module, "events"), entry.slug);

        return (
          <article className="event-row" key={entry.id}>
            <time>{date || "Date TBA"}</time>
            <div>
              <h2>{title}</h2>
              {location ? (
                <p className="event-location">
                  <MapPin aria-hidden="true" size={16} />
                  {location}
                </p>
              ) : null}
              {summary ? <p>{summary}</p> : null}
            </div>
            <a className="card-link" href={href}>
              <span>Details</span>
              <ArrowUpRight aria-hidden="true" size={17} />
            </a>
          </article>
        );
      })}
    </div>
  );
}

export function EventCalendarPage({ module, entries, copy, mode }: EventPageProps) {
  const slug = moduleSlug(module, "events");
  const events = entries.map((entry) => ({
    id: entry.id,
    title: feedEntryTitle(entry),
    start: feedEntryStartDate(entry),
    end: feedEntryEndDate(entry) || undefined,
    url: moduleEntryPath(slug, entry.slug),
  }));

  return (
    <div className="page-blocks">
      <PageHero copy={copy} kind="events" />
      <section className="section event-calendar-section">
        <div className="event-view-switch">
          <a className={mode === "calendar" ? "active" : ""} href={moduleCalendarPath(slug)}>
            Calendar
          </a>
          <a className={mode === "list" ? "active" : ""} href={moduleListPath(slug)}>
            List
          </a>
        </div>
        {mode === "calendar" ? (
          <div className="calendar-shell">
            <FullCalendar
              plugins={[dayGridPlugin, listPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,listMonth",
              }}
              events={events}
              height="auto"
            />
          </div>
        ) : (
          <EventList entries={entries} module={module} />
        )}
      </section>
    </div>
  );
}
