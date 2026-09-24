import { createFileRoute } from "@tanstack/react-router";
import { WishlistPage } from "@/pages";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist | VUERA" },
      { name: "description", content: "Frames you have saved for later." },
      { property: "og:title", content: "Wishlist | VUERA" },
      { property: "og:description", content: "Frames you have saved for later." },
    ],
  }),
  component: WishlistPage,
});
