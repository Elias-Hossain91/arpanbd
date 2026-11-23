export type OAuthRedirect = {
  redirect_url?: string | null;
  redirect_to?: string | null;
};

export type AuthorizationDetails = OAuthRedirect & {
  client?: {
    name?: string | null;
    redirect_uri?: string | null;
  } | null;
  scope?: string | string[] | null;
  scopes?: string[] | null;
  requested_scopes?: string[] | null;
};

export type OAuthMethods = {
  getAuthorizationDetails: (authorizationId: string) => Promise<{
    data: AuthorizationDetails | null;
    error: { message: string } | null;
  }>;
  approveAuthorization: (authorizationId: string) => Promise<{
    data: OAuthRedirect | null;
    error: { message: string } | null;
  }>;
  denyAuthorization: (authorizationId: string) => Promise<{
    data: OAuthRedirect | null;
    error: { message: string } | null;
  }>;
};

export async function loadOAuthAuthorization(methods: OAuthMethods, authorizationId: string) {
  if (!authorizationId) throw new Error("অনুমোদনের অনুরোধটি পাওয়া যায়নি।");
  const { data, error } = await methods.getAuthorizationDetails(authorizationId);
  if (error) throw new Error(error.message);
  if (!data) throw new Error("অনুমোদনের অনুরোধটি মেয়াদোত্তীর্ণ বা অকার্যকর।");

  const immediateRedirect = data.redirect_url ?? data.redirect_to;
  if (immediateRedirect && !data.client) {
    return { details: null, redirectTo: immediateRedirect };
  }
  return { details: data, redirectTo: null };
}

export async function decideOAuthAuthorization(
  methods: OAuthMethods,
  authorizationId: string,
  approve: boolean,
): Promise<string> {
  const { data, error } = approve
    ? await methods.approveAuthorization(authorizationId)
    : await methods.denyAuthorization(authorizationId);
  if (error) throw new Error(error.message);
  const target = data?.redirect_url ?? data?.redirect_to;
  if (!target) throw new Error("অনুমোদন সার্ভার ফেরত যাওয়ার ঠিকানা দেয়নি।");
  return target;
}