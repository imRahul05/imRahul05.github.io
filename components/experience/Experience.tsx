import React, { useState } from "react";
import { DATA } from "../../data/data";
import { SectionTitle } from "../SectionTitle";
import { TypewriterText } from "../TypewriterText";
import { ChevronDown } from "lucide-react";

interface ExperienceItemProps {
  company: string;
  role: string;
  period: string;
  description: string;
  image?: string;
}

const ExperienceItem: React.FC<ExperienceItemProps> = ({
  company,
  role,
  period,
  description,
  image,
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
        <div className="shrink-0 w-12 h-12 rounded-full overflow-hidden bg-border-light border border-border">
          {!isImageLoaded && (
            <div className="w-full h-full rounded-full animate-shimmer" />
          )}
          <img
            src={image}
            alt={company}
            className={`w-full h-full object-cover transition-[filter] duration-300 ease-in-out dark:grayscale ${
              !isImageLoaded ? "hidden" : ""
            }`}
            onLoad={() => setIsImageLoaded(true)}
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-foreground m-0">{company}</h3>
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
            {role}
          </p>
          <span className="text-xs text-muted-foreground">{period}</span>
        </div>
        {isOpen && (
          <p className="mt-2 text-[0.875rem] leading-[1.7] text-secondary-foreground">
            <TypewriterText text={description} speed={5} />
          </p>
        )}
      </div>
    </div>
  );
};

export const Experience: React.FC = () => {
  return (
    <section className="mb-12">
      <SectionTitle index="02">Experience</SectionTitle>
      <div>
        {DATA.experience.map((job, index) => (
          <ExperienceItem
            key={index}
            company={job.company}
            role={job.role}
            period={job.period}
            description={job.description}
            image={job.image}
          />
        ))}
      </div>
    </section>
  );
};
