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

  const supabaseUrl = values.AUTH_HOST ?? values.SUPABASE_AUTH_URL ?? ''
  const supabaseAnonKey =
    values.SUPABASE_ANON_KEY ?? values.SupabaseAnonKey ?? ''
  const supabaseJwksUrl = values.AUTH_JWKS_URL ?? ''
  const supabaseIssuer =
    values.JWT_ISSUER ?? values.AUTH_HOST ?? values.SUPABASE_AUTH_URL ?? ''
  const supabaseRedirectExtension =
    values.SUPABASE_EXTENSION_REDIRECT_URL ??
    values.SUPABASE_REDIRECT_URL_EXTENSION ??
    values.SUPABASE_EXTENSION_REDIRECT ??
    ''

  if (!supabaseUrl) {
    throw new Error(
      `AUTH_HOST (Supabase URL) missing in ${envFile}. Add AUTH_HOST=https://<project>.supabase.co`,
    )
  }

  if (!supabaseJwksUrl) {
    throw new Error(
      `AUTH_JWKS_URL missing in ${envFile}. Provide the Supabase JWKS endpoint`,
    )
  }

  if (!supabaseIssuer) {
    throw new Error(
      `JWT_ISSUER missing in ${envFile}. Set JWT_ISSUER to your Supabase auth issuer`,
    )
  }

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
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      jwksUrl: supabaseJwksUrl,
      issuer: supabaseIssuer,
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
