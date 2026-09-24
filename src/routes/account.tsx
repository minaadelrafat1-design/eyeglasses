import { createFileRoute } from "@tanstack/react-router";
import { AccountPage } from "@/pages";
import { ProtectedRoute } from "@/components/shared";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Your Account | VUERA" },
      { name: "description", content: "Manage your VUERA orders, addresses and preferences." },
      { property: "og:title", content: "Your Account | VUERA" },
      {
        property: "og:description",
        content: "Manage your VUERA orders, addresses and preferences.",
      },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <AccountPage />
    </ProtectedRoute>
  ),
});
