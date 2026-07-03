import type { ResumeContent, ResumeContact } from "@/lib/types/resume";

export interface ResumeDocumentLabels {
  summary: string;
  experience: string;
  projects: string;
  skills: string;
  education: string;
}

/**
 * ResumeDocument — presentational render of a resume's content + contact
 * as a styled document (header → summary → experience → projects → skills
 * → education). Pure props in, no data fetching — used by both the
 * read-only ResumePreview and ResumeEditor's live preview pane so the two
 * never drift out of sync.
 */
export function ResumeDocument({
  content, contact, targetRole, userName, labels,
}: {
  content: ResumeContent;
  contact: ResumeContact;
  targetRole?: string;
  userName: string;
  labels: ResumeDocumentLabels;
}) {
  const contactParts = [
    contact.location,
    contact.email,
    contact.phone,
    contact.linkedin && `linkedin.com/${contact.linkedin.replace(/^(linkedin\.com\/|\/)/i, "")}`,
    contact.portfolio,
  ].filter(Boolean);

  const showProjects = (content.projects?.length ?? 0) > 0 && content.sectionVisibility?.projects !== false;

  return (
    <div
      className="bg-white rounded-lg border border-border shadow-sm p-10"
      style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
    >
      {/* Header */}
      <div className="text-center mb-6 pb-5 border-b border-gray-200">
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "0.02em", margin: 0, fontFamily: "system-ui, sans-serif" }}>
          {userName.toUpperCase()}
        </h1>
        {targetRole && (
          <p style={{ fontSize: 13, color: "#333", marginTop: 4, fontStyle: "italic" }}>{targetRole}</p>
        )}
        {contactParts.length > 0 && (
          <p style={{ fontSize: 11, color: "#555", marginTop: 8, fontFamily: "monospace", lineHeight: 1.8 }}>
            {contactParts.join(" · ")}
          </p>
        )}
      </div>

      {/* Summary */}
      {content.summary && (
        <Section title={labels.summary}>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: "#1a1a1a", margin: 0 }}>{content.summary}</p>
        </Section>
      )}

      {/* Experience */}
      {content.experience?.length > 0 && (
        <Section title={labels.experience}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {content.experience.map((exp, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, fontFamily: "system-ui, sans-serif" }}>{exp.company}</span>
                  <span style={{ fontSize: 11, fontFamily: "monospace", color: "#666" }}>
                    {exp.startDate} – {exp.endDate}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 4, marginTop: 1 }}>
                  <span style={{ fontSize: 13, color: "#333", fontStyle: "italic" }}>{exp.position}</span>
                  {exp.location && <span style={{ fontSize: 11, color: "#888", fontFamily: "monospace" }}>{exp.location}</span>}
                </div>
                <ul style={{ margin: "8px 0 0", padding: "0 0 0 16px", listStyle: "disc" }}>
                  {exp.bullets.map((bullet, j) => (
                    <li key={j} style={{ fontSize: 13, lineHeight: 1.6, color: "#1a1a1a", marginBottom: 3 }}>{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Projects */}
      {showProjects && (
        <Section title={labels.projects}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {content.projects!.map((project, i) => (
              <div key={i}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 600, fontSize: 13, fontFamily: "system-ui, sans-serif" }}>{project.name}</span>
                  {project.technologies.length > 0 && (
                    <span style={{ fontSize: 11, color: "#888", fontFamily: "monospace" }}>
                      {project.technologies.slice(0, 4).join(", ")}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: "#1a1a1a", margin: "3px 0 0", lineHeight: 1.6 }}>{project.description}</p>
                {project.url && <p style={{ fontSize: 11, color: "#888", margin: "2px 0 0", fontFamily: "monospace" }}>{project.url}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Skills */}
      {content.skills?.length > 0 && (
        <Section title={labels.skills}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {content.skills.map((group, i) => (
              <div key={i} style={{ display: "flex", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, minWidth: 120, flexShrink: 0, fontFamily: "system-ui, sans-serif" }}>{group.category}:</span>
                <span style={{ fontSize: 13, color: "#1a1a1a", lineHeight: 1.6 }}>{group.items.join(", ")}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Education */}
      {content.education?.length > 0 && (
        <Section title={labels.education}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {content.education.map((edu, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 4 }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: 13, fontFamily: "system-ui, sans-serif" }}>{edu.institution}</span>
                  <p style={{ fontSize: 13, color: "#333", margin: "2px 0 0", fontStyle: "italic" }}>{edu.degree}</p>
                </div>
                {edu.year && <span style={{ fontSize: 11, fontFamily: "monospace", color: "#666", alignSelf: "flex-start" }}>{edu.year}</span>}
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <h2 style={{
          fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em",
          color: "#C2782A", margin: 0, fontFamily: "system-ui, sans-serif",
        }}>
          {title}
        </h2>
        <div style={{ flex: 1, height: 1, background: "#e5e5e5" }} />
      </div>
      {children}
    </div>
  );
}
