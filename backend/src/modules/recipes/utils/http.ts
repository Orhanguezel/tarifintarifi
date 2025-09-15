import type { Response } from "express";

export const setPublicCache = (res: Response) => {
  const maxAge = Number(process.env.RECIPES_PUBLIC_CACHE_MAX_AGE || 60);
  const sMaxAge = Number(process.env.RECIPES_PUBLIC_S_MAXAGE || 300);
  const swr = Number(process.env.RECIPES_PUBLIC_STALE_WHILE_REVALIDATE || 600);
  res.setHeader(
    "Cache-Control",
    `public, max-age=${maxAge}, s-maxage=${sMaxAge}, stale-while-revalidate=${swr}`
  );
};
