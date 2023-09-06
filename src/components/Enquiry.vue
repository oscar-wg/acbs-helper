<script lang="ts" setup>
import { ref } from 'vue'

import { showNotify } from 'vant'
import { getAppointmentDate, sendApplyNotify } from '@/services/api'
import { getAcbsJwt } from '@/utils/acbs'

defineOptions({
  name: 'Enquiry',
})

const props = defineProps({
  account: {
    type: Object,
    default: null,
  },
  logout: {
    type: Function,
    default: null,
  },
})

const { account } = toRefs(props)
const autoSearch = ref(false)
const appointment = reactive({
  jwt: '',
  start: new Date(),
  end: new Date(),
  lastUpdate: '',
})
const isLoading = ref(false)
const updateSeconds = ref<[number, number]>([2, 5])

const onClickSearch = async (callback: Function | null = null) => {
  if (isLoading.value === true) {
    if (callback !== null) callback()
    return
  }
  isLoading.value = true
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`
  const currentTimeStr = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`
  if (appointment.jwt === '') {
    appointment.jwt = getAcbsJwt({
      appointmentType: 'passBooking',
      direction: 'S',
      iss: account.value.uuid,
    })
  }
  await getAppointmentDate({ jwt: appointment.jwt, _method: 'POST' })
    .then(resp => {
      if (resp.responseCode !== 200) {
        showNotify({ type: 'danger', message: `[澳車北上預約系統] ${resp.responseMessage}` })

        if (resp.responseCode === 802) {
          if (props.logout) {
            props.logout()
          }
        }
        return
      }
      const temp: any[] = []
      resp.responseResult.appointmentDateList.map((r: any) => temp.push(r))
      console.log(
        temp.sort((a: any, b: any) => parseInt(b.appointmentDate) - parseInt(a.appointmentDate))[0],
      )
      account.value.appointmentDates = temp
      appointment.lastUpdate = `${todayStr} ${currentTimeStr}`
      if (callback !== null) callback()
    })
    .finally(() => {
      isLoading.value = false
    })

  if (account.value.appointmentDates !== null) {
    for (const info of account.value.appointmentDates) {
      const temp: any = info
      const tempDate = new Date(temp.appointmentDateRef)
      if (appointment.start > tempDate) {
        appointment.start = tempDate
      }
      if (appointment.end < tempDate) {
        appointment.end = tempDate
      }
    }
  }

  if (
    account.value.appointmentDates.filter((r: any) => parseInt(r.applyNum) !== parseInt(r.quota))
      .length > 0
  ) {
    showNotify({ type: 'success', message: `有位！` })
    sendApplyNotify({
      data: account.value.appointmentDates,
      chatId: localStorage.getItem('tgNotify') ? localStorage.getItem('tgChatId') : '',
    })
  }
}

const calendarFormatter = (day: any) => {
  for (const info of account.value.appointmentDates) {
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
  autoSearch.value = false
  appointment.jwt = ''
  clearInterval(autoJob)
  autoJob = null
}

const onChangeAutoSearch = (val: any) => {
  if (val === true) {
    onClickSearch()

    autoJob = setInterval(async () => {
      const currentTime = new Date()
      if (currentTime.getTime() >= nextRunTime.getTime() && autoSearch.value === true) {
        nextRunTime.setSeconds(new Date().getSeconds() + 9999)
        try {
          await onClickSearch()
        } catch (e) {
          console.log(e)
        }
        const randNum = randSecond(updateSeconds.value[0], updateSeconds.value[1])
        nextRunTime.setTime(new Date().getTime() + randNum * 1000)
      }
    }, 1000)
  } else {
    autoJobCancel()
  }
}

onMounted(() => {})

defineExpose({
  autoJobCancel,
  enquiry: onClickSearch,
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
            v-model="autoSearch"
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
          :disabled="autoSearch"
        />
        {{ `${updateSeconds[0]}s 至 ${updateSeconds[1]}s` }}
      </VanCell>
      <VanCell title="最後更新時間">
        {{ appointment.lastUpdate }}
      </VanCell>
      <VanCell title="是否有空位">
        {{
          account.appointmentDates.length === 0
            ? ''
            : account.appointmentDates.some((r: any) => r.quota !== r.applyNum)
            ? '有'
            : '沒有'
        }}
      </VanCell>
    </VanCellGroup>
    <VanRow style="margin: 16px">
      <VanButton
        @click="onClickSearch"
        :loading="isLoading"
        :disabled="autoSearch"
        type="default"
        round
        block
      >
        查詢預約情況
      </VanButton>
    </VanRow>
    <VanCalendar
      :poppable="false"
      :show-confirm="false"
      :min-date="appointment.start"
      :max-date="appointment.end"
      :formatter="calendarFormatter"
      title="日曆"
    />
  </div>
</template>

<style lang="scss"></style>
