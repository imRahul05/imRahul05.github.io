import React, { Suspense, lazy, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { afterLoadIdle } from "@/lib/idle";

// Route loaders are named so they can be prefetched before navigation.
const loaders = {
  "/": () => import("../../pages/HomePage"),
  "/projects": () => import("../../pages/ProjectsPage"),
  "/blogs": () => import("../../pages/BlogsPage"),
  "/blogs/:slug": () => import("../../pages/BlogDetailPage"),
} as const;

type RoutePath = keyof typeof loaders;

const HomePage = lazy(loaders["/"]);
const ProjectsPage = lazy(loaders["/projects"]);
const BlogsPage = lazy(loaders["/blogs"]);
const BlogDetailPage = lazy(loaders["/blogs/:slug"]);

const prefetched = new Set<RoutePath>();

/**
 * Warm a route's JS chunk so navigating to it renders without a loader.
 * Safe to call repeatedly; each chunk is only requested once.
 */
export const prefetchRoute = (path: string) => {
  const key: RoutePath | null =
    path === "/" || path === "/projects" || path === "/blogs"
      ? path
      : path.startsWith("/blogs/")
        ? "/blogs/:slug"
        : null;
  if (!key || prefetched.has(key)) return;
  prefetched.add(key);
  loaders[key]().catch(() => prefetched.delete(key));
};

// Simple loading fallback
const PageLoader = () => (
  <div className="flex justify-center items-center min-h-screen bg-background">
    <div className="w-8 h-8 border-2 border-border border-t-foreground rounded-full animate-spin" />
  </div>
);

export const AppRoutes: React.FC = () => {
  // Once the current page is loaded and idle, warm the main list pages.
  useEffect(
    () =>
      afterLoadIdle(
        () => {
          prefetchRoute("/projects");
          prefetchRoute("/blogs");
        },
        { delay: 2500 },
      ),
    [],
  );

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/blogs" element={<BlogsPage />} />
        <Route path="/blogs/:slug" element={<BlogDetailPage />} />
        {/* Redirect old hash-based routes to new paths */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};
