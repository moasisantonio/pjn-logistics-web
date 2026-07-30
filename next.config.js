// next.config.js
/** @type {import('next').NextFormat} */
const nextConfig = {
  output: 'export', // Penting untuk export static HTML ke public_html
  images: { unoptimized: true }
}
module.exports = nextConfig;