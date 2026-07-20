import { ref } from 'vue'

const pendingRestore = ref(null)

export function useRestoreData() {
  function setRestoreData(data: any | null) {
    pendingRestore.value = data
  }

  function consumeRestoreData() {
    const data = pendingRestore.value
    pendingRestore.value = null
    return data
  }

  return { pendingRestore, setRestoreData, consumeRestoreData }
}
