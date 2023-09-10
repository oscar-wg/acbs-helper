<script lang="ts" setup>
import { showNotify } from 'vant'
import {
  getVerifySlider,
  checkPassBookingVerify,
  solveSliderCaptcha,
  createPassAppointment,
  validationPassBooking,
} from '@/services/api'
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
const autoVerify = ref(false)
const applyForm = reactive({
  appointmentDateIndex: 0,
  captchaId: '',
  captchaPass: false,
  validationPass: false,
  verifyCodeValue: 0,
  verifyCodeWidth: 260,
})
const captcha = ref<any>(null)

const isLoading = reactive({
  appointment: false,
  slider: false,
  sliderCheck: false,
  apply: false,
})

const loadVerifySlider = async () => {
  isLoading.slider = true
  captcha.value = null
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
      captcha.value = resp['responseResult']['responseList']['captcha']
      applyForm.captchaId = resp['responseResult']['responseList']['id']
      if (autoVerify.value === true) {
        getSliderCaptchaResult()
      }
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
    formInstanceId: account.value.formInstanceId,
    direction: 'S',
    plateNumber: account.value.plateNumber,
    verifyUploadData: {
      bgImageWidth: applyForm.verifyCodeWidth,
      bgImageHeight: Math.round(
        (applyForm.verifyCodeWidth / captcha.value.backgroundImageWidth) *
          captcha.value.backgroundImageHeight,
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

const getSliderCaptchaResult = () => {
  const req = {
    captcha: captcha.value,
    widthScale: applyForm.verifyCodeWidth,
  }
  solveSliderCaptcha(req).then(resp => {
    applyForm.verifyCodeValue = resp.result
    checkVerifySlider()
  })
}

const goValidationPassBooking = () => {
  showNotify({
    type: 'primary',
    message: '暫不開放此功能',
  })
  // TODO
}

const goCreatePassAppointment = () => {
  showNotify({
    type: 'primary',
    message: '暫不開放此功能',
  })
  // TODO
}

const onClickPickerConfirm = ({ selectedIndexes }: any) => {
  applyForm.appointmentDateIndex = selectedIndexes[0]
  props.appointmentPickerToggle(false)
}

const onChangeAutoVerify = (val: boolean) => {
  localStorage.setItem('autoVerify', val.toString())
  if (val === true && applyForm.captchaPass === false && captcha !== null) {
    getSliderCaptchaResult()
  }
}

const onClickAppointmentUpdate = () => {
  isLoading.appointment = true
  props.updateAppointment(() => {
    isLoading.appointment = false
  }, false)
}

const onClickApply = () => {
  if (applyForm.captchaPass === false) {
    checkVerifySlider()
  } else if (applyForm.validationPass === false) {
    goValidationPassBooking()
  } else {
    goCreatePassAppointment()
  }
}

onMounted(async () => {
  let temp = localStorage.getItem('autoVerify')
  if (temp !== undefined && temp !== null && temp !== '') {
    autoVerify.value = JSON.parse(temp)
  }
  loadVerifySlider()
  if (account.value.appointmentDates.length === 0) {
    onClickAppointmentUpdate()
  }
})

const appointmentDateValue = computed(() => {
  return applyForm.appointmentDateIndex !== null && account.value.appointmentDates.length > 0
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
        v-model="account.plateNumber"
        name="plateNumber"
        label="車牌號碼"
        readonly
      />
      <VanField
        v-model="appointmentDateValue"
        :disabled="account.appointmentDates.length === 0 || isLoading.appointment"
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
        title="自動驗證"
        center
      >
        <template #value>
          <div style="text-align: left; line-height: 10px">
            <VanSwitch
              v-model="autoVerify"
              @change="onChangeAutoVerify"
            />
          </div>
        </template>
      </VanCell>
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
          :src="captcha !== null ? captcha.backgroundImage : ''"
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
          v-if="captcha !== null"
          :width="`${
            (applyForm.verifyCodeWidth / captcha.backgroundImageWidth) * captcha.templateImageWidth
          }px`"
          :src="captcha !== null ? captcha.templateImage : ''"
          :style="{
            position: 'absolute',
            top: 0,
            left: `calc((min(100vw, 750px) - ${applyForm.verifyCodeWidth}px) / 2 + ${applyForm.verifyCodeValue}px)`,
          }"
        />
      </div>
      <div
        v-if="captcha !== null"
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
