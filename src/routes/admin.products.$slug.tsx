import { createFileRoute } from "@tanstack/react-router";
import { AdminProductFormPage } from "@/pages";
import { AdminRoute } from "@/components/shared";

export const Route = createFileRoute("/admin/products/$slug")({
  head: () => ({
    meta: [{ title: "Edit Product | VUERA Admin" }],
  }),
  component: () => (
    <AdminRoute>
      <AdminProductFormPage />
    </AdminRoute>
  ),
});
