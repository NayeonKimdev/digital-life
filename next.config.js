/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  // UTF-8 인코딩 명시적 설정 및 모듈 폴백 설정
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      buffer: require.resolve('buffer'),
    }
    return config
  },
}

module.exports = nextConfig
