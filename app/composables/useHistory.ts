
import { getStorageData } from '@/composables/useStorage'

const history = getStorageData('chat-history', [])

export function useHistory() {
  function addHistory(userMsg, assistantMsg) {
    history.value.push(
      { role: 'user', content: userMsg },
      { role: 'assistant', content: assistantMsg },
    )
  }

  return { history, addHistory }
}
