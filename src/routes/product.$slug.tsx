import { createFileRoute } from "@tanstack/react-router";
import { ProductDetailPage } from "@/pages";

export const Route = createFileRoute("/product/$slug")({
  head: () => ({
    meta: [
      { title: "Frame Details | VUERA" },
      { name: "description", content: "Explore frame measurements, materials, colourways and similar styles." },
      { property: "og:title", content: "Frame Details | VUERA" },
      { property: "og:description", content: "Explore frame measurements, materials, colourways and similar styles." },
    ],
  }),
  component: ProductDetailPage,
});
