const postFiles = import.meta.glob('./posts/*.json', { eager: true });

export const blogPosts = Object.values(postFiles).map((mod) => mod.default || mod);
