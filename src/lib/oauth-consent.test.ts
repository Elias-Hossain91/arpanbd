import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  decideOAuthAuthorization,
  loadOAuthAuthorization,
  type AuthorizationDetails,
  type OAuthMethods,
} from "./oauth-consent";

function methods(overrides: Partial<OAuthMethods> = {}): OAuthMethods {
  return {
    getAuthorizationDetails: async () => ({
      data: { client: { name: "Test assistant" }, scopes: ["openid", "email"] },
      error: null,
    }),
    approveAuthorization: async () => ({ data: { redirect_url: "https://client.invalid/return" }, error: null }),
    denyAuthorization: async () => ({ data: { redirect_to: "https://client.invalid/cancel" }, error: null }),
    ...overrides,
  };
}

describe("OAuth consent decisions", () => {
  it("rejects a missing authorization id", async () => {
    await assert.rejects(loadOAuthAuthorization(methods(), ""), /অনুমোদনের অনুরোধটি পাওয়া যায়নি/);
  });

  it("surfaces expired authorization requests and provider lookup failures", async () => {
    await assert.rejects(
      loadOAuthAuthorization(methods({ getAuthorizationDetails: async () => ({ data: null, error: null }) }), "expired"),
      /মেয়াদোত্তীর্ণ/,
    );
    await assert.rejects(
      loadOAuthAuthorization(methods({
        getAuthorizationDetails: async () => ({ data: null, error: { message: "provider unavailable" } }),
      }), "request-1"),
      /provider unavailable/,
    );
  });

  it("redirects an already-authorized request immediately", async () => {
    const details: AuthorizationDetails = { redirect_url: "https://client.invalid/return" };
    const result = await loadOAuthAuthorization(
      methods({ getAuthorizationDetails: async () => ({ data: details, error: null }) }),
      "request-2",
    );
    assert.equal(result.redirectTo, "https://client.invalid/return");
    assert.equal(result.details, null);
  });

  it("returns the provider redirect after approve and deny", async () => {
    assert.equal(
      await decideOAuthAuthorization(methods(), "request-3", true),
      "https://client.invalid/return",
    );
    assert.equal(
      await decideOAuthAuthorization(methods(), "request-4", false),
      "https://client.invalid/cancel",
    );
  });

  it("surfaces failed approve and deny actions", async () => {
    await assert.rejects(
      decideOAuthAuthorization(methods({
        approveAuthorization: async () => ({ data: null, error: { message: "approval failed" } }),
      }), "request-5", true),
      /approval failed/,
    );
    await assert.rejects(
      decideOAuthAuthorization(methods({
        denyAuthorization: async () => ({ data: null, error: { message: "denial failed" } }),
      }), "request-6", false),
      /denial failed/,
    );
  });
});