import { createFileRoute } from "@tanstack/react-router";
import { SignInPage } from "@/pages";

export const Route = createFileRoute("/signin")({
  head: () => ({
    meta: [
      { title: "Sign In | VUERA" },
      { name: "description", content: "Sign in to your VUERA account." },
      { property: "og:title", content: "Sign In | VUERA" },
      { property: "og:description", content: "Sign in to your VUERA account." },
    ],
  }),
  component: SignInPage,
});
