import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboardPage } from "@/pages";
import { AdminRoute } from "@/components/shared";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [{ title: "Admin Dashboard | VUERA" }],
  }),
  component: () => (
    <AdminRoute>
      <AdminDashboardPage />
    </AdminRoute>
  ),
});
