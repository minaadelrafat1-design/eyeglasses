import { createFileRoute } from "@tanstack/react-router";
import { ShopPage } from "@/pages";

export const Route = createFileRoute("/shop/")({
  head: () => ({
    meta: [
      { title: "Shop All Frames | VUERA" },
      { name: "description", content: "Filter designer frames by shape, material, colour, brand and price to find your perfect fit." },
      { property: "og:title", content: "Shop All Frames | VUERA" },
      { property: "og:description", content: "Filter designer frames by shape, material, colour, brand and price to find your perfect fit." },
    ],
  }),
  component: ShopPage,
});
