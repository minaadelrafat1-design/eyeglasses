import { createFileRoute } from "@tanstack/react-router";
import { AdminOrderDetailPage } from "@/pages";
import { AdminRoute } from "@/components/shared";

export const Route = createFileRoute("/admin/orders/$orderId")({
  head: () => ({
    meta: [{ title: "Order Details | VUERA Admin" }],
  }),
  component: () => (
    <AdminRoute>
      <AdminOrderDetailPage />
    </AdminRoute>
  ),
});
