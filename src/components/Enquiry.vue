<script lang="ts" setup>
import { ref, defineOptions, defineExpose, defineProps } from 'vue'

import { showNotify } from 'vant'
import { getAppointmentDate, getLogin, getVerifyCode, sendApplyNotify } from '@/services/api'
import { getAcbsJwt } from '@/utils/acbs'

defineOptions({
  name: 'Enquiry',
})

const props = defineProps({
  account: {
    type: Object,
    default: null,
  },
})
const { account } = toRefs(props)
const isLoading = ref(false)
const updateSeconds = ref<[number, number]>([2, 5])

const onClickSearch = async () => {
  isLoading.value = true
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`
  const currentTimeStr = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`
  if (account.value.appointmentDateJwt === '') {
    account.value.appointmentDateJwt = getAcbsJwt({
      appointmentType: 'passBooking',
      direction: 'S',
      iss: account.value.uuid,
    })
  }
  await getAppointmentDate(
    { jwt: account.value.appointmentDateJwt, _method: 'POST' },
    account.value.token,
  )
    .then(resp => {
      if (resp.responseCode !== 200) {
        showNotify({ type: 'danger', message: `[澳車北上預約系統] ${resp.responseMessage}` })

        if (resp.responseCode === 802) {
          onClickLogout()
        }
        return
      }

      account.value.appointmentDateData = resp.responseResult.appointmentDateList
      account.value.appointmentDateDataUpdate = `${todayStr} ${currentTimeStr}`
    })
    .finally(() => {
      isLoading.value = false
    })

  if (account.value.appointmentDateData !== null) {
    for (const info of account.value.appointmentDateData) {
      const temp: any = info
      const tempDate = new Date(temp.appointmentDateRef)
      if (account.value.appointmentDateStart > tempDate) {
        account.value.appointmentDateStart = tempDate
      }
      if (account.value.appointmentDateEnd < tempDate) {
        account.value.appointmentDateEnd = tempDate
      }
    }
  }

  if (
    account.value.appointmentDateData.filter((r: any) => parseInt(r.applyNum) !== parseInt(r.quota))
      .length > 0
  ) {
    showNotify({ type: 'success', message: `有位！` })
    sendApplyNotify({
      data: account.value.appointmentDateData,
      chatId: localStorage.getItem('tgNotify') ? localStorage.getItem('tgChatId') : '',
    })
  }
}

const calendarFormatter = (day: any) => {
  for (const info of account.value.appointmentDateData) {
    const temp: any = info
    if (new Date(temp.appointmentDateRef).toLocaleDateString() === day.date.toLocaleDateString()) {
      day.bottomInfo = (parseInt(temp.quota) - parseInt(temp.applyNum)).toString()
    }
  }
  return day
}

const randSecond = (min: number, max: number) => {
  return Math.round(Math.random() * (max - min) + min)
}

let autoJob: any = null
let nextRunTime: Date = new Date()

const autoJobCancel = () => {
  clearInterval(autoJob)
  autoJob = null
}

const onChangeAutoSearch = (val: any) => {
  if (val === true) {
    onClickSearch()

    autoJob = setInterval(async () => {
      const currentTime = new Date()
      if (currentTime.getTime() >= nextRunTime.getTime() && account.autoSearch === true) {
        nextRunTime.setSeconds(new Date().getSeconds() + 9999)
        await onClickSearch()
        const randNum = randSecond(updateSeconds.value[0], updateSeconds.value[1])
        nextRunTime.setTime(new Date().getTime() + randNum * 1000)
      }
    }, 1000)
  } else {
    autoJobCancel()
  }
}

onMounted(() => {
  console.log(account.value)
})

defineExpose({
  autoJobCancel,
})
</script>

<template>
  <div class="enquiry">
    <VanCellGroup title="查詢">
      <VanCell
        title="自動更新"
        center
      >
        <template #value>
          <VanSwitch
            @change="onChangeAutoSearch"
            v-model="account.autoSearch"
          />
        </template>
      </VanCell>
      <VanCell
        title="Refresh時間"
        center
        value-class="slider-cell"
      >
        <VanSlider
          v-model="updateSeconds"
          :max="10"
          :min="2"
          :step="1"
          range
          button-size="12px"
          style="margin-top: 10px"
          :disabled="account.autoSearch"
        />
        {{ `${updateSeconds[0]}s 至 ${updateSeconds[1]}s` }}
      </VanCell>
      <VanCell title="最後更新時間">
        {{ account.appointmentDateDataUpdate }}
      </VanCell>
      <VanCell title="是否有空位">
        {{
          account.appointmentDateData.length === 0
            ? ''
            : account.appointmentDateData.some((r: any) => r.quota !== r.applyNum)
            ? '有'
            : '沒有'
        }}
      </VanCell>
    </VanCellGroup>
    <VanRow style="margin: 16px">
      <VanButton
        @click="onClickSearch"
        :loading="isLoading"
        :disabled="account.autoSearch"
        type="info"
        round
        block
      >
        查詢預約情況
      </VanButton>
    </VanRow>
    <VanCalendar
      :poppable="false"
      :show-confirm="false"
      :min-date="account.appointmentDateStart"
      :max-date="account.appointmentDateEnd"
      :formatter="calendarFormatter"
      title="日曆"
    />
  </div>
</template>

<style lang="scss"></style>
