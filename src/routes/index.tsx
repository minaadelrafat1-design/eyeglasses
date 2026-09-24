import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/pages";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VUERA — Designer Eyewear, Fitted by AI" },
      { name: "description", content: "Shop premium optical frames and sunglasses with virtual try-on, side-by-side frame comparison and AI fit guidance." },
      { property: "og:title", content: "VUERA — Designer Eyewear, Fitted by AI" },
      { property: "og:description", content: "Shop premium optical frames and sunglasses with virtual try-on, side-by-side frame comparison and AI fit guidance." },
    ],
  }),
  component: HomePage,
});
