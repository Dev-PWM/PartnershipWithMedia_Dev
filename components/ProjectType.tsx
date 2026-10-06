"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { projectTypes, type ProjectType } from "@/lib/content";

type Ctx = {
  projectType: ProjectType;
  setProjectType: (value: ProjectType) => void;
};

const ProjectTypeContext = createContext<Ctx | null>(null);

// Shares the contact form's "Project_Protocol" selection so CTAs anywhere on
// the page can preset it before scrolling to #contact. Other pages preset it
// by linking to /?project=<key>#contact.
export function ProjectTypeProvider({ children }: { children: React.ReactNode }) {
  const [projectType, setProjectType] = useState<ProjectType>(projectTypes[0].value);

  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get("project");
    const match = projectTypes.find((t) => t.key === key);
    if (match) setProjectType(match.value);
  }, []);

  return (
    <ProjectTypeContext.Provider value={{ projectType, setProjectType }}>
      {children}
    </ProjectTypeContext.Provider>
  );
}

export function useProjectType() {
  const ctx = useContext(ProjectTypeContext);
  if (!ctx) throw new Error("useProjectType must be used inside ProjectTypeProvider");
  return ctx;
}

export function PresetLink({
  preset,
  className,
  children,
}: {
  preset?: ProjectType;
  className?: string;
  children: React.ReactNode;
}) {
  const { setProjectType } = useProjectType();
  return (
    <a
      href="#contact"
      className={className}
      onClick={() => {
        if (preset) setProjectType(preset);
      }}
    >
      {children}
    </a>
  );
}
