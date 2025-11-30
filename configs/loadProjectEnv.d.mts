export type LoadedProjectEnv = {
  stage: string
  file: string
  values: Record<string, string>
  supabase: {
    url: string
    anonKey: string
    jwksUrl: string
    issuer: string
    jwtAudience: string
    redirectExtension: string
  }
  api: {
    host: string
    origin: string
    gatewayOrigin: string
  }
  deepseekApiKey: string
}

export type LoadProjectEnvOptions = {
  stage?: string
  file?: string
}

export function loadProjectEnv(options?: LoadProjectEnvOptions): LoadedProjectEnv
