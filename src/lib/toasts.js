import { tick } from "svelte"
import { toasts } from "./toasts.svelte"

export async function addToast(toast) {
  const id = Math.random().toString(36).substring(2, 9)
  const newToast = { ...toast, id }
  
  toasts.push(newToast)

  await tick()
  
  if (toast.auto) {
    newToast.timeoutId = setTimeout(() => dismissToast(id), 1000*5)
  }
  
  return id
}

export function dismissToast(id) {
  const remove = toasts.find((one) => one.id === id)
  if(remove){
    const index = toasts.findIndex((one) => one.id === id)
    if(index !== -1){
      toasts.splice(index, 1)
      clearTimeout(remove.timeoutId)
    }
  }
}

export function cleanupToasts() {
  toasts.forEach((one) => clearTimeout(one.timeoutId))
  toasts.length = 0
}