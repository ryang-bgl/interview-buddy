const DEFAULT_SERVER_ORIGIN = import.meta.env.VITE_SERVER_ORIGIN ?? 'http://localhost:8080'

async function request(path: string, init: RequestInit = {}): Promise<Response> {
  const url = `${DEFAULT_SERVER_ORIGIN}${path}`
  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(url, {
    credentials: 'include',
    ...init,
    headers,
  })
}

export async function checkSession(): Promise<boolean> {
  try {
    const response = await request('/api/current-principal', { method: 'GET' })
    if (response.ok) {
      return true
    }

    if (response.status === 401 || response.status === 403) {
      return false
    }

    throw new Error(`Unexpected session status: ${response.status}`)
  } catch (error) {
    console.warn('[interview-buddy] Failed to verify session', error)
    throw error
  }
}

interface LoginResponseBody {
  message?: string
}

export async function loginWithKey(apiKey: string): Promise<void> {
  const response = await request('/api/auth-by-api-key', {
    method: 'POST',
    headers: {
      "X-API-KEY": apiKey
    }
  })

  if (response.ok) {
    return
  }

  let errorMessage = 'Login failed'
  try {
    const body = (await response.json()) as LoginResponseBody
    if (body?.message) {
      errorMessage = body.message
    }
  } catch (error) {
    console.warn('[interview-buddy] Unable to parse login error response', error)
  }

  throw new Error(errorMessage)
}
