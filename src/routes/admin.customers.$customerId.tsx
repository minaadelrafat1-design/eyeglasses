import { createFileRoute } from "@tanstack/react-router";
import { AdminCustomerDetailPage } from "@/pages";
import { AdminRoute } from "@/components/shared";

export const Route = createFileRoute("/admin/customers/$customerId")({
  head: () => ({
    meta: [{ title: "Customer Details | VUERA Admin" }],
  }),
  component: () => (
    <AdminRoute>
      <AdminCustomerDetailPage />
    </AdminRoute>
  ),
});
