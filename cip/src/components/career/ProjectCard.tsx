"use client";

import Link from "next/link";
import { Pencil, Trash2, ExternalLink, Github, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useDeleteProject } from "@/hooks/useProjects";
import type { ProjectDTO } from "@/lib/types/project";

const MAX_TECH = 4;

export function ProjectCard({ project }: { project: ProjectDTO }) {
  const t = useTranslations("projects");
  const { mutate: deleteProject, isPending: isDeleting } = useDeleteProject();

  const visibleTech = project.technologies.slice(0, MAX_TECH);
  const hiddenCount = project.technologies.length - MAX_TECH;

  return (
    <div
      className={cn(
        "group relative flex gap-0 rounded-lg border bg-card overflow-hidden transition-shadow hover:shadow-sm",
        project.isHighlighted ? "border-primary/40" : "border-border",
      )}
    >
      {/* Accent bar — solid for highlighted, faint otherwise */}
      <div
        className={cn(
          "w-0.5 shrink-0 bg-primary",
          project.isHighlighted ? "opacity-100" : "opacity-20",
        )}
        aria-hidden
      />

      <div className="flex-1 px-5 py-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold leading-tight truncate">
                {project.name}
              </h3>
              {project.isHighlighted && (
                <Star className="h-3.5 w-3.5 text-primary fill-primary shrink-0" />
              )}
            </div>
            {project.myRole && (
              <p className="mt-0.5 text-xs text-muted-foreground">{project.myRole}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            {project.externalUrl && (
              <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                <a href={project.externalUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="sr-only">{t("card.viewProject")}</span>
                </a>
              </Button>
            )}
            {project.githubUrl && (
              <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                  <Github className="h-3.5 w-3.5" />
                  <span className="sr-only">{t("card.github")}</span>
                </a>
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
              <Link href={`/projects/${project.id}/edit`}>
                <Pencil className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost" size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("card.deleteTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t.rich("card.deleteDescription", {
                      name: project.name,
                      strong: (chunks) => <strong>{chunks}</strong>,
                    })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("card.cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => deleteProject(project.id)}
                  >
                    {t("card.delete")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Description snippet */}
        <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {project.description}
        </p>

        {/* Goal & results — the "why" and the "so what" of the project */}
        {(project.goal || project.results) && (
          <div className="mt-2 space-y-1">
            {project.goal && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                <span className="font-medium text-foreground/70">Goal: </span>
                {project.goal}
              </p>
            )}
            {project.results && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                <span className="font-medium text-foreground/70">Results: </span>
                {project.results}
              </p>
            )}
          </div>
        )}

        {/* Tags + tech */}
        {(project.tags.length > 0 || project.technologies.length > 0) && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="h-5 px-2 text-[11px] font-normal">
                {tag}
              </Badge>
            ))}
            {visibleTech.map((tech) => (
              <Badge key={tech} variant="outline" className="h-5 px-2 text-[11px] font-normal">
                {tech}
              </Badge>
            ))}
            {hiddenCount > 0 && (
              <Badge variant="outline" className="h-5 px-2 text-[11px] font-normal text-muted-foreground">
                +{hiddenCount}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
