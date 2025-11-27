import { LoginStore } from './LoginStore'

export class RootStore {
  loginStore: LoginStore

  constructor() {
    this.loginStore = new LoginStore(this)
  }
}
