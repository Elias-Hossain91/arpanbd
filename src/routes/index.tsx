import { createFileRoute } from "@tanstack/react-router";
import { ArpanApp } from "@/components/arpan/ArpanApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "অর্পণ · Arpan — মানুষের জন্য মানুষ" },
      {
        name: "description",
        content:
          "Arpan (অর্পণ) is a Bengali community sharing app — give what you no longer need, take what you do. Free, neighbourly, kind.",
      },
      { property: "og:title", content: "অর্পণ · Arpan" },
      {
        property: "og:description",
        content: "দিন যা লাগবে না · নিন যা দরকার · সবই বিনামূল্যে",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return <ArpanApp />;
}
