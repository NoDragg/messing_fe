import { reactive } from 'vue'

const state = reactive({
  show: false,
  message: '',
  type: 'success',
})

let toastTimer = null

export function useToast() {
  const showToast = (message, type = 'success') => {
    if (toastTimer) clearTimeout(toastTimer)
    
    state.show = true
    state.message = message
    state.type = type
    
    toastTimer = setTimeout(() => {
      state.show = false
    }, 2600)
  }

  return {
    toastState: state,
    showToast
  }
}
