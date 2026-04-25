import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Test Kitchen OS",
    short_name: "Test Kitchen",
    description: "Turn your ingredients into healthy, delicious recipes",
    start_url: "/",
    display: "standalone",
    background_color: "#FDFAF5",
    theme_color: "#C4622D",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    categories: ["food", "lifestyle", "health"],
  };
}
