import React, { useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { BLOGS } from "../../data/blogs";
import { BlogCard } from "./BlogCard";

interface BlogsPageProps {
  onBack: () => void;
  onSelectBlog: (slug: string) => void;
}

export const BlogsPage: React.FC<BlogsPageProps> = ({
  onBack,
  onSelectBlog,
}) => {
  const handleBackClick = useCallback(() => {
    onBack();
  }, [onBack]);

  const handleReadMore = useCallback(
    (slug: string) => {
      onSelectBlog(slug);
    },
    [onSelectBlog],
  );

  return (
    <div className="container pb-24">
      <header className="mb-8 flex flex-col gap-2 border-b border-border pb-4">
        <button
          className="inline-flex cursor-pointer items-center gap-2 self-start py-2 font-mono text-sm text-secondary-foreground transition-colors hover:text-foreground"
          onClick={handleBackClick}
          aria-label="Go back to home"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <h1 className="text-2xl font-bold tracking-tight">Blog</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Thoughts, tutorials, and insights on software development
        </p>
      </header>

      <section>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {BLOGS.map((blog) => (
            <BlogCard key={blog.slug} blog={blog} onReadMore={handleReadMore} />
          ))}
        </div>
      </section>
    </div>
  );
};
