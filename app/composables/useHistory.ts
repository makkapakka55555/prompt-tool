

import { getStorageData } from '@/composables/useStorage'

const history = getStorageData('chat-history', [])

export function useHistory() {
  function addHistory(userMsg, assistantMsg, msgCategory) {
    history.value.push(
      { role: 'user', content: userMsg, category: msgCategory },
      { role: 'assistant', content: assistantMsg, category: msgCategory },
    )
  }

  function removeHistory(index) {
    history.value.splice(index, 1)
  }

  return { history, addHistory, removeHistory }
}
