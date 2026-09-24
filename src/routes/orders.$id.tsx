import { createFileRoute } from "@tanstack/react-router";
import { OrderDetailPage } from "@/pages";
import { ProtectedRoute } from "@/components/shared";

export const Route = createFileRoute("/orders/$id")({
  head: () => ({
    meta: [
      { title: "Order Details | VUERA" },
      { name: "description", content: "Track the status of your VUERA order." },
      { property: "og:title", content: "Order Details | VUERA" },
      { property: "og:description", content: "Track the status of your VUERA order." },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <OrderDetailPage />
    </ProtectedRoute>
  ),
});
