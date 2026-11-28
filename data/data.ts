import { SHORTLIST_LAUNCH_VIDEO } from "./media";

export interface ProjectData {
  name: string;
  period?: string;
  description: string;
  tech: string[];
  link?: string;
  sourceUrl?: string;
  blogSlug?: string;
  image?: string;
  video?: string;
  /** Poster frame for `video` */
  videoPoster?: string;
  /** Accessible description of `video` */
  videoLabel?: string;
  /** Width / height of `video` (defaults to 16:9) */
  videoAspect?: number;
  /** Desktop only: play a muted inline preview of `video` on hover */
  videoHoverPreview?: boolean;
  tag?: string;
  featured?: boolean;
  previewCommand?: string;
  previewTagline?: string;
}

export const DATA = {
  personal: {
    name: "Rahul Kumar",
    title: "Software Engineer",
    location: "Bangalore, Bharat",
    bio: "Software Engineer at Nuvi Technology | SIH 2023 Winner | Building an AI-powered automated medical coding & claims workflow.",
    image: "/rahul-profile.webp",
    profileVideo:
      "https://res.cloudinary.com/divkfbddw/video/upload/v1767192966/convert_to_3d_i2hi0n.mp4",
    email: "imrahul2516@gmail.com", // Placeholder for UI consistency
    github: "github.com/imRahul05",
    X: "x.com/imrahul165",
    linkedin: "linkedin.com/in/imrahul05",
    resume:
      "https://acrobat.adobe.com/id/urn:aaid:sc:AP:8fb68d34-0a6e-4b15-a024-be2200708a87",
    currentlyBuilding: {
      name: "Arthion AI",
      url: "https://arthionai.app/",
      previewImage:
        "https://res.cloudinary.com/dw8r5ivmx/image/upload/v1767183858/Screenshot_2025-12-31_at_5.54.11_PM_wmhsv3.png",
    },
  },
  skills: [
    "React.js",
    "Next.js",
    "JavaScript",
    "TypeScript",
    "Tailwind CSS",
    "Node.js",
    "Vite",
    "SQL",
    "NoSQL",
    "MongoDB",
    "REST API",
    "AI Integration",
    "Cursor",
    "AntiGravity",
  ],
  education: [
    {
      institution: "Visvesvaraya Technological University",
      degree: "Master of Computer Applications (MCA)",
      period: "2022 — 2024",
      description:
        "Focus on Software Engineering and AI. Winner of Smart India Hackathon (SIH) 2023.",
      image:
        "https://upload.wikimedia.org/wikipedia/en/a/a0/Visvesvaraya_Technological_University_logo.png",
      tags: [
        "Computer Application",
        "Software Development",
        "Algorithms",
        "Data Structures",
        "OOPs",
        "DB",
      ],
    },
  ],
  experience: [
    {
      company: "Nuvi Technology",
      role: "Full Stack Developer",
      period: "Sep 2025 - Present",
      description:
        "Working as a Full Stack Developer, focusing on building scalable web applications and integrating AI solutions to enhance user experience.",
      image: "https://nuviltech.vercel.app/logo11.png",
    },
    {
      company: "Freelance / Personal Projects",
      role: "Software Engineer",
      period: "2024 — Present",
      description:
        "Developing production-grade full-stack applications. Built diverse tools ranging from AI-assisted dev environments to dynamic streaming platforms. Integrating modern APIs including OpenAI and TMDB.",
      image:
        "https://cdn.papershift.com/20220808070712/freelancing-work-and-its-statutory-laws-and-regulations-in-the-UK-explained-by-Papershift-min-910x500.jpeg",
    },
  ],
  projects: [
    {
      name: "Vela",
      period: "November 2026 - Present",
      tag: "macOS Notch App · Native Swift 6",
      featured: true,
      previewCommand: "⌃⌥Space · localhost:7878/event",
      previewTagline: "Claude Code · Antigravity · Opt-In Plugins",
      description:
        "A ~1.5 MB native Swift 6 macOS notch companion for AI workflows. Auto-hooks into Claude Code, Antigravity, and Codex, launches any installed browser, runs on-device Apple Intelligence, and expands with opt-in plugins including Smart Clipboard, a Finviz-style Storage Heatmap Cleaner, and an AES-256 encrypted Phone Companion.",
      tech: [
        "Swift 6",
        "SwiftUI",
        "AppKit",
        "macOS",
        "Apple Intelligence",
        "CryptoKit",
        "Vision OCR",
        "IOKit",
      ],
      link: "https://rhl-cli.vercel.app/products/vela",
      image: "/projects/vela.webp",
      video: "",
    },
    {
      name: "Shortlist",
      period: "November 2026",
      tag: "Chrome Extension · 100% Local",
      featured: true,
      previewCommand: "Alt+J → match this job",
      previewTagline: "Job Match · Resume Tailor · Autofill · On-device AI",
      description:
        "Free, private Chrome extension that reads any job page, scores your resume against it with a deterministic, explainable matcher, tailors your resume and cover letter live, and autofills applications. No sign-in, no API keys, no server — everything runs in the browser, with optional on-device Gemini Nano.",
      tech: [
        "JavaScript",
        "Chrome Extension (MV3)",
        "Gemini Nano",
        "pdf.js",
        "Next.js",
        "Tailwind CSS",
      ],
      link: "https://shortliistt.vercel.app",
      sourceUrl: "https://github.com/imRahul05/shortliistt",
      blogSlug: "shortlist-local-first-job-match",
      image: "/projects/shortlist.webp",
      video: SHORTLIST_LAUNCH_VIDEO.src,
      videoPoster: SHORTLIST_LAUNCH_VIDEO.poster,
      videoLabel: SHORTLIST_LAUNCH_VIDEO.description,
      videoAspect: SHORTLIST_LAUNCH_VIDEO.width / SHORTLIST_LAUNCH_VIDEO.height,
      videoHoverPreview: true,
    },
    {
      name: "RHL AI",
      period: "September 2026 - Present",
      tag: "AI Tooling & CLI Monorepo",
      previewCommand: "npx @rhl-ai/cli init",
      previewTagline: "Agent Skills · @rhl-ai/* Packages · Scaffolds",
      description:
        "Central developer and AI tooling monorepo unifying reusable agent skills, compiled @rhl-ai/* npm packages, and project scaffolds — built with a strict separation between executable tooling and prompt/knowledge artifacts.",
      tech: [
        "TypeScript",
        "Turborepo",
        "pnpm",
        "CLI",
        "AI Skills",
        "Changesets",
      ],
      link: "https://rhl-cli.vercel.app",
      sourceUrl: "https://github.com/imRahul05/rhl-ai",
      blogSlug: "rhl-ai-agentic-tooling-monorepo",
      image: "/projects/rhl-ai.webp",
      video: "",
    },
    {
      name: "ASHA Saathi",
      period: "November 2026",
      tag: "Build with Agora · Voice AI for Bharat",
      featured: true,
      previewCommand: "agora-rtc -> mcp -> neon-pg",
      previewTagline: "Hindi · Kannada · English Clinical Voice AI",
      description:
        "Multilingual voice assistant for ASHA health workers in India. Records maternal home visits via Agora Conversational AI and Murf Falcon TTS, flags danger signs with deterministic clinical rules over MCP, and dispatches confirmed WhatsApp/SMS doctor alerts.",
      tech: [
        "Next.js",
        "TypeScript",
        "Agora AI",
        "Murf TTS",
        "MCP",
        "Neon Postgres",
        "Zod",
      ],
      link: "https://asha-saathi-mocha.vercel.app/",
      sourceUrl: "https://github.com/imRahul05/asha-saathi",
      blogSlug: "asha-saathi-voice-ai-architecture",
      image: "/projects/asha-saathi.webp",
      video: "",
    },
    {
      name: "BenefitLens",
      period: "2026",
      featured: true,
      description:
        "An AI-powered document intelligence platform that transforms complex insurance and employee benefits documents into searchable, structured knowledge. It leverages LlamaParse, vector embeddings, and Retrieval-Augmented Generation (RAG) to enable accurate semantic search, intelligent document exploration, and AI-assisted question answering across enterprise benefit documents.",
      tech: [
        "Next.js",
        "React",
        "TypeScript",
        "Prisma",
        "PostgreSQL",
        "OpenAI",
        "LlamaParse",
        "RAG",
        "Vector Store",
        "TanStack Query",
        "Tailwind CSS",
      ],
      link: "https://benefitlens.vercel.app",
      sourceUrl: "https://github.com/imRahul05/benefitlens",
      blogSlug: "benefitlens-rag-document-intelligence",
      image:
        "https://res.cloudinary.com/dw8r5ivmx/image/upload/v1782806846/Screenshot_2026-06-30_at_1.36.19_PM_fee2ax.png",
      video: "",
    },
    {
      name: "MarkDown Previewer",
      period: "February 2026 - Present",
      description: "A markdown editor with live preview and instant sharing.",
      tech: ["React", "Web", "JS"],
      link: "https://markdownpreciew.vercel.app",
      sourceUrl: "",
      image: "",
      video: "",
    },
    {
      name: "FinSage AI",
      period: "November 2024 - December 2024",
      description:
        "A better way to manage your finances. Take control of your financial journey with our comprehensive suite of tools.",
      tech: ["React", "Web", "JS", "FireBase"],
      link: "https://finsage-ai.vercel.app/",
      sourceUrl: "https://github.com/imRahul05",
      image:
        "https://res.cloudinary.com/dw8r5ivmx/image/upload/v1767173443/Screenshot_2025-12-31_at_3.00.33_PM_jfpils.png",
      video:
        "https://res.cloudinary.com/divkfbddw/video/upload/v1756879926/Screen_Recording_2025-09-03_at_11.40.15_AM_qxxhxn.mov",
    },
    {
      name: "School Management System",
      period: "October 2024 - November 2024",
      description:
        "A comprehensive school management system and website designed to serve various stakeholders including students, parents, teachers, and administrators.",
      tech: ["MERN", "MongoDB", "Express", "React", "Node.js"],
      link: "https://mansarovar-public-school-green.vercel.app/",
      sourceUrl: "https://github.com/imRahul05",
      image:
        "https://res.cloudinary.com/dw8r5ivmx/image/upload/v1767173536/Screenshot_2025-12-31_at_3.02.07_PM_syjpih.png",
      video: "https://prourls.link/MnBUVO",
    },
    {
      name: "PillPal AI",
      period: "September 2024 - October 2024",
      description:
        "PillPal helps you manage medications, track doses, and stay on top of refills with smart reminders and a simple tracking system.",
      tech: ["React", "Web", "JS"],
      link: "https://pill-pal-ai.vercel.app/",
      sourceUrl: "https://github.com/imRahul05",
      video:
        "https://res.cloudinary.com/divkfbddw/video/upload/v1756879926/Screen_Recording_2025-09-03_at_11.40.15_AM_qxxhxn.mov",
    },
    {
      name: "Billing and Management App",
      period: "August 2024 - September 2024",
      description:
        "A web app for managing billing and invoicing with role-based authentication. Users can create, view, and manage invoices.",
      tech: ["MERN", "Tailwind", "JWT"],
      tag: "Currently used by client",
      sourceUrl: "https://github.com/imRahul05",
    },
    {
      name: "Movie Stream",
      description:
        "Built with react and tailwind css, this is a movie streaming web application that allows users to browse, search, and watch movies from a vast collection. It features a sleek and user-friendly interface, making it easy for users to find their favorite films using TMDB Apis and enjoy a seamless streaming experience.",
      tech: ["React", "Tailwind CSS", "TMDB API", "VidSrc API"],
      link: "https://sidemo.vercel.app",
    },
    {
      name: "Community Care",
      description:
        "Community Care is a platform that connects volunteers with local community service opportunities. Built with React and Vite, it allows users to find, join, and manage volunteer activities in their area.",
      tag: " Built this in Smart India Hackathon 2023",
      tech: ["Flutter", "Dart", "Firebase", "Android"],
      link: "https://communitycarev4.web.app",
    },
    {
      name: "EarthLink Traders",
      description:
        "It an e-commerce website for a trading company built using React for the frontend and Node.js with Express for the backend. The application features a user-friendly interface.",
      tag: "Currently used by client",
      tech: ["React", "TS", "Tailwind CSS", "Node.js", "Express", "MongoDB"],
      link: "https://earthlinktraders.com",
    },
    {
      name: "SnapDigest",
      description:
        "SnapDigest is an adaptive news reader application that personalizes content based on user location and network conditions. Built with React and Vite, the application delivers relevant news content while optimizing for various network speeds.",
      tech: ["React", "Vite"],
      link: "https://snap-digest.vercel.app/",
    },
    {
      name: "TypeFast - Competitive Typing Speed Game",
      description:
        "A modern, feature-rich typing speed test application built with React, Node.js, and MongoDB. Challenge yourself, compete with friends, and improve your typing skills with real-time feedback and performance tracking.",
      tech: ["React", "Node.js", "MongoDB"],
      link: "https://battle-type.vercel.app/",
    },
    {
      name: "OMS - Order Management System",
      period: "July 2024 - August 2024",
      description:
        "A web app for managing orders with role-based authentication. Users can place orders, staff/admins can manage them via dashboards.",
      tech: ["MERN", "Vite", "Tailwind", "JWT"],
      link: "https://order-management-system-inky-alpha.vercel.app/",
      sourceUrl: "https://github.com/imRahul05",
    },
    {
      name: "Algo-Blockchain",
      description:
        "I built this project to explore how Algorand transactions work end-to-end using a modern web stack. It connects a React + Vite frontend with an Express + MongoDB backend to send and track Algorand TestNet transactions in real time. The goal was to understand blockchain integration, transaction lifecycle, and persistence in a practical, hands-on way.",
      tech: ["React", "Vite", "Express", "MongoDB", "Algorand", "Blockchain"],
      link: "https://algorand-task.vercel.app/",
    },
    {
      name: "Candidate Referral Management System (CRMS)",
      description:
        "A comprehensive web application for managing employee referrals built with React and Vite. This system allows employees to submit candidate referrals and tracks these referrals through the hiring pipeline.",
      tech: ["React", "Vite"],
      link: "https://crms-dash.vercel.app/",
    },
  ],
};
