import { createFileRoute } from "@tanstack/react-router";
import { ShopPage } from "@/pages";

export const Route = createFileRoute("/shop/$category")({
  head: () => ({
    meta: [
      { title: "Shop Frames by Category | VUERA" },
      { name: "description", content: "Browse sunglasses, optical and blue-light frames with advanced filtering." },
      { property: "og:title", content: "Shop Frames by Category | VUERA" },
      { property: "og:description", content: "Browse sunglasses, optical and blue-light frames with advanced filtering." },
    ],
  }),
  component: ShopPage,
});
