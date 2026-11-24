export interface Blog {
  slug: string;
  title: string;
  excerpt: string;
  content?: string;
  date: string;
  readTime: string;
  tags: string[];
  image?: string;
}

export const BLOGS: Blog[] = [
  {
    slug: "asha-saathi-voice-ai-architecture",
    title: "ASHA Saathi: Deterministic Voice AI Architecture for Healthcare",
    excerpt:
      "How ASHA Saathi pairs Agora's real-time voice pipeline with an MCP server and deterministic ICMR clinical rules so AI handles conversation while unit-tested TypeScript decides risk.",
    date: "2026-11-24",
    readTime: "3 min read",
    tags: ["Voice AI", "MCP", "Next.js", "Healthcare"],
  },
  {
    slug: "rhl-ai-agentic-tooling-monorepo",
    title: "RHL AI: Separating Agent Skills from Executable CLI Packages",
    excerpt:
      "Inside the RHL AI monorepo: keeping executable CLI and scaffolding packages cleanly separated from reusable agent skills and starter templates.",
    date: "2026-11-18",
    readTime: "3 min read",
    tags: ["AI Tooling", "Monorepo", "TypeScript", "CLI"],
  },
  {
    slug: "benefitlens-rag-document-intelligence",
    title: "BenefitLens: Citation-Grounded RAG for Benefits Documents",
    excerpt:
      "How BenefitLens transforms dense insurance policies and benefits documents into citation-grounded answers using LlamaParse, PostgreSQL, and OpenAI File Search.",
    date: "2026-06-30",
    readTime: "3 min read",
    tags: ["RAG", "Next.js", "LlamaParse", "OpenAI"],
  },
  {
    slug: "reducing-frontend-api-boilerplate-openapi-orval",
    title: "Reducing Frontend API Boilerplate with OpenAPI + Orval",
    excerpt:
      "Recently, while working across both backend and frontend stacks (NestJS, Next.js, and TypeScript), I explored OpenAPI and Orval more deeply. After using it on a real project, I realized how much repetitive work we still do manually—even with AI assistance.",
    date: "2026-06-03",
    readTime: "6 min read",
    tags: ["Frontend", "TypeScript", "API", "Automation"],
    image:
      "https://res.cloudinary.com/dw8r5ivmx/image/upload/v1780543059/orval-blog_gbj7ia.png",
  },
  {
    slug: "strangler-fig-pattern-system-evolution",
    title: "Evolving Systems with the Strangler Fig Pattern",
    excerpt:
      "A practical look at the Strangler Fig pattern and how it helps evolve legacy systems without risky full rewrites.",
    date: "2026-03-10",
    readTime: "5 min read",
    tags: ["Architecture", "System Design", "Backend"],
    image:
      "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&q=80",
  },
  {
    slug: "github-whatsapp-notifications",
    title: "Sending GitHub Notifications to WhatsApp with Webhooks",
    excerpt:
      "A simple way to receive GitHub PR and CI notifications directly on WhatsApp using webhooks and Twilio.",
    date: "2026-03-10",
    readTime: "4 min read",
    tags: ["Automation", "GitHub", "DevTools"],
    image:
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80",
  },
  {
    slug: "blocking-script-injection-with-csp",
    title: "Blocking Script Injection with Content Security Policy",
    excerpt:
      "A quick look at how Content Security Policy (CSP) prevents malicious scripts from executing in web apps.",
    date: "2026-03-10",
    readTime: "2 min read",
    tags: ["Security", "Next.js", "Web Security"],
    image:
      "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80",
  },
];
