/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // Root — Framer homepage
      { source: "/", destination: "/index.html" },

      // Top-level Framer pages
      { source: "/team", destination: "/team.html" },
      { source: "/contact", destination: "/contact/index.html" },
      { source: "/project-showcase", destination: "/project-showcase/index.html" },
      { source: "/blog", destination: "/blog/index.html" },
      { source: "/blog/post", destination: "/blog/post.html" },

      // Project showcase sub-pages
      { source: "/project-showcase/artwist-salon", destination: "/project-showcase/artwist-salon/index.html" },
      { source: "/project-showcase/bnb", destination: "/project-showcase/bnb/index.html" },
      { source: "/project-showcase/coco-meltdown", destination: "/project-showcase/coco-meltdown/index.html" },
      { source: "/project-showcase/fair-fly", destination: "/project-showcase/fair-fly/index.html" },
      { source: "/project-showcase/flutecase", destination: "/project-showcase/flutecase/index.html" },
      { source: "/project-showcase/koan", destination: "/project-showcase/koan/index.html" },
      { source: "/project-showcase/mak", destination: "/project-showcase/mak/index.html" },
      { source: "/project-showcase/nord-terra", destination: "/project-showcase/nord-terra/index.html" },
      { source: "/project-showcase/pipe-nova", destination: "/project-showcase/pipe-nova/index.html" },
      { source: "/project-showcase/seiko-hyper", destination: "/project-showcase/seiko-hyper/index.html" },
    ];
  },
};

export default nextConfig;
