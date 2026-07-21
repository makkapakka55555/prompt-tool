import { ref } from 'vue'

const pendingRestore = ref(null)
const resetCounter = ref(0)

export function useRestoreData() {
  function setRestoreData(data: any | null) {
    pendingRestore.value = data
  }

  function consumeRestoreData() {
    const data = pendingRestore.value
    pendingRestore.value = null
    return data
  }

  function triggerReset() {
    resetCounter.value++
  }

  return { pendingRestore, setRestoreData, consumeRestoreData, resetCounter, triggerReset }
}
