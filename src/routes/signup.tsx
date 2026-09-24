import { createFileRoute } from "@tanstack/react-router";
import { SignUpPage } from "@/pages";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create Account | VUERA" },
      { name: "description", content: "Create a VUERA account to save frames and track orders." },
      { property: "og:title", content: "Create Account | VUERA" },
      { property: "og:description", content: "Create a VUERA account to save frames and track orders." },
    ],
  }),
  component: SignUpPage,
});
