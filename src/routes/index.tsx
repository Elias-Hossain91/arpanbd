import { createFileRoute } from "@tanstack/react-router";
import { ArpanApp } from "@/components/arpan/ArpanApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "অর্পণ — ঢাকায় বিনামূল্যে দান ও সংগ্রহ" },
      {
        name: "description",
        content:
          "ঢাকায় প্রতিবেশীদের সাথে বিনামূল্যে জিনিস দিন ও সংগ্রহ করুন। অর্পণ একটি বাংলা কমিউনিটি শেয়ারিং অ্যাপ — দিন যা লাগবে না, নিন যা দরকার।",
      },
      { property: "og:title", content: "অর্পণ — ঢাকায় বিনামূল্যে দান ও সংগ্রহ" },
      {
        property: "og:description",
        content: "দিন যা লাগবে না · নিন যা দরকার · সবই বিনামূল্যে। ঢাকার প্রতিবেশীদের জন্য বাংলা কমিউনিটি শেয়ারিং অ্যাপ।",
      },
      { property: "og:url", content: "https://arpanbd.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://arpanbd.lovable.app/" }],
  }),
  component: Index,
});

function Index() {
  return <ArpanApp />;
}
