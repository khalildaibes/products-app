/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets CI/scripts build without clashing with a running dev server's .next
  distDir: process.env.NEXT_DIST_DIR || ".next",
};
export default nextConfig;
