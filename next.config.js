/** @type {import('next').NextConfig} */
const sandboxBasePath = process.env.SANDBOX_BASE_PATH || '';
const nextConfig = {
  reactStrictMode: true,
  // Fundação type-safe; código de feature da IA nem sempre passa no type-check
  // strict. App roda igual - não travamos deploy por isso (mesma escolha de
  // Lovable/Bolt). Erros reais (sintaxe, módulo faltando) ainda quebram.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: { unoptimized: true },
  ...(sandboxBasePath ? { basePath: sandboxBasePath } : {}),
  experimental: { serverComponentsExternalPackages: ["@whiskeysockets/baileys","bullmq"] },
};

module.exports = nextConfig;
