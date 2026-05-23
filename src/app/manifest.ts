import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Logos Royal",
    short_name: "Logos Royal",
    description: "Curated products across tech, fashion, beauty, home, and more.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f172a",
    icons: [
      { src: "/logos-royal-logo-v2.png", sizes: "any", type: "image/png" },
    ],
  };
}
