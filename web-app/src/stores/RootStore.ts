import { LoginStore } from './LoginStore'
import { NotebookStore } from '@/features/notebook/NotebookStore'
import { NoteDetailStore } from '@/features/notes/NoteDetailStore'

export class RootStore {
  loginStore: LoginStore
  notebookStore: NotebookStore
  noteDetailStore: NoteDetailStore

  constructor() {
    this.loginStore = new LoginStore()
    this.notebookStore = new NotebookStore()
    this.noteDetailStore = new NoteDetailStore()
  }
}
