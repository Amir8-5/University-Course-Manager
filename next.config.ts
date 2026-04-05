import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
  outputFileTracingIncludes: {
    '/api/syllabus/parse': ['./node_modules/pdfjs-dist/legacy/build/**/*'],
  },
};

export default nextConfig;
