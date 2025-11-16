import config from '@/config'
import { supabase } from '@/lib/supabaseClient'

async function getAuthHeader(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) {
      return null
    }
    console.debug('[leetstack] Sending Supabase access token to /api/users/me:', token)
    return `Bearer ${token}`
  } catch (error) {
    console.warn('[leetstack] Failed to fetch Supabase session token', error)
    return null
  }
}

async function request(path: string, init: RequestInit = {}): Promise<Response> {
  const url = `${config.serverOrigin}${path}`
  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (!headers.has('Authorization')) {
    const authHeader = await getAuthHeader()
    if (authHeader) {
      headers.set('Authorization', authHeader)
    }
  }

  return fetch(url, {
    credentials: 'omit',
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
    const response = await request('/api/users/me', { method: 'GET' })
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

export interface CreateUserDsaQuestionRequest {
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
