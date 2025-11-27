const config = {
  supabase: {
    url:
      import.meta.env.VITE_SUPABASE_URL ??
      "https://dytenzvmlucodjjxlhyk.supabase.co",
    anonKey:
      import.meta.env.VITE_SUPABASE_ANON_KEY ??
      "sb_publishable_4gaw9ZYRl4YuxBnKoabqSg_zCe8N-s0",
  },
  serverOrigin:
    import.meta.env.VITE_SERVER_ORIGIN ??
    "https://w2ikvgnue9.execute-api.us-east-1.amazonaws.com",
};

if (!config.supabase.url || !config.supabase.anonKey) {
  console.warn(
    "Supabase URL and anon key must be provided via VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
  );
}

if (!config.serverOrigin) {
  console.warn(
    "Server origin missing. Set VITE_SERVER_ORIGIN to your API Gateway / server URL"
  );
}

export default config;
