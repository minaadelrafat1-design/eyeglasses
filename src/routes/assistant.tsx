import { createFileRoute } from "@tanstack/react-router";
import { AssistantPage } from "@/pages";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "AI Style Assistant | VUERA" },
      { name: "description", content: "Describe your face shape and style, and get personalised frame recommendations." },
      { property: "og:title", content: "AI Style Assistant | VUERA" },
      { property: "og:description", content: "Describe your face shape and style, and get personalised frame recommendations." },
    ],
  }),
  component: AssistantPage,
});
