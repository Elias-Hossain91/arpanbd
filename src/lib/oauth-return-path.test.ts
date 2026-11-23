import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { oauthReturnPath } from "./oauth-return-path";

describe("oauthReturnPath", () => {
  it("preserves local paths, query parameters, and fragments", () => {
    assert.equal(oauthReturnPath("/items?category=books#latest"), "/items?category=books#latest");
  });

  it("rejects network paths and backslash redirects", () => {
    assert.equal(oauthReturnPath("//outside.invalid/path"), "/");
    assert.equal(oauthReturnPath("/\\outside.invalid/path"), "/");
  });

  it("rejects control characters and non-local values", () => {
    assert.equal(oauthReturnPath(`/items\u0001hidden`), "/");
    assert.equal(oauthReturnPath("https://outside.invalid/path"), "/");
  });
});