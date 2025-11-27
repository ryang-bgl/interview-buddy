import { makeAutoObservable, runInAction } from 'mobx'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import {
  clearPendingAuthEmail,
  readPendingAuthEmail,
  storePendingAuthEmail,
} from '@/utils/authStorage'
import type { RootStore } from './RootStore'

type AuthViewState = 'checking' | 'enterEmail' | 'awaitingOtp' | 'authenticated'

export class LoginStore {
  private root: RootStore
  email = ''
  otp = ''
  viewState: AuthViewState = 'checking'
  error: string | null = null
  isSubmitting = false
  user: User | null = null

  constructor(root: RootStore) {
    this.root = root
    makeAutoObservable(this, { root: false }, { autoBind: true })
    void this.initialize()
  }

  get isAuthenticated() {
    return Boolean(this.user)
  }

  setEmail(value: string) {
    this.email = value
  }

  setOtp(value: string) {
    this.otp = value
  }

  async initialize() {
    this.viewState = 'checking'
    try {
      const { data } = await supabase.auth.getSession()
      const sessionUser = data.session?.user ?? null
      if (sessionUser) {
        runInAction(() => {
          this.user = sessionUser
          this.email = sessionUser.email ?? ''
          this.viewState = 'authenticated'
        })
        clearPendingAuthEmail()
        return
      }
      const pendingEmail = readPendingAuthEmail()
      runInAction(() => {
        if (pendingEmail) {
          this.email = pendingEmail
          this.viewState = 'awaitingOtp'
        } else {
          this.viewState = 'enterEmail'
        }
      })
    } catch (error) {
      console.warn('[leetstack] Failed to initialize auth', error)
      runInAction(() => {
        this.viewState = 'enterEmail'
        this.error = 'Unable to verify session'
      })
    }
  }

  async sendLoginCode() {
    const email = this.email.trim()
    if (!email) {
      this.error = 'Email is required'
      return
    }
    this.error = null
    this.isSubmitting = true
    try {
      await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      })
      storePendingAuthEmail(email)
      runInAction(() => {
        this.viewState = 'awaitingOtp'
        this.otp = ''
      })
    } catch (error) {
      console.warn('[leetstack] Failed to send OTP', error)
      runInAction(() => {
        this.error =
          error instanceof Error ? error.message : 'Unable to send login code'
        this.viewState = 'enterEmail'
      })
    } finally {
      runInAction(() => {
        this.isSubmitting = false
      })
    }
  }

  async verifyLoginCode() {
    const email = this.email.trim()
    const token = this.otp.trim()
    if (!email || !token) {
      this.error = 'Enter the 8 digit code from your email'
      return
    }
    this.error = null
    this.isSubmitting = true
    try {
      await supabase.auth.verifyOtp({ email, token, type: 'email' })
      const { data } = await supabase.auth.getSession()
      runInAction(() => {
        this.user = data.session?.user ?? null
        this.viewState = this.user ? 'authenticated' : 'enterEmail'
        this.otp = ''
      })
      clearPendingAuthEmail()
    } catch (error) {
      console.warn('[leetstack] Failed to verify OTP', error)
      runInAction(() => {
        this.error =
          error instanceof Error ? error.message : 'Invalid or expired code'
        this.viewState = 'awaitingOtp'
      })
    } finally {
      runInAction(() => {
        this.isSubmitting = false
      })
    }
  }

  async signOut() {
    await supabase.auth.signOut()
    runInAction(() => {
      this.user = null
      this.viewState = 'enterEmail'
    })
  }

  resetPendingFlow() {
    clearPendingAuthEmail()
    this.otp = ''
    this.viewState = 'enterEmail'
  }
}
