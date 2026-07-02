import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // The repo root has an empty stub package-lock.json (see CLAUDE.md) that
  // makes Next.js's own lockfile-walk mis-detect the workspace root as the
  // outer repo instead of cip/ — pin both explicitly to cip/ so they agree
  // (Vercel build was warning "outputFileTracingRoot and turbopack.root...
  // must have the same value").
  outputFileTracingRoot: __dirname,
  turbopack: {
    root: __dirname,
  },
  // pdf-parse pulls in pdfjs-dist, which loads its worker script (pdf.worker.mjs)
  // and @napi-rs/canvas's native binary via paths relative to its own package
  // directory. pdfkit loads its bundled .afm font metrics the same way.
  // Bundling any of these breaks those lookups, so they must run unbundled.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "@napi-rs/canvas", "pdfkit"],
  images: {
    remotePatterns: [
      // Google OAuth profile pictures
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
    ],
  },
};

export default withNextIntl(nextConfig);
