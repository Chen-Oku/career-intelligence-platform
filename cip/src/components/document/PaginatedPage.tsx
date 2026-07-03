"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

// CSS "in" is a fixed 96px/in by spec (not display DPI-dependent), so these
// are reliable proxies for US Letter (8.5x11in) regardless of the viewer's
// actual screen. They're a visual guide only — the downloaded PDF paginates
// for real via pdfkit's own Letter-size page breaks.
const PAGE_WIDTH_PX = 8.5 * 96;
const PAGE_HEIGHT_PX = 11 * 96;
export const PAGE_WIDTH_CSS = "8.5in";

/**
 * PaginatedPage — wraps a resume document and overlays dashed guides at
 * every US-Letter page boundary, so the user can see how long the CV is
 * before downloading it.
 *
 * The document is laid out at true Letter width (8.5in). On viewports too
 * narrow to fit it (phones/tablets) the whole page is scaled down with a CSS
 * transform so it always fits without horizontal scrolling — a faithful
 * shrink-to-fit preview rather than a reflow, so the page-break guides stay
 * accurate. It never scales above 1, so desktop is unaffected.
 */
export function PaginatedPage({ children }: { children: React.ReactNode }) {
  const t = useTranslations("resumes.preview");
  const outerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);
  const [scale, setScale] = useState(1);
  const [pageHeight, setPageHeight] = useState(0);

  // Scale to the available width (phones/tablets), capped at 1 for desktop.
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const measure = () =>
      setScale(Math.min(1, el.clientWidth / PAGE_WIDTH_PX));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Measure the real (unscaled) document height — transforms don't affect
  // scrollHeight — for the page-break guides and to reserve the scaled space.
  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;
    const measure = () => {
      const h = el.scrollHeight;
      setPageHeight(h);
      setPageCount(Math.max(1, Math.ceil(h / PAGE_HEIGHT_PX)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={outerRef}>
      <p className="mb-2 text-center text-xs text-muted-foreground font-mono-data">
        {t("pagination.count", { count: pageCount })}
      </p>
      {/* Height wrapper collapses the scaled page: it reserves exactly the
          scaled visual size so there's no empty gap below and the layout box
          never exceeds the viewport width. */}
      <div
        style={{
          width: PAGE_WIDTH_PX * scale,
          height: pageHeight ? pageHeight * scale : undefined,
          maxWidth: "100%",
          margin: "0 auto",
        }}
      >
        <div
          ref={pageRef}
          style={{
            width: PAGE_WIDTH_CSS,
            transform: scale < 1 ? `scale(${scale})` : undefined,
            transformOrigin: "top left",
            position: "relative",
          }}
        >
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
    </div>
  );
}
