import { createFileRoute } from "@tanstack/react-router";
import { ContactPage } from "@/pages";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact VUERA" },
      { name: "description", content: "Questions about fit, orders or prescriptions? Talk to our opticians." },
      { property: "og:title", content: "Contact VUERA" },
      { property: "og:description", content: "Questions about fit, orders or prescriptions? Talk to our opticians." },
    ],
  }),
  component: ContactPage,
});
