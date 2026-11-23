import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listItemsTool from "./tools/list-items";
import searchItemsTool from "./tools/search-items";
import listCategoriesTool from "./tools/list-categories";

const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "app-refined",
  title: "App Refined",
  version: "0.1.0",
  instructions:
    "Tools for Arpan, a Bengali community giving app where people share items they no longer need. Use `list_categories` to discover categories, `list_items` to browse listings (optionally by category), and `search_items` for keyword search across items in Bengali or English.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
    requireOAuthClientClaim: true,
  }),
  tools: [listItemsTool, searchItemsTool, listCategoriesTool],
});
