const config = {
  supabase: {
    url:
      import.meta.env.VITE_SUPABASE_URL ??
      "https://dytenzvmlucodjjxlhyk.supabase.co",
    anonKey:
      import.meta.env.VITE_SUPABASE_ANON_KEY ??
      "sb_publishable_4gaw9ZYRl4YuxBnKoabqSg_zCe8N-s0",
  },
};

if (!config.supabase.url || !config.supabase.anonKey) {
  console.warn(
    "Supabase URL and anon key must be provided via VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
  );
}

export default config;
