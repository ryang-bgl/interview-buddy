import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')

function parseEnvFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const result = {}
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      return
    }
    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex === -1) {
      return
    }
    const key = trimmed.slice(0, separatorIndex).trim()
    const value = trimmed.slice(separatorIndex + 1).trim()
    if (key) {
      result[key] = value
    }
  })
  return result
}

function resolveEnvPath(stageOrPath = 'dev') {
  if (stageOrPath.endsWith('.env')) {
    return path.isAbsolute(stageOrPath)
      ? stageOrPath
      : path.resolve(repoRoot, stageOrPath)
  }
  return path.resolve(repoRoot, 'configs', `${stageOrPath}.env`)
}

export function loadProjectEnv(options = {}) {
  const stageReference = options.stage ?? process.env.LEETSTACK_STAGE ?? 'dev'
  const envFile = resolveEnvPath(options.file ?? stageReference)
  const values = parseEnvFile(envFile)

  const supabaseProjectRef = values.SupabaseProjectRef ?? ''
  const supabaseUrl =
    values.SUPABASE_URL ??
    values.SupabaseUrl ??
    (supabaseProjectRef ? `https://${supabaseProjectRef}.supabase.co` : '')
  const supabaseAnonKey =
    values.SUPABASE_ANON_KEY ?? values.SupabaseAnonKey ?? ''
  const supabaseRedirectExtension =
    values.SUPABASE_EXTENSION_REDIRECT_URL ??
    values.SUPABASE_REDIRECT_URL_EXTENSION ??
    values.SUPABASE_EXTENSION_REDIRECT ??
    ''

  const apiHost = values.ApiHost ?? ''
  const apiOrigin =
    values.API_SERVER_ORIGIN ??
    values.ApiServerOrigin ??
    values.API_GATEWAY_ORIGIN ??
    values.ApiGatewayOrigin ??
    (apiHost ? `https://${apiHost}` : '')

  return {
    stage: stageReference,
    file: envFile,
    values,
    supabase: {
      projectRef: supabaseProjectRef,
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      jwtAudience: values.SupabaseJwtAudience ?? 'authenticated',
      redirectExtension: supabaseRedirectExtension,
    },
    api: {
      host: apiHost,
      origin: apiOrigin,
      gatewayOrigin:
        values.API_GATEWAY_ORIGIN ?? values.ApiGatewayOrigin ?? '',
    },
    deepseekApiKey: values.DeepseekApiKey ?? '',
  }
}
