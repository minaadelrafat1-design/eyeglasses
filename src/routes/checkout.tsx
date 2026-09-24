import { createFileRoute } from "@tanstack/react-router";
import { CheckoutPage } from "@/pages";
import { ProtectedRoute } from "@/components/shared";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout | VUERA" },
      { name: "description", content: "Complete your VUERA order securely." },
      { property: "og:title", content: "Checkout | VUERA" },
      { property: "og:description", content: "Complete your VUERA order securely." },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <CheckoutPage />
    </ProtectedRoute>
  ),
});
