import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/infrastructure/database/client";
import {
  Briefcase, FolderOpen, Zap, BookOpen, Upload, FileText, Mail,
  MessageCircleQuestion, Search, User, Award, GraduationCap, ArrowRight, Target,
} from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Dashboard" };

type ModuleKey =
  | "import" | "experience" | "projects" | "skills" | "certifications" | "education"
  | "stories" | "profile" | "resumes" | "coverLetters" | "jobAnalyzer" | "interviewPrep";

const MODULES: Record<ModuleKey, { href: string; icon: React.ElementType }> = {
  import: { href: "/import", icon: Upload },
  experience: { href: "/experience", icon: Briefcase },
  projects: { href: "/projects", icon: FolderOpen },
  skills: { href: "/skills", icon: Zap },
  certifications: { href: "/certifications", icon: Award },
  education: { href: "/education", icon: GraduationCap },
  stories: { href: "/stories", icon: BookOpen },
  profile: { href: "/profile", icon: User },
  resumes: { href: "/resumes", icon: FileText },
  coverLetters: { href: "/cover-letters", icon: Mail },
  jobAnalyzer: { href: "/job-analyzer", icon: Search },
  interviewPrep: { href: "/interview-prep", icon: MessageCircleQuestion },
};

/** Same three-step structure as the sidebar: feed data → generate → apply. */
const STEP_GROUPS: { stepKey: "build" | "generate" | "apply"; modules: ModuleKey[] }[] = [
  { stepKey: "build", modules: ["import", "experience", "projects", "skills", "certifications", "education", "stories", "profile"] },
  { stepKey: "generate", modules: ["resumes", "coverLetters"] },
  { stepKey: "apply", modules: ["jobAnalyzer", "interviewPrep"] },
];

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;
  const firstName = session?.user?.name?.split(" ")[0] ?? t("defaultName");

  // Direct Prisma reads for dashboard aggregates — read-only counts don't
  // warrant use-case ceremony (same precedent as job-analyzer's GET).
  const [
    experienceCount, projectCount, skillCount, certificationCount, educationCount, storyCount,
    resumeCount, coverLetterCount, jobCount, user, latestJob,
  ] = await Promise.all([
    prisma.experience.count({ where: { userId } }),
    prisma.project.count({ where: { userId } }),
    prisma.skill.count({ where: { userId } }),
    prisma.certification.count({ where: { userId } }),
    prisma.educationEntry.count({ where: { userId } }),
    prisma.story.count({ where: { userId } }),
    prisma.resume.count({ where: { userId } }),
    prisma.coverLetter.count({ where: { userId } }),
    prisma.jobDescription.count({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { aboutMe: true } }),
    prisma.jobDescription.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, company: true, matchScore: true },
    }),
  ]);

  const counts: Partial<Record<ModuleKey, number>> = {
    experience: experienceCount,
    projects: projectCount,
    skills: skillCount,
    certifications: certificationCount,
    education: educationCount,
    stories: storyCount,
    resumes: resumeCount,
    coverLetters: coverLetterCount,
    jobAnalyzer: jobCount,
  };

  // Profile completeness — one check per data source the generators rely on.
  const checks: { key: string; done: boolean; href: string }[] = [
    { key: "experience", done: experienceCount > 0, href: "/experience" },
    { key: "skills", done: skillCount >= 3, href: "/skills" },
    { key: "projects", done: projectCount > 0, href: "/projects" },
    { key: "stories", done: storyCount > 0, href: "/stories" },
    { key: "aboutMe", done: !!user?.aboutMe, href: "/profile" },
    { key: "education", done: educationCount > 0, href: "/education" },
  ];
  const completedChecks = checks.filter((c) => c.done).length;
  const percent = Math.round((completedChecks / checks.length) * 100);
  const pendingChecks = checks.filter((c) => !c.done).slice(0, 3);

  return (
    <div className="p-6 max-w-3xl mx-auto pb-16">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">
          {t("welcome", { name: firstName })}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("intro")}</p>
      </div>

      {/* Completeness */}
      <div className="mb-4 rounded-lg border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold">{t("completeness.title")}</h2>
          <span className="text-sm font-semibold text-primary">{percent}%</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-primary/10">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
        </div>
        {pendingChecks.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {pendingChecks.map((check) => (
              <Link
                key={check.key}
                href={check.href}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {t(`completeness.checks.${check.key}`)}
                <ArrowRight className="h-3 w-3" />
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">{t("completeness.allDone")}</p>
        )}
      </div>

      {/* Latest job analysis */}
      {latestJob && (
        <Link
          href={`/job-analyzer/${latestJob.id}`}
          className="mb-6 flex items-center gap-3 rounded-lg border border-border bg-card px-5 py-3.5 transition-shadow hover:shadow-sm"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <Target className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {latestJob.title}{latestJob.company ? ` — ${latestJob.company}` : ""}
            </p>
            <p className="text-xs text-muted-foreground">{t("latestAnalysis.label")}</p>
          </div>
          {latestJob.matchScore != null && (
            <span className="shrink-0 text-sm font-semibold text-primary">
              {t("latestAnalysis.match", { score: latestJob.matchScore })}
            </span>
          )}
        </Link>
      )}

      {/* Module grid, grouped by step */}
      <div className="space-y-7">
        {STEP_GROUPS.map(({ stepKey, modules }) => (
          <div key={stepKey}>
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t(`steps.${stepKey}`)}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
              {modules.map((moduleKey) => (
                <ModuleCard
                  key={moduleKey}
                  href={MODULES[moduleKey].href}
                  icon={MODULES[moduleKey].icon}
                  title={t(`modules.${moduleKey}.title`)}
                  description={t(`modules.${moduleKey}.description`)}
                  count={counts[moduleKey]}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ModuleCard({
  href,
  icon: Icon,
  title,
  description,
  count,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
  count?: number;
}) {
  return (
    <Link href={href} className="block h-full">
      <div className="group h-full rounded-lg border border-border bg-card p-5 transition-shadow hover:shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <Icon className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">{title}</h3>
              {count !== undefined && count > 0 && (
                <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium leading-none text-primary">
                  {count}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
