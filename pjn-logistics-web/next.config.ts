import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // <-- Tambahkan/ubah baris ini
  images: {
    unoptimized: true, // Wajib diaktifkan jika menggunakan output 'export'
  },
};

export default nextConfig;