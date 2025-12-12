/** @type {import('next').NextConfig} */
const nextConfig = {
  // Commented out for now so dynamic routes work with the Go API.
  // output: 'export',

  images: {
    domains: ['images.unsplash.com'],
  },
};

module.exports = nextConfig;