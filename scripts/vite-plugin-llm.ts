import fs from "fs";
import path from "path";
import type { Plugin } from "vite";
import {
  STATIC_END,
  STATIC_START,
  blogJsonLd,
  blogSlugs,
  blogStaticHtml,
  homeStaticHtml,
  personJsonLd,
  textFiles,
} from "./llm-content";

/** Hand-off file read (and deleted) by scripts/generate-static.js */
export const BLOG_STATIC_MANIFEST = ".llm-blog-static.json";

const CONTENT_TYPES: Record<string, string> = {
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

/**
 * Makes the SPA readable without JavaScript:
 * - injects semantic static content + JSON-LD into index.html
 * - emits llms.txt, llms-full.txt, per-post Markdown, robots.txt, sitemap.xml
 * - serves the same files from the dev server
 */
export const llmFriendly = (): Plugin => {
  let outDir = "dist";

  return {
    name: "llm-friendly",

    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },

    transformIndexHtml: {
      order: "post",
      handler(html) {
        if (html.includes(STATIC_START)) return html;
        return html
          .replace(
            '<div id="root"></div>',
            `<div id="root">${homeStaticHtml()}</div>`,
          )
          .replace(
            "</head>",
            [
              `    <link rel="alternate" type="text/plain" href="/llms.txt" title="LLM-friendly summary (llms.txt)" />`,
              `    <link rel="alternate" type="text/markdown" href="/llms-full.txt" title="Full site content as Markdown" />`,
              `    <script type="application/ld+json">${personJsonLd()}</script>`,
              `  </head>`,
            ].join("\n"),
          );
      },
    },

    generateBundle() {
      for (const [fileName, source] of Object.entries(textFiles())) {
        this.emitFile({ type: "asset", fileName, source });
      }
    },

    closeBundle() {
      // Per-blog static article + BlogPosting JSON-LD for generate-static.js
      if (!fs.existsSync(outDir)) return;
      const manifest: Record<string, { html: string; jsonLd: string }> = {};
      for (const slug of blogSlugs()) {
        const html = blogStaticHtml(slug);
        const jsonLd = blogJsonLd(slug);
        if (html && jsonLd) manifest[slug] = { html, jsonLd };
      }
      fs.writeFileSync(
        path.join(outDir, BLOG_STATIC_MANIFEST),
        JSON.stringify({ start: STATIC_START, end: STATIC_END, manifest }),
      );
    },

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = (req.url ?? "").split("?")[0].replace(/^\//, "");
        const files = textFiles();
        const body = files[decodeURIComponent(pathname)];
        if (!body) return next();
        res.setHeader(
          "Content-Type",
          CONTENT_TYPES[path.extname(pathname)] ?? "text/plain; charset=utf-8",
        );
        res.end(body);
      });
    },
  };
};
