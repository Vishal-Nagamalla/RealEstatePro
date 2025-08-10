// next.config.js
const isGithubPages = process.env.GITHUB_PAGES === 'true';
const repoName = 'srikar-portfolio'; // <<< CHANGE to your repo name

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',               // next export -> ./out
  images: { unoptimized: true },  // allow <img> only (we're already using <img>)
  trailingSlash: true,            // GH Pages likes static trailing slashes
  basePath: isGithubPages ? `/${RelatorPro}` : '',
  assetPrefix: isGithubPages ? `/${RelatorPro}/` : '',
};
module.exports = nextConfig;