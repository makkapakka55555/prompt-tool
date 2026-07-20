
import { getStorageData } from '@/composables/useStorage'

const history = getStorageData('chat-history', [])

export function useHistory() {
  function addHistory(userMsg, assistantMsg) {
    history.value.push(
      { role: 'user', content: userMsg },
      { role: 'assistant', content: assistantMsg },
    )
  }

  function removeHistory(index) {
    history.value.splice(index, 1)
  }

  return { history, addHistory, removeHistory }
}
