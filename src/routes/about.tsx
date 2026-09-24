import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "@/pages";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About VUERA | Designer Eyewear" },
      { name: "description", content: "Our craft, our materials and the people behind VUERA eyewear." },
      { property: "og:title", content: "About VUERA | Designer Eyewear" },
      { property: "og:description", content: "Our craft, our materials and the people behind VUERA eyewear." },
    ],
  }),
  component: AboutPage,
});
