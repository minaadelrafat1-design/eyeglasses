import { createFileRoute } from "@tanstack/react-router";
import { ComparePage } from "@/pages";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare Frames | VUERA" },
      { name: "description", content: "Put up to four frames side by side and compare price, shape, material and fit." },
      { property: "og:title", content: "Compare Frames | VUERA" },
      { property: "og:description", content: "Put up to four frames side by side and compare price, shape, material and fit." },
    ],
  }),
  component: ComparePage,
});
