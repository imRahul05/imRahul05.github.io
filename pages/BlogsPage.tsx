import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { BLOGS } from "../data/blogs";
import { BlogCard } from "../components/blog/BlogCard";

export const BlogsPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate("/");
    window.scrollTo(0, 0);
  };

  const handleReadMore = (slug: string) => {
    navigate(`/blogs/${slug}`);
    window.scrollTo(0, 0);
  };

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-6 pt-14 pb-28 font-mono">
      <header className="mb-8 flex flex-col gap-2 border-b border-border pb-6">
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
        <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2">
          {BLOGS.map((blog) => (
            <BlogCard key={blog.slug} blog={blog} onReadMore={handleReadMore} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default BlogsPage;
