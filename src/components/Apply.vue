<script lang="ts" setup>
import { ref } from 'vue'
import { showNotify } from 'vant'
import { getVehicleInfo, getVerifySlider, checkPassBookingVerify } from '@/services/api'
import { getAcbsJwt } from '@/utils/acbs'
import { NullableTypeAnnotation } from '@babel/types'

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
  updateAppointment: {
    type: Function,
    default: null,
  },
  appointmentPickerToggle: {
    type: Function,
    default: null,
  },
})

const { account } = toRefs(props)
const applyForm = reactive({
  plateNumber: '',
  formInstanceId: '',
  appointmentDateIndex: null,
  captcha: null,
  captchaId: '',
  captchaPass: false,
  validationPass: false,
  verifyCodeValue: 0,
  verifyCodeWidth: 260,
})
const isLoading = reactive({
  vehicle: false,
  appointment: false,
  slider: false,
  sliderCheck: false,
  apply: false,
})

const loadVehicle = async () => {
  isLoading.vehicle = true
  getVehicleInfo({
    jwt: getAcbsJwt({
      iss: account.value.uuid,
    }),
    _method: '_POST',
  })
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
      applyForm.plateNumber =
        resp['responseResult']['formInstanceList'][0]['formInstance']['plateNumber']
      applyForm.formInstanceId =
        resp['responseResult']['formInstanceList'][0]['formInstance']['formInstanceId']
    })
    .finally(async () => {
      isLoading.vehicle = false
      props.updateAppointment(() => {
        let temp: any = 0
        applyForm.appointmentDateIndex = temp
      })
    })
}

const loadVerifySlider = async () => {
  isLoading.slider = true
  applyForm.captcha = null
  applyForm.captchaPass = false
  applyForm.validationPass = false
  applyForm.verifyCodeValue = 0
  await getVerifySlider({
    jwt: getAcbsJwt({ iss: account.value.uuid }),
  })
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
      applyForm.captcha = resp['responseResult']['responseList']['captcha']
      applyForm.captchaId = resp['responseResult']['responseList']['id']
    })
    .finally(() => {
      isLoading.slider = false
    })
}

const checkVerifySlider = () => {
  isLoading.sliderCheck = true
  const endTime = new Date()
  const startTime = new Date()
  startTime.setTime(endTime.getTime() - 1600)
  const trackList = []
  for (let i = 0; i <= applyForm.verifyCodeValue; i++) {
    trackList.push({
      x: i,
      y: 0,
      type: 'move',
      t: i * 7,
    })
  }
  const payload = {
    appointmentType: 'passBooking',
    formInstanceId: applyForm.formInstanceId,
    direction: 'S',
    plateNumber: applyForm.plateNumber,
    verifyUploadData: {
      bgImageWidth: applyForm.verifyCodeWidth,
      bgImageHeight: Math.round(
        (applyForm.verifyCodeWidth / applyForm.captcha.backgroundImageWidth) *
          applyForm.captcha.backgroundImageHeight,
      ),
      startSlidingTime: startTime,
      entSlidingTime: endTime,
      trackList: trackList,
    },
    id: applyForm.captchaId,
    iss: account.value.uuid,
  }
  checkPassBookingVerify({
    jwt: getAcbsJwt(payload),
    _method: 'POST',
  })
    .then(resp => {
      if (resp.responseCode !== 200) {
        showNotify({ type: 'danger', message: `[澳車北上預約系統] ${resp.responseMessage}` })
        if (resp.responseCode === 802) {
          if (props.logout) {
            props.logout()
          }
        }
        loadVerifySlider()
        return
      }
      applyForm.captchaPass = true
      showNotify({ type: 'success', message: `[澳車北上預約系統] ${resp.responseMessage}` })
    })
    .finally(() => {
      isLoading.sliderCheck = false
    })
}

const onClickPickerConfirm = ({ selectedIndexes }: any) => {
  applyForm.appointmentDateIndex = selectedIndexes[0]
  props.appointmentPickerToggle(false)
}

const onClickAppointmentUpdate = () => {
  isLoading.appointment = true
  applyForm.appointmentDateIndex = null
  props.updateAppointment(() => {
    isLoading.appointment = false
    let temp: any = 0
    applyForm.appointmentDateIndex = temp
  })
}

const onClickApply = () => {
  showNotify({
    type: 'primary',
    message: '暫不開放此功能',
  })
  // goValidationPassBooking()
}

onMounted(async () => {
  await loadVerifySlider()
  loadVehicle()
})

const appointmentDateValue = computed(() => {
  return applyForm.appointmentDateIndex !== null
    ? `${
        account.value.appointmentDates[applyForm.appointmentDateIndex].appointmentDateRef
      } / 剩餘位置: ${
        parseInt(account.value.appointmentDates[applyForm.appointmentDateIndex].quota) -
        parseInt(account.value.appointmentDates[applyForm.appointmentDateIndex].applyNum)
      }`
    : ''
})

defineExpose({
  changeApplyDate: onClickPickerConfirm,
})
</script>

<template>
  <div class="apply">
    <VanCellGroup title="填寫資料">
      <VanField
        v-model="applyForm.plateNumber"
        name="plateNumber"
        label="車牌號碼"
        readonly
      />
      <VanField
        v-model="appointmentDateValue"
        :disabled="account.appointmentDates.length === 0"
        is-link
        readonly
        label="預約日期"
        placeholder="選擇日期"
        @click="
          () => {
            appointmentPickerToggle()
          }
        "
      >
      </VanField>
      <VanCell
        v-if="applyForm.captchaPass"
        title="驗證碼"
      >
        <div style="text-align: left">已通過</div>
      </VanCell>
    </VanCellGroup>
    <VanCellGroup
      v-if="applyForm.captchaPass === false"
      title="驗證碼"
    >
      <div style="text-align: center">
        <VanImage
          show-loading
          :width="`${applyForm.verifyCodeWidth}px`"
          :src="applyForm.captcha !== null ? applyForm.captcha.backgroundImage : ''"
        >
          <template v-slot:loading>
            <div style="width: 100%">
              <van-loading
                type="spinner"
                size="20"
              />
            </div>
          </template>
        </VanImage>
        <VanImage
          v-if="applyForm.captcha !== null"
          :width="`${
            (applyForm.verifyCodeWidth / applyForm.captcha.backgroundImageWidth) *
            applyForm.captcha.templateImageWidth
          }px`"
          :src="applyForm.captcha !== null ? applyForm.captcha.templateImage : ''"
          :style="{
            position: 'absolute',
            top: 0,
            left: `calc((min(100vw, 750px) - ${applyForm.verifyCodeWidth}px) / 2 + ${applyForm.verifyCodeValue}px)`,
          }"
        />
      </div>
      <div
        v-if="applyForm.captcha !== null"
        style="padding: 20px 0; margin: 0 auto"
        :style="{
          width: `${applyForm.verifyCodeWidth}px`,
        }"
      >
        <VanSlider
          v-model="applyForm.verifyCodeValue"
          :min="0"
          :max="applyForm.verifyCodeWidth"
          @drag-end="checkVerifySlider"
        >
          <template #button>
            <div class="custom-button">{{ applyForm.verifyCodeValue }}</div>
          </template>
        </VanSlider>
      </div>
    </VanCellGroup>
    <VanRow style="margin: 16px">
      <VanCol span="12">
        <VanButton
          @click="loadVerifySlider"
          :loading="isLoading.sliderCheck || isLoading.slider"
          type="default"
          round
          block
        >
          更換驗證碼
        </VanButton>
      </VanCol>
      <VanCol span="12">
        <VanButton
          @click="onClickAppointmentUpdate"
          :loading="account.appointmentDates.length === 0 || isLoading.appointment"
          type="default"
          round
          block
        >
          更新預約日期資料
        </VanButton>
      </VanCol>
    </VanRow>
    <VanRow style="margin: 16px">
      <VanButton
        @click="onClickApply"
        :disabled="applyForm.captchaPass === false || isLoading.sliderCheck || isLoading.slider"
        :loading="isLoading.apply"
        type="primary"
        round
        block
      >
        立即預約
      </VanButton>
    </VanRow>
  </div>
</template>

<style lang="scss">
.apply {
  .custom-button {
    width: 50px;
    color: #fff;
    font-size: 10px;
    line-height: 20px;
    text-align: center;
    background-color: var(--van-primary-color);
    border-radius: 100px;
  }
}
</style>
