// next.config.js
const isGithubPages = process.env.GITHUB_PAGES === 'true';
const repoName = 'RealtorPro';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',               // next export -> ./out
  images: { unoptimized: true },  // allow <img> only (we're already using <img>)
  trailingSlash: true,            // GH Pages likes static trailing slashes
  basePath: isGithubPages ? `/${repoName}` : '',
  assetPrefix: isGithubPages ? `/${repoName}/` : '',
};
module.exports = nextConfig;

const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  output: 'export',
  basePath: isProd ? '/RealtorPro' : '',
  images: { unoptimized: true }
}