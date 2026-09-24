import { createFileRoute } from "@tanstack/react-router";
import { AdminProductFormPage } from "@/pages";
import { AdminRoute } from "@/components/shared";

export const Route = createFileRoute("/admin/products/new")({
  head: () => ({
    meta: [{ title: "New Product | VUERA Admin" }],
  }),
  component: () => (
    <AdminRoute>
      <AdminProductFormPage />
    </AdminRoute>
  ),
});
