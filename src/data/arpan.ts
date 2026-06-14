export type ArpanItem = {
  id: number;
  bn: string;
  en: string;
  cat: string;
  emoji: string;
  tile: "marigold" | "leaf" | "paper";
  area: string;
  cond: string;
  giver: string;
  note: string;
  postedAgo: string;
};

export const ITEMS: ArpanItem[] = [
  { id: 1, bn: "বাচ্চাদের খাওয়ানোর চেয়ার", en: "Baby feeding chair", cat: "শিশু", emoji: "🪑", tile: "marigold", area: "ধানমন্ডি, ঢাকা", cond: "ভালো", giver: "নাসরিন আক্তার", note: "আমার বাচ্চা বড় হয়ে গেছে, চেয়ারটা আর লাগছে না। যার দরকার নিয়ে যান।", postedAgo: "২ ঘণ্টা আগে" },
  { id: 2, bn: "হাসপাতালের বেড", en: "Hospital bed", cat: "চিকিৎসা", emoji: "🛏️", tile: "leaf", area: "আগ্রাবাদ, চট্টগ্রাম", cond: "মোটামুটি", giver: "ডা. রফিকুল ইসলাম", note: "দীর্ঘ চিকিৎসার পর আমার বাবা সুস্থ। বেডটা এখন অন্য কোনো রোগীর কাজে লাগুক।", postedAgo: "গতকাল" },
  { id: 3, bn: "হুইলচেয়ার", en: "Wheelchair", cat: "চিকিৎসা", emoji: "♿", tile: "leaf", area: "জিন্দাবাজার, সিলেট", cond: "ভালো", giver: "তানভীর হাসান", note: "অপারেশনের পর আর লাগছে না। চলাচল একদম মসৃণ।", postedAgo: "৩ দিন আগে" },
  { id: 4, bn: "HSC-এর সব বই", en: "HSC textbooks", cat: "বই", emoji: "📚", tile: "marigold", area: "মিরপুর, ঢাকা", cond: "ভালো", giver: "সাদিয়া রহমান", note: "পরীক্ষা শেষ। বইগুলো যত্নে রাখা, ছোট ভাই-বোনদের কাজে আসবে।", postedAgo: "৫ ঘণ্টা আগে" },
  { id: 5, bn: "শীতের কম্বল (৩টি)", en: "Winter blankets", cat: "পোশাক", emoji: "🧣", tile: "marigold", area: "শালবাগান, রাজশাহী", cond: "ভালো", giver: "মোঃ কামাল", note: "পরিষ্কার ও গরম। শীতে কারও উপকারে আসুক।", postedAgo: "৪ দিন আগে" },
  { id: 6, bn: "সেলাই মেশিন", en: "Sewing machine", cat: "গৃহস্থালি", emoji: "🧵", tile: "leaf", area: "দৌলতপুর, খুলনা", cond: "পুরনো কিন্তু সচল", giver: "রোকেয়া বেগম", note: "চালু আছে। কেউ আয়ের পথ হিসেবে নিতে পারেন।", postedAgo: "১ সপ্তাহ আগে" },
  { id: 7, bn: "শিশুদের খেলনা বাক্স", en: "Box of children's toys", cat: "শিশু", emoji: "🧸", tile: "marigold", area: "বনশ্রী, ঢাকা", cond: "ভালো", giver: "ফারহানা ইয়াসমিন", note: "মেয়ে বড় হয়ে গেছে। ছোটদের আনন্দ দিক।", postedAgo: "আজ" },
  { id: 8, bn: "কাঠের পড়ার টেবিল", en: "Wooden study table", cat: "আসবাব", emoji: "🪵", tile: "paper", area: "চকবাজার, চট্টগ্রাম", cond: "মোটামুটি", giver: "ইমরান চৌধুরী", note: "বাসা বদলাচ্ছি, নিয়ে যেতে পারছি না। শক্তপোক্ত আছে।", postedAgo: "২ দিন আগে" },
];

export const CATS = [
  { bn: "সব", emoji: "✨" },
  { bn: "শিশু", emoji: "🍼" },
  { bn: "চিকিৎসা", emoji: "🏥" },
  { bn: "আসবাব", emoji: "🪑" },
  { bn: "পোশাক", emoji: "👕" },
  { bn: "বই", emoji: "📚" },
  { bn: "গৃহস্থালি", emoji: "🏠" },
];

export const tileBg = (t: ArpanItem["tile"]) =>
  t === "marigold" ? "bg-marigold-soft" : t === "leaf" ? "bg-leaf-soft" : "bg-paper-deep";
