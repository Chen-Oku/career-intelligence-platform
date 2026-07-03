import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // pdfkit loads its bundled .afm font metrics via paths relative to its own
  // package directory — bundling it breaks those lookups, so it must run
  // unbundled.
  serverExternalPackages: ["pdfkit"],
  images: {
    remotePatterns: [
      // Google OAuth profile pictures
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
    ],
  },
};

export default withNextIntl(nextConfig);
