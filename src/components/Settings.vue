<script lang="ts" setup>
import { showNotify } from 'vant'
import { ref } from 'vue'

defineOptions({
  name: 'Settings',
})

const apiMethod = ref('proxy')
const tgNotify = ref(false)
const tgChatId = ref('')
const proxyHost = ref('https://acbs-proxy.vercel.app')
const directHost = 'https://macaoapply.singlewindow.gd.cn'

const onChangeTgNotify = (val: any) => {
  localStorage.setItem('tgNotify', val)
  if (val === true) {
    if (tgChatId.value === '') {
      showNotify({
        message: '請輸入Chat ID',
        type: 'danger',
      })
      tgNotify.value = false
      return
    }
    localStorage.setItem('tgChatId', tgChatId.value)
  } else {
    localStorage.removeItem('tgChatId')
  }
}

const onChangeApiMethod = (val: string) => {
  localStorage.setItem('apiMethod', val)
  if (val === 'proxy') {
    onChangeProxyHost(null)
  }
}

const onChangeProxyHost = (event: any) => {
  localStorage.setItem('proxyHost', proxyHost.value)
}

onMounted(() => {
  tgNotify.value = false
  tgChatId.value = ''

  let temp = localStorage.getItem('tgChatId')
  if (temp !== undefined && temp !== null && temp !== '') {
    tgChatId.value = temp
  }
  temp = localStorage.getItem('tgNotify')
  if (temp !== undefined && temp !== null && temp !== '') {
    tgNotify.value = JSON.parse(temp)
  }
  temp = localStorage.getItem('apiMethod')
  if (temp !== undefined && temp !== null && temp !== '') {
    apiMethod.value = temp
  } else {
    localStorage.setItem('apiMethod', apiMethod.value)
  }
  temp = localStorage.getItem('proxyHost')
  if (temp !== undefined && temp !== null && temp !== '') {
    proxyHost.value = temp
  } else {
    localStorage.setItem('proxyHost', proxyHost.value)
  }
})

defineExpose({})
</script>

<template>
  <div class="settings">
    <VanCellGroup title="API(更改後請重新整理頁面)">
      <VanCell
        title="請求方法"
        center
      >
        <template #extra>
          <VanRadioGroup
            v-model="apiMethod"
            @change="onChangeApiMethod"
            style="width: 100%"
          >
            <VanRadio name="direct">直連</VanRadio>
            <VanRadio
              name="proxy"
              style="margin-top: 5px"
              >CORS Proxy</VanRadio
            >
          </VanRadioGroup>
        </template>
      </VanCell>
      <VanField
        v-if="apiMethod === 'proxy'"
        v-model="proxyHost"
        label="Proxy地址"
        type="text"
        placeholder="https://proxy.abc/"
        @blur="onChangeProxyHost"
      />
      <VanField
        v-if="apiMethod === 'direct'"
        v-model="directHost"
        label="直連地址"
        type="text"
        value="abc"
        disabled
      />
    </VanCellGroup>
    <VanCellGroup title="Telegarm">
      <VanField
        v-model="tgChatId"
        :disabled="tgNotify"
        type="text"
        label="Chat ID"
        placeholder="@acbshelper_bot聯天室的Chat ID "
      />
      <VanCell
        title="開啟自動通知"
        center
      >
        <template #right-icon>
          <VanSwitch
            v-model="tgNotify"
            @change="onChangeTgNotify"
          />
        </template>
      </VanCell>
    </VanCellGroup>
    <div style="margin: 16px; color: gray; font-size: 14px">
      查看 chat id 方法: 進入 Telegarm -> Contacts, 搜尋 @acbshelper_bot, 發送信息 /chatid
    </div>
  </div>
</template>

<style lang="scss"></style>
