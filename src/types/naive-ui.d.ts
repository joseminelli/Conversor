import type { MessageApi } from 'naive-ui'

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $message: MessageApi
  }
}
