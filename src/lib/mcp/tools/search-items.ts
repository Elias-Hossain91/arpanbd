import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { ITEMS } from "@/data/arpan";

export default defineTool({
  name: "search_items",
  title: "Search items",
  description:
    "Full-text search across Arpan items — matches item name (Bengali/English), category, area, and giver notes.",
  inputSchema: {
    query: z.string().min(1).describe("Search text in Bengali or English."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ query }) => {
    const q = query.toLowerCase();
    const matches = ITEMS.filter((i) =>
      [i.bn, i.en, i.cat, i.area, i.giver, i.note].join(" ").toLowerCase().includes(q),
    );
    return {
      content: [{ type: "text", text: JSON.stringify(matches, null, 2) }],
      structuredContent: { items: matches, total: matches.length },
    };
  },
});
