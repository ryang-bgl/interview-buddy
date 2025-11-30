const config: WebAppConfig = __APP_CONFIG__;

if (!config.supabase.url || !config.supabase.anonKey) {
  console.warn(
    "Supabase settings missing. Check configs/<env>.env for SUPABASE values"
  );
}

if (!config.serverOrigin) {
  console.warn(
    "Server origin missing. Update ApiHost or API_GATEWAY_ORIGIN in configs/<env>.env"
  );
}

export default config;
