import { createFileRoute } from "@tanstack/react-router";
import { AdminProductsPage } from "@/pages";
import { AdminRoute } from "@/components/shared";

export const Route = createFileRoute("/admin/products/")({
  head: () => ({
    meta: [{ title: "Products | VUERA Admin" }],
  }),
  component: () => (
    <AdminRoute>
      <AdminProductsPage />
    </AdminRoute>
  ),
});
