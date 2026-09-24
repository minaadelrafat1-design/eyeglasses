import { createFileRoute } from "@tanstack/react-router";
import { SearchPage } from "@/pages";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search Frames | VUERA" },
      { name: "description", content: "Search the VUERA eyewear catalogue by name, brand or style." },
      { property: "og:title", content: "Search Frames | VUERA" },
      { property: "og:description", content: "Search the VUERA eyewear catalogue by name, brand or style." },
    ],
  }),
  component: SearchPage,
});
