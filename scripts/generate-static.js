import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.resolve(__dirname, "../dist");
const BLOGS_FILE = path.resolve(__dirname, "../data/blogs.ts");
const INDEX_HTML = path.resolve(DIST_DIR, "index.html");

// More robust extraction that handles field order
function extractBlogs(content) {
  const blogs = [];
  // Match individual blog objects in the BLOGS array
  const objRegex = /\{\s*slug:[\s\S]*?\}\s*(?=,|\])/g;
  const matches = content.match(objRegex);

  if (matches) {
    for (const obj of matches) {
      const slug = obj.match(/slug:\s*["'](.+?)["']/)?.[1];
      const title = obj.match(/title:\s*["'](.+?)["']/)?.[1];
      const excerpt = obj.match(/excerpt:\s*["']([\s\S]+?)["']/)?.[1];
      const image = obj.match(/image:\s*["'](.+?)["']/)?.[1];

      if (slug && title) {
        blogs.push({
          slug,
          title,
          excerpt: excerpt ? excerpt.replace(/\n/g, " ").trim() : "",
          image: image
            ? image.startsWith("/")
              ? `https://imrahul.me${image}`
              : image
            : "https://imrahul.me/og-card.png",
        });
      }
    }
  }
  return blogs;
}

async function generate() {
  if (!fs.existsSync(INDEX_HTML)) {
    console.error("dist/index.html not found. Run npm run build first.");
    return;
  }

  const template = fs.readFileSync(INDEX_HTML, "utf-8");

  // Static article + JSON-LD per post, produced by scripts/vite-plugin-llm.ts
  const manifestPath = path.resolve(DIST_DIR, ".llm-blog-static.json");
  const llm = fs.existsSync(manifestPath)
    ? JSON.parse(fs.readFileSync(manifestPath, "utf-8"))
    : null;
  const blogsContent = fs.readFileSync(BLOGS_FILE, "utf-8");
  const blogs = extractBlogs(blogsContent);

  console.log(`Generating static pages for ${blogs.length} blogs...`);

  for (const blog of blogs) {
    const blogDir = path.resolve(DIST_DIR, "blogs", blog.slug);
    if (!fs.existsSync(blogDir)) {
      fs.mkdirSync(blogDir, { recursive: true });
    }

    let html = template;

    // Update title
    html = html.replace(
      /<title>(.*?)<\/title>/,
      `<title>${blog.title} | Rahul Kumar</title>`,
    );

    // Update Meta Tags
    const replacements = [
      { name: 'meta[name="title"]', attr: "content", value: blog.title },
      {
        name: 'meta[name="description"]',
        attr: "content",
        value: blog.excerpt,
      },
      { name: 'meta[property="og:title"]', attr: "content", value: blog.title },
      {
        name: 'meta[property="og:description"]',
        attr: "content",
        value: blog.excerpt,
      },
      { name: 'meta[property="og:image"]', attr: "content", value: blog.image },
      {
        name: 'meta[property="og:url"]',
        attr: "content",
        value: `https://imrahul.me/blogs/${blog.slug}`,
      },
      {
        name: 'meta[property="twitter:title"]',
        attr: "content",
        value: blog.title,
      },
      {
        name: 'meta[name="twitter:title"]',
        attr: "content",
        value: blog.title,
      },
      {
        name: 'meta[property="twitter:description"]',
        attr: "content",
        value: blog.excerpt,
      },
      {
        name: 'meta[name="twitter:description"]',
        attr: "content",
        value: blog.excerpt,
      },
      {
        name: 'meta[property="twitter:image"]',
        attr: "content",
        value: blog.image,
      },
      {
        name: 'meta[name="twitter:image"]',
        attr: "content",
        value: blog.image,
      },
    ];

    for (const r of replacements) {
      const regex = new RegExp(
        `(<${r.name.includes("[") ? r.name.split("[")[0] : r.name}[^>]*?${r.name.includes("[") ? r.name.split("[")[1].replace("]", "") : ""}[^>]*?${r.attr}=")(.*?)(")`,
        "i",
      );
      if (html.match(regex)) {
        html = html.replace(regex, `$1${r.value}$3`);
      } else {
        // Fallback for tags that might not exist in template but we want to add
        // (though in this case they should exist based on index.html)
      }
    }

    // Swap the home page's static content for this post's article so
    // LLMs / no-JS crawlers get the real text of the blog post.
    const llmEntry = llm?.manifest?.[blog.slug];
    if (llmEntry) {
      const startIdx = html.indexOf(llm.start);
      const endIdx = html.indexOf(llm.end);
      if (startIdx !== -1 && endIdx > startIdx) {
        html =
          html.slice(0, startIdx) +
          llmEntry.html +
          html.slice(endIdx + llm.end.length);
      }
      html = html.replace(
        /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
        `<script type="application/ld+json">${llmEntry.jsonLd}</script>`,
      );
      html = html.replace(
        'href="/llms-full.txt"',
        `href="/blogs/${blog.slug}.md"`,
      );
    }

    fs.writeFileSync(path.resolve(blogDir, "index.html"), html);
    console.log(`  - Generated: blogs/${blog.slug}/index.html`);
  }

  if (llm) fs.rmSync(manifestPath, { force: true });

  console.log("Static page generation complete.");
}

generate();
