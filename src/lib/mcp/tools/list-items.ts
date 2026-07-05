import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { ITEMS, CATS } from "@/data/arpan";

export default defineTool({
  name: "list_items",
  title: "List available items",
  description:
    "List items currently offered on Arpan (a Bengali community giving app). Optionally filter by category.",
  inputSchema: {
    category: z
      .string()
      .optional()
      .describe(
        `Optional Bengali category name. One of: ${CATS.map((c) => c.bn).join(", ")}.`,
      ),
    limit: z.number().int().min(1).max(50).optional().describe("Max items to return (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ category, limit }) => {
    const filtered = category && category !== "সব"
      ? ITEMS.filter((i) => i.cat === category)
      : ITEMS;
    const items = filtered.slice(0, limit ?? 20);
    return {
      content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
      structuredContent: { items, total: filtered.length },
    };
  },
});
