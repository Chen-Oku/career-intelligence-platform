"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

// CSS "in" is a fixed 96px/in by spec (not display DPI-dependent), so this
// is a reliable proxy for US Letter (8.5x11in) regardless of the viewer's
// actual screen. It's a visual guide only — the downloaded PDF paginates
// for real via pdfkit's own Letter-size page breaks.
const PAGE_HEIGHT_PX = 11 * 96;
export const PAGE_WIDTH_CSS = "8.5in";

/**
 * PaginatedPage — wraps a resume document and overlays dashed guides at
 * every US-Letter page boundary, so the user can see how long the CV is
 * before downloading it.
 */
export function PaginatedPage({ children }: { children: React.ReactNode }) {
  const t = useTranslations("resumes.preview");
  const ref = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setPageCount(Math.max(1, Math.ceil(el.scrollHeight / PAGE_HEIGHT_PX)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div>
      <p className="mb-2 text-center text-xs text-muted-foreground font-mono-data">
        {t("pagination.count", { count: pageCount })}
      </p>
      <div ref={ref} style={{ width: PAGE_WIDTH_CSS, margin: "0 auto", position: "relative" }}>
        {children}
        {Array.from({ length: pageCount - 1 }, (_, i) => (
          <div
            key={i}
            style={{
              position: "absolute", left: 0, right: 0, top: (i + 1) * PAGE_HEIGHT_PX,
              borderTop: "1px dashed #C2782A", pointerEvents: "none",
            }}
          >
            <span
              style={{
                position: "absolute", right: 8, top: 4, fontSize: 10, color: "#C2782A",
                fontFamily: "monospace", background: "white", padding: "0 4px",
              }}
            >
              {t("pagination.pageLabel", { page: i + 2 })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
