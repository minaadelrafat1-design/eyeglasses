import { createFileRoute } from "@tanstack/react-router";
import { AdminOrdersPage } from "@/pages";
import { AdminRoute } from "@/components/shared";

export const Route = createFileRoute("/admin/orders/")({
  head: () => ({
    meta: [{ title: "Orders | VUERA Admin" }],
  }),
  component: () => (
    <AdminRoute>
      <AdminOrdersPage />
    </AdminRoute>
  ),
});
