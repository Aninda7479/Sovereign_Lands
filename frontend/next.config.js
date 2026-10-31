/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Prevents double-mount initialization loops in WebGL & Rapier physics
  transpilePackages: [
    'three',
    '@react-three/fiber',
    '@react-three/drei',
    '@react-three/rapier',
  ],
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      '@x402/evm/upto/client': false,
      '@x402/evm/exact/client': false,
      '@x402/core/client': false,
      '@x402/svm/exact/client': false,
      '@x402/evm': false,
      fs: false,
      net: false,
      tls: false,
    };
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@x402/evm/upto/client': false,
      '@x402/evm/exact/client': false,
      '@x402/core/client': false,
      '@x402/svm/exact/client': false,
      '@x402/evm': false,
    };
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      exclude: /node_modules/,
      type: 'asset/source',
    });
    return config;
  },
};

module.exports = nextConfig;
