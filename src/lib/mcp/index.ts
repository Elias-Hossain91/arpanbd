import { defineMcp } from "@lovable.dev/mcp-js";
import listItemsTool from "./tools/list-items";
import searchItemsTool from "./tools/search-items";
import listCategoriesTool from "./tools/list-categories";

export default defineMcp({
  name: "arpan-mcp",
  title: "Arpan — Community Sharing",
  version: "0.1.0",
  instructions:
    "Tools for Arpan, a Bengali community giving app where people share items they no longer need. Use `list_categories` to discover categories, `list_items` to browse listings (optionally by category), and `search_items` for keyword search across items in Bengali or English.",
  tools: [listItemsTool, searchItemsTool, listCategoriesTool],
});
