import { createFileRoute } from "@tanstack/react-router";
import { AdminCustomersPage } from "@/pages";
import { AdminRoute } from "@/components/shared";

export const Route = createFileRoute("/admin/customers/")({
  head: () => ({
    meta: [{ title: "Customers | VUERA Admin" }],
  }),
  component: () => (
    <AdminRoute>
      <AdminCustomersPage />
    </AdminRoute>
  ),
});
