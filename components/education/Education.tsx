import React, { useState } from "react";
import { DATA } from "../../data/data";
import { SectionTitle } from "../SectionTitle";
import { TypewriterText } from "../TypewriterText";
import { ChevronDown } from "lucide-react";

interface EducationItemProps {
  institution: string;
  degree: string;
  period: string;
  description: string;
  image?: string;
  tags?: string[];
}

const EducationItem: React.FC<EducationItemProps> = ({
  institution,
  degree,
  period,
  description,
  image,
  tags,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  return (
    <div
      className="flex gap-4 mb-6 last:mb-0 items-start cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setIsOpen(!isOpen)}
    >
      {image && (
        <div className="relative shrink-0 w-12 h-12 rounded-full overflow-hidden bg-border-light border border-border">
          {!isImageLoaded && (
            <div className="absolute inset-0 rounded-full animate-shimmer" />
          )}
          <img
            src={image}
            alt={institution}
            loading="lazy"
            decoding="async"
            width={48}
            height={48}
            className={`w-full h-full object-cover transition-[filter,opacity] duration-300 ease-in-out dark:grayscale ${
              !isImageLoaded ? "opacity-0" : ""
            }`}
            onLoad={() => setIsImageLoaded(true)}
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-foreground m-0">
              {institution}
            </h3>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
              className={`bg-transparent border-0 cursor-pointer p-0 flex items-center transition-opacity duration-200 ease-in-out ${
                isHovered || isOpen ? "opacity-100" : "opacity-0"
              }`}
              aria-label={isOpen ? "Collapse details" : "Expand details"}
            >
              <ChevronDown
                size={14}
                className={`text-muted-foreground transition-transform duration-200 ease-in-out ${
                  isOpen ? "rotate-180" : "rotate-0"
                }`}
              />
            </button>
          </div>
          <p className="my-1 text-[0.875rem] text-secondary-foreground">
            {degree}
          </p>
          <span className="text-xs text-muted-foreground">{period}</span>
        </div>
        {isOpen && (
          <div className="mt-2">
            <p className="mt-2 text-[0.875rem] leading-[1.7] text-secondary-foreground">
              <TypewriterText text={description} speed={5} />
            </p>
            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="text-[0.7rem] text-secondary-foreground bg-transparent border border-border px-2 py-[0.2rem] rounded transition-colors duration-200 ease-in-out hover:border-muted-foreground hover:text-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const Education: React.FC = () => {
  return (
    <section className="mb-12">
      <SectionTitle index="03">Education</SectionTitle>
      <div>
        {DATA.education.map((edu, index) => (
          <EducationItem
            key={index}
            institution={edu.institution}
            degree={edu.degree}
            period={edu.period}
            description={edu.description}
            image={edu.image}
            tags={edu.tags}
          />
        ))}
      </div>
    </section>
  );
};
