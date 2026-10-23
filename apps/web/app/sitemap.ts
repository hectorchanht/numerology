import type { MetadataRoute } from "next";
import { SITE_BASE, SITE_ROUTES } from "@/lib/yijingSite";

export const runtime = "edge";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return SITE_ROUTES.map((r) => ({
    url: `${SITE_BASE}${r.path}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: r.priority,
  }));
}
