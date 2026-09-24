import { createFileRoute } from "@tanstack/react-router";
import { TryOnPage } from "@/pages";

export const Route = createFileRoute("/try-on")({
  head: () => ({
    meta: [
      { title: "Virtual Try-On | VUERA" },
      { name: "description", content: "See how any frame looks on your face with VUERA virtual try-on." },
      { property: "og:title", content: "Virtual Try-On | VUERA" },
      { property: "og:description", content: "See how any frame looks on your face with VUERA virtual try-on." },
    ],
  }),
  component: TryOnPage,
});
