import { LoginStore } from './LoginStore'
import { NotebookStore } from '@/features/notebook/NotebookStore'

export class RootStore {
  loginStore: LoginStore
  notebookStore: NotebookStore

  constructor() {
    this.loginStore = new LoginStore()
    this.notebookStore = new NotebookStore()
  }
}
