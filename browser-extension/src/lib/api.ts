import config from '@/config'

async function request(path: string, init: RequestInit = {}): Promise<Response> {
  const url = `${config.serverOrigin}${path}`
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

export interface UserPrincipal {
  id: string
  email: string | null
  firstName: string | null
  lastName: string | null
  leetstackUsername: string | null
  createdDate: string | null
  lastUpdatedDate: string | null
}

export async function checkSession(): Promise<UserPrincipal | null> {
  try {
    const response = await request('/api/current-principal', { method: 'GET' })
    if (response.ok) {
      return (await response.json()) as UserPrincipal
    }

    if (response.status === 401 || response.status === 403) {
      return null
    }

    throw new Error(`Unexpected session status: ${response.status}`)
  } catch (error) {
    console.warn('[leetstack] Failed to verify session', error)
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
    console.warn('[leetstack] Unable to parse login error response', error)
  }

  throw new Error(errorMessage)
}

export interface CreateUserDsaQuestionRequest {
  userId: string
  title: string
  titleSlug: string
  difficulty: string
  isPaidOnly: boolean
  description: string
  solution?: string | null
  idealSolutionCode?: string | null
  note?: string | null
  exampleTestcases?: string | null
}

export interface UserDsaQuestionResponse {
  id: number
  userId: string
  title: string
  titleSlug: string
  difficulty: string
  isPaidOnly: boolean
  description: string
  solution: string | null
  idealSolutionCode: string | null
  note: string | null
  exampleTestcases: string | null
}

export async function saveUserDsaQuestion(payload: CreateUserDsaQuestionRequest): Promise<UserDsaQuestionResponse> {
  const response = await request('/api/dsa/questions', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  if (response.ok) {
    return (await response.json()) as UserDsaQuestionResponse
  }

  let message = 'Failed to save problem'
  try {
    const body = await response.json()
    if (body && typeof body.message === 'string') {
      message = body.message
    }
  } catch (error) {
    console.warn('[leetstack] Unable to parse save error response', error)
  }

  throw new Error(message)
}
