/**
 * Machine-readable views of the portfolio, generated from the same data the
 * UI renders (data/*.ts), so they can never drift out of sync.
 *
 *  - llms.txt        → https://llmstxt.org index (short, link-rich)
 *  - llms-full.txt   → everything, including full blog posts, as Markdown
 *  - blogs/<slug>.md → one Markdown file per post
 *  - static HTML     → semantic content injected into index.html so crawlers
 *                      and LLM fetchers that don't run JavaScript still see it
 *  - JSON-LD Person, robots.txt, sitemap.xml
 */
import { DATA } from "../data/data";
import { BLOGS } from "../data/blogs";
import { BLOG_CONTENTS } from "../data/blog-contents";
import { BLOG_VIDEOS } from "../data/media";

export const SITE_URL = "https://imrahul.me";

const url = (handle: string) =>
  handle.startsWith("http") ? handle : `https://${handle}`;

const abs = (src?: string) =>
  !src ? "" : src.startsWith("http") ? src : `${SITE_URL}${src}`;

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const sortedBlogs = () =>
  [...BLOGS].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

const { personal } = DATA;

const contactLines = () => [
  `- Email: ${personal.email}`,
  `- GitHub: ${url(personal.github)}`,
  `- LinkedIn: ${url(personal.linkedin)}`,
  `- X: ${url(personal.X)}`,
  `- Resume: ${personal.resume}`,
];

/* ----------------------------- Markdown ---------------------------------- */

/**
 * Embeds have no text form — describe them: ```iso:name``` animations get a
 * note, ```video:name``` fences become a direct link to the MP4.
 */
const describeEmbeds = (md: string) =>
  md
    .replace(
      /```iso:[\w-]+\s*```/g,
      `_[Interactive isometric animation — view it at ${SITE_URL}]_`,
    )
    .replace(/```video:([\w-]+)\s*```/g, (_, name: string) => {
      const v = BLOG_VIDEOS[name];
      if (!v) return "";
      return `_[Video: ${v.title} (${Math.floor(v.durationSeconds)} s) — ${v.src}]_`;
    });

export const blogMarkdown = (slug: string): string | null => {
  const blog = BLOGS.find((b) => b.slug === slug);
  if (!blog) return null;
  const body = describeEmbeds(
    (BLOG_CONTENTS[slug] ?? blog.content ?? "").trim(),
  );
  return [
    `# ${blog.title}`,
    "",
    `> ${blog.excerpt}`,
    "",
    `- Author: ${personal.name}`,
    `- Published: ${blog.date}`,
    `- Reading time: ${blog.readTime}`,
    `- Tags: ${blog.tags.join(", ")}`,
    `- URL: ${SITE_URL}/blogs/${blog.slug}`,
    "",
    body,
    "",
  ].join("\n");
};

const profileMarkdown = (): string => {
  const lines: string[] = [];
  lines.push(`## About`, "", personal.bio, "");
  lines.push(
    `- Role: ${personal.title}`,
    `- Location: ${personal.location}`,
    `- Currently building: [${personal.currentlyBuilding.name}](${personal.currentlyBuilding.url})`,
    "",
  );
  lines.push(`## Skills`, "", DATA.skills.join(", "), "");

  lines.push(`## Experience`, "");
  for (const e of DATA.experience) {
    lines.push(`### ${e.role} — ${e.company}`, "", `*${e.period}*`, "");
    lines.push(e.description, "");
  }

  lines.push(`## Education`, "");
  for (const e of DATA.education) {
    lines.push(`### ${e.degree} — ${e.institution}`, "", `*${e.period}*`, "");
    lines.push(e.description, "");
    if (e.tags?.length) lines.push(`Topics: ${e.tags.join(", ")}`, "");
  }

  lines.push(`## Projects`, "");
  for (const p of DATA.projects) {
    lines.push(`### ${p.name}${p.featured ? " (featured)" : ""}`, "");
    const meta = [p.period, p.tag].filter(Boolean).join(" · ");
    if (meta) lines.push(`*${meta}*`, "");
    lines.push(p.description, "");
    lines.push(`- Tech: ${p.tech.join(", ")}`);
    if (p.link) lines.push(`- Live: ${p.link}`);
    if (p.sourceUrl) lines.push(`- Source: ${p.sourceUrl}`);
    if (p.video) lines.push(`- Video: ${p.video}`);
    if (p.blogSlug) lines.push(`- Write-up: ${SITE_URL}/blogs/${p.blogSlug}`);
    lines.push("");
  }

  lines.push(`## Contact`, "", ...contactLines(), "");
  return lines.join("\n");
};

export const llmsTxt = (): string =>
  [
    `# ${personal.name}`,
    "",
    `> ${personal.title} based in ${personal.location}. ${personal.bio}`,
    "",
    "This site is a single-page app; the files below are plain-text / Markdown",
    "versions of all of its content for LLMs and other tools.",
    "",
    "## Core",
    "",
    `- [Full profile and all blog posts](${SITE_URL}/llms-full.txt): experience, education, skills, projects, contact, and every article in Markdown`,
    `- [Home](${SITE_URL}/): portfolio landing page`,
    `- [Projects](${SITE_URL}/projects): all ${DATA.projects.length} projects`,
    `- [Blogs](${SITE_URL}/blogs): architecture write-ups`,
    "",
    "## Blog posts",
    "",
    ...sortedBlogs().map(
      (b) => `- [${b.title}](${SITE_URL}/blogs/${b.slug}.md): ${b.excerpt}`,
    ),
    "",
    "## Featured projects",
    "",
    ...DATA.projects
      .filter((p) => p.featured)
      .map(
        (p) =>
          `- [${p.name}](${p.link || p.sourceUrl || SITE_URL}): ${p.description}`,
      ),
    "",
    "## Optional",
    "",
    ...contactLines(),
    "",
  ].join("\n");

/** Push every Markdown heading down `by` levels, leaving code fences alone. */
const demoteHeadings = (md: string, by: number): string => {
  let inFence = false;
  return md
    .split("\n")
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
      if (inFence) return line;
      const m = line.match(/^(#{1,6}) (.*)$/);
      return m ? `${"#".repeat(Math.min(6, m[1].length + by))} ${m[2]}` : line;
    })
    .join("\n");
};

export const llmsFullTxt = (): string =>
  [
    `# ${personal.name} — ${personal.title}`,
    "",
    `> Source: ${SITE_URL} · Generated from the site's own data at build time.`,
    "",
    profileMarkdown(),
    `## Blog posts`,
    "",
    ...sortedBlogs().map((b) => demoteHeadings(blogMarkdown(b.slug) ?? "", 2)),
  ].join("\n");

/* ---------------------------- Static HTML -------------------------------- */

/**
 * Visually hidden (but not `display:none`, which many extractors drop).
 * React's createRoot() replaces it on mount, so users never see it.
 */
const HIDDEN_STYLE =
  "position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:normal;border:0";

export const STATIC_START = "<!--llm-static:start-->";
export const STATIC_END = "<!--llm-static:end-->";

const wrap = (inner: string) =>
  `${STATIC_START}<main id="llm-static" style="${HIDDEN_STYLE}">${inner}</main>${STATIC_END}`;

export const homeStaticHtml = (): string => {
  const h: string[] = [];
  h.push(
    `<header><h1>${escapeHtml(personal.name)}</h1><p>${escapeHtml(personal.title)} · ${escapeHtml(personal.location)}</p><p>${escapeHtml(personal.bio)}</p>`,
    `<p>Currently building <a href="${personal.currentlyBuilding.url}">${escapeHtml(personal.currentlyBuilding.name)}</a>.</p></header>`,
  );
  h.push(
    `<section><h2>Skills</h2><ul>${DATA.skills.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul></section>`,
  );
  h.push(
    `<section><h2>Experience</h2>${DATA.experience
      .map(
        (e) =>
          `<article><h3>${escapeHtml(e.role)} — ${escapeHtml(e.company)}</h3><p><time>${escapeHtml(e.period)}</time></p><p>${escapeHtml(e.description)}</p></article>`,
      )
      .join("")}</section>`,
  );
  h.push(
    `<section><h2>Education</h2>${DATA.education
      .map(
        (e) =>
          `<article><h3>${escapeHtml(e.degree)} — ${escapeHtml(e.institution)}</h3><p><time>${escapeHtml(e.period)}</time></p><p>${escapeHtml(e.description)}</p></article>`,
      )
      .join("")}</section>`,
  );
  h.push(
    `<section><h2>Projects</h2>${DATA.projects
      .map((p) => {
        const links = [
          p.link && `<a href="${p.link}">Live</a>`,
          p.sourceUrl && `<a href="${p.sourceUrl}">Source</a>`,
          p.blogSlug && `<a href="/blogs/${p.blogSlug}">Write-up</a>`,
        ]
          .filter(Boolean)
          .join(" · ");
        return `<article><h3>${escapeHtml(p.name)}</h3>${p.period ? `<p><time>${escapeHtml(p.period)}</time></p>` : ""}<p>${escapeHtml(p.description)}</p><p>Tech: ${escapeHtml(p.tech.join(", "))}</p>${links ? `<p>${links}</p>` : ""}</article>`;
      })
      .join("")}</section>`,
  );
  h.push(
    `<section><h2>Blog posts</h2><ul>${sortedBlogs()
      .map(
        (b) =>
          `<li><a href="/blogs/${b.slug}">${escapeHtml(b.title)}</a> (<time datetime="${b.date}">${b.date}</time>) — ${escapeHtml(b.excerpt)}</li>`,
      )
      .join("")}</ul></section>`,
  );
  h.push(
    `<footer><h2>Contact</h2><ul><li><a href="mailto:${personal.email}">${personal.email}</a></li><li><a href="${url(personal.github)}">GitHub</a></li><li><a href="${url(personal.linkedin)}">LinkedIn</a></li><li><a href="${url(personal.X)}">X</a></li><li><a href="${personal.resume}">Resume</a></li></ul><p>Machine-readable versions: <a href="/llms.txt">llms.txt</a> · <a href="/llms-full.txt">llms-full.txt</a></p></footer>`,
  );
  return wrap(h.join(""));
};

/** Static article for a blog page; Markdown is kept as-is (LLMs read it natively). */
export const blogStaticHtml = (slug: string): string | null => {
  const blog = BLOGS.find((b) => b.slug === slug);
  const md = blogMarkdown(slug);
  if (!blog || !md) return null;
  return wrap(
    `<article><h1>${escapeHtml(blog.title)}</h1><p>By ${escapeHtml(personal.name)} · <time datetime="${blog.date}">${blog.date}</time> · ${escapeHtml(blog.readTime)}</p><p>${escapeHtml(blog.excerpt)}</p><pre style="white-space:pre-wrap">${escapeHtml(describeEmbeds((BLOG_CONTENTS[slug] ?? blog.content ?? "").trim()))}</pre><p>Markdown: <a href="/blogs/${slug}.md">/blogs/${slug}.md</a></p></article>`,
  );
};

export const personJsonLd = (): string =>
  JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Person",
    name: personal.name,
    jobTitle: personal.title,
    description: personal.bio,
    url: SITE_URL,
    image: abs(personal.image),
    email: `mailto:${personal.email}`,
    address: { "@type": "PostalAddress", addressLocality: personal.location },
    worksFor: { "@type": "Organization", name: DATA.experience[0]?.company },
    alumniOf: DATA.education.map((e) => ({
      "@type": "CollegeOrUniversity",
      name: e.institution,
    })),
    knowsAbout: DATA.skills,
    sameAs: [url(personal.github), url(personal.linkedin), url(personal.X)],
  }).replace(/</g, "\\u003c");

export const blogJsonLd = (slug: string): string | null => {
  const blog = BLOGS.find((b) => b.slug === slug);
  if (!blog) return null;
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.title,
    description: blog.excerpt,
    datePublished: blog.date,
    keywords: blog.tags.join(", "),
    url: `${SITE_URL}/blogs/${blog.slug}`,
    image: abs(blog.image) || `${SITE_URL}/og-card.png`,
    author: { "@type": "Person", name: personal.name, url: SITE_URL },
  }).replace(/</g, "\\u003c");
};

export const blogSlugs = () => BLOGS.map((b) => b.slug);

/* --------------------------- robots / sitemap ---------------------------- */

export const robotsTxt = (): string =>
  [
    "User-agent: *",
    "Allow: /",
    "",
    "# LLM-friendly content: /llms.txt and /llms-full.txt",
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    "",
  ].join("\n");

export const sitemapXml = (): string => {
  const today = new Date().toISOString().slice(0, 10);
  const entries = [
    { loc: `${SITE_URL}/`, lastmod: today },
    { loc: `${SITE_URL}/projects`, lastmod: today },
    { loc: `${SITE_URL}/blogs`, lastmod: today },
    ...sortedBlogs().map((b) => ({
      loc: `${SITE_URL}/blogs/${b.slug}`,
      lastmod: b.date,
    })),
  ];
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...entries.map(
      (e) => `  <url><loc>${e.loc}</loc><lastmod>${e.lastmod}</lastmod></url>`,
    ),
    `</urlset>`,
    "",
  ].join("\n");
};

/** All generated text files, keyed by their public path. */
export const textFiles = (): Record<string, string> => {
  const files: Record<string, string> = {
    "llms.txt": llmsTxt(),
    "llms-full.txt": llmsFullTxt(),
    "robots.txt": robotsTxt(),
    "sitemap.xml": sitemapXml(),
  };
  for (const slug of blogSlugs()) {
    const md = blogMarkdown(slug);
    if (md) files[`blogs/${slug}.md`] = md;
  }
  return files;
};
