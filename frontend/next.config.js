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
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      exclude: /node_modules/,
      use: ['raw-loader', 'glslify-loader'],
    });
    return config;
  },
};

module.exports = nextConfig;
