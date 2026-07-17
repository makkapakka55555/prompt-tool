import { ref } from 'vue'

const selectedItem = ref(null)

export function useLibraryItem() {
  function selectItem(item) {
    selectedItem.value = item
  }

  return { selectedItem, selectItem }
}
