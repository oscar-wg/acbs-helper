import { createApp } from 'vue'
import { Notify } from 'vant'
import App from '@/App.vue'
import router from '@/router'
import { Buffer } from 'buffer'

import '@vant/touch-emulator'
import 'vant/es/toast/style'
import 'vant/es/notify/style'
import '@/styles/style.scss'

window.Buffer = Buffer

const app = createApp(App)

app.use(router)
app.use(Notify)

router.isReady().then(() => {
  app.mount('#app')
})
