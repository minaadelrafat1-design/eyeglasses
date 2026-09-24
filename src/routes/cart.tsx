import { createFileRoute } from "@tanstack/react-router";
import { CartPage } from "@/pages";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Bag | VUERA" },
      { name: "description", content: "Review the frames in your bag before checkout." },
      { property: "og:title", content: "Your Bag | VUERA" },
      { property: "og:description", content: "Review the frames in your bag before checkout." },
    ],
  }),
  component: CartPage,
});
