function createMockQueryBuilder(): any {
  const result = { data: [] as any[], error: null };

  const builder: any = {
    single: async () => ({ data: null, error: null }),
    maybeSingle: async () => ({ data: null, error: null }),
    then: (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject),
  };

  return new Proxy(builder, {
    get(target, prop) {
      if (prop in target) {
        return target[prop as keyof typeof target];
      }

      return (..._args: any[]) => target;
    },
  });
}

export function createMockSupabaseClient() {
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async () => ({
        data: { user: null, session: null },
        error: { message: "Supabase environment variables are not configured." },
      }),
      signUp: async () => ({
        data: { user: null, session: null },
        error: { message: "Supabase environment variables are not configured." },
      }),
      signOut: async () => ({ error: null }),
      resetPasswordForEmail: async () => ({
        data: null,
        error: { message: "Supabase environment variables are not configured." },
      }),
      updateUser: async () => ({
        data: null,
        error: { message: "Supabase environment variables are not configured." },
      }),
      exchangeCodeForSession: async () => ({
        data: null,
        error: { message: "Supabase environment variables are not configured." },
      }),
      onAuthStateChange: () => ({
        data: {
          subscription: {
            unsubscribe() {},
          },
        },
      }),
    },
    from: () => createMockQueryBuilder(),
    rpc: async () => ({ data: null, error: null }),
  };
}
