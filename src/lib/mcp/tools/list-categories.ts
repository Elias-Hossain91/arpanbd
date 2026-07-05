import { defineTool } from "@lovable.dev/mcp-js";
import { CATS } from "@/data/arpan";

export default defineTool({
  name: "list_categories",
  title: "List categories",
  description: "List all item categories available on Arpan (Bengali names with emojis).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [{ type: "text", text: JSON.stringify(CATS, null, 2) }],
    structuredContent: { categories: CATS },
  }),
});
