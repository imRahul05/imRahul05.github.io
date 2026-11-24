import React, { useState } from "react";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { type Blog } from "../../data/blogs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface BlogCardProps {
  blog: Blog;
  onReadMore: (slug: string) => void;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const BlogCard: React.FC<BlogCardProps> = ({ blog, onReadMore }) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const handleCardClick = () => {
    onReadMore(blog.slug);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onReadMore(blog.slug);
    }
  };

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onReadMore(blog.slug);
  };

  return (
    <article
      className="cad-card group relative flex h-full cursor-pointer flex-col overflow-hidden"
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Read blog post: ${blog.title}`}
    >
      {blog.image && (
        <div className="relative m-3 mb-0 aspect-16/9 w-[calc(100%-1.5rem)] shrink-0 overflow-hidden rounded-lg bg-border-light">
          {!isImageLoaded && (
            <Skeleton className="size-full rounded-lg animate-shimmer" />
          )}
          <img
            src={blog.image}
            alt={blog.title}
            className={`size-full rounded-lg object-cover transition-all duration-300 ease-out group-hover:scale-105 dark:brightness-90 ${
              !isImageLoaded ? "hidden" : ""
            }`}
            onLoad={() => setIsImageLoaded(true)}
          />
        </div>
      )}

      <div className="flex grow flex-col p-4 pt-3">
        <div className="mb-2 flex items-center gap-4">
          <span className="flex items-center gap-1 text-[0.7rem] text-muted-foreground">
            <Calendar size={12} />
            {formatDate(blog.date)}
          </span>
          <span className="flex items-center gap-1 text-[0.7rem] text-muted-foreground">
            <Clock size={12} />
            {blog.readTime}
          </span>
        </div>

        <h3 className="mb-2 text-base font-bold leading-snug tracking-tight text-foreground">
          {blog.title}
        </h3>

        <p className="mb-4 line-clamp-3 text-[0.875rem] leading-[1.7] text-secondary-foreground">
          {blog.excerpt}
        </p>

        <div className="mb-4 flex flex-wrap gap-2">
          {blog.tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="rounded text-[0.65rem] font-normal text-secondary-foreground transition-colors group-hover:border-muted-foreground"
            >
              {tag}
            </Badge>
          ))}
        </div>

        <button
          className="group/btn mt-auto inline-flex cursor-pointer items-center gap-1.5 self-start rounded-md border border-border bg-transparent px-3 py-1.5 font-mono text-xs text-secondary-foreground transition-colors hover:border-muted-foreground hover:bg-border-light hover:text-foreground"
          onClick={handleButtonClick}
          aria-label={`Read more about ${blog.title}`}
        >
          Read More
          <ArrowRight
            size={14}
            className="transition-transform duration-200 group-hover/btn:translate-x-1"
          />
        </button>
      </div>
    </article>
  );
};
