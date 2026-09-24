import { createFileRoute } from "@tanstack/react-router";
import { AdminAttributesPage } from "@/pages";
import { AdminRoute } from "@/components/shared";

export const Route = createFileRoute("/admin/attributes")({
  head: () => ({
    meta: [{ title: "Attributes | VUERA Admin" }],
  }),
  component: () => (
    <AdminRoute>
      <AdminAttributesPage />
    </AdminRoute>
  ),
});
