<script lang="ts" setup>
import { showNotify } from 'vant'
import {
  getAppointmentDate,
  getLogin,
  getVerifyCode,
  sendApplyNotify,
} from '@/services/api'
import { $utils } from '@/utils/index'
import { getAcbsJwt, getAcbsPwHash } from '@/utils/acbs'
// import { parseVerifyCode } from '@/utils/tesseract'

defineOptions({
  name: 'Home',
})

const settingTab = ref<any>(null)
const isLoading = ref(false)
const activeTab = ref(0)
const saveLogin = ref(false)
const useLastLogin = ref(false)
const updateSeconds = ref<[number, number]>([2, 5])

const account = reactive({
  uuid: '',
  username: '',
  password: '',
  passwordHash: '',
  verifyCodeId: '',
  verifyCodeImg: '',
  verifyCode: '',
  token: '',
  userId: '',
  name: '',
  appointmentDateJwt: '',
  appointmentDateStart: new Date(),
  appointmentDateEnd: new Date(),
  appointmentDateData: [],
  appointmentDateDataUpdate: '',
  autoSearch: false,
})

const loadVerifyCode = async () => {
  account.verifyCode = ''
  account.verifyCodeId = ''
  account.verifyCodeImg = ''

  const jwtEncode = getAcbsJwt({
    'iss': account.uuid
  })
  await getVerifyCode({ jwt: jwtEncode }).then(async resp => {
    if (resp.responseCode !== 200) {
      showNotify({ type: 'danger', message: `[澳車北上預約系統] ${resp.responseMessage}` })
      return
    }
    account.verifyCodeImg = resp.responseResult.imageUrl
    account.verifyCodeId = resp.responseResult.verifyCodeId

    /*
    // disable parse verify code, after 2023/08/31, the verify code image change to PNG and add noise, can not parse by original function
    parseVerifyCode(account.verifyCodeImg, (result: string) => {
      account.verifyCode = result
    })
    */
  })
}

const onClickLogin = async () => {
  if (account.username.trim() === '') {
    showNotify({ type: 'danger', message: '填寫賬戶' })
    return
  }
  if (useLastLogin.value === true) {
    const temp = localStorage.getItem('passwordHash')
    if (temp !== undefined && temp !== null && temp !== '') {
      account.passwordHash = temp
      account.password = ''
    }
  } else {
    account.passwordHash = ''
  }
  if ((account.password.trim() === '' || account.password.trim().length < 8) && account.passwordHash === '') {
    showNotify({ type: 'danger', message: '填寫密碼' })
    return
  }
  if ((account.verifyCode.trim() === '' || account.verifyCode.trim().length < 8) && account.verifyCode === '') {
    showNotify({ type: 'danger', message: '填寫驗證碼' })
    return
  }

  if (account.password !== '') {
    account.passwordHash = getAcbsPwHash(account.password)
  }

  isLoading.value = true

  if (account.verifyCode !== '') {
    const jwtEncode = getAcbsJwt({
      'accountNo': account.username,
      'password': account.passwordHash,
      'verificationCode': account.verifyCode,
      'pVerificationCode': '',
      'loginVerifyCode': account.verifyCode,
      'verifyCodeId': account.verifyCodeId,
      'isNeedCheckVerifyCode': 'true',
      'accountType': 'personal',
      'iss': account.uuid,
    })
    await getLogin({ jwt: jwtEncode }).then(async resp => {
        if (resp.responseCode !== 200) {
          showNotify({
            type: 'danger',
            message: `[澳車北上預約系統] ${resp.responseMessage}`,
          })
          if (resp.responseCode === 705) {
            account.verifyCode = ''
            account.verifyCodeId = ''
            account.verifyCodeImg = ''

            await loadVerifyCode()
            await onClickLogin()
          }
          account.passwordHash = ''
          return
        }
        account.token = resp.responseResult.token
        account.name = resp.responseResult.userName
        account.userId = resp.responseResult.carOwner.userId
        if (saveLogin.value === true) {
          localStorage.setItem('username', account.username)
          localStorage.setItem('name', account.name)
          localStorage.setItem('passwordHash', account.passwordHash)
          localStorage.setItem('userId', account.userId)
          localStorage.setItem('saveLogin', saveLogin.value.toString())
          localStorage.setItem('useLastLogin', useLastLogin.value.toString())
        }
        localStorage.setItem('token', account.token)

        setTimeout(() => {
          activeTab.value = 1
        }, 100)
      })
  }

  isLoading.value = false
}

const onClickLogout = async () => {
  account.token = ''
  account.password = ''
  account.verifyCode = ''
  account.verifyCodeId = ''
  account.verifyCodeImg = ''
  account.verifyCode = ''

  clearInterval(autoJob)
  autoJob = null
  activeTab.value = 0

  localStorage.removeItem('token')
  if (saveLogin.value === false) {
    localStorage.removeItem('tgChatId')
    localStorage.removeItem('tgNotify')
    if (settingTab.value) {
      settingTab.value.init()
    }
  }
  loadVerifyCode()
}

const onClickClearStorage = async () => {
  localStorage.removeItem('username')
  localStorage.removeItem('password')
  localStorage.removeItem('passwordHash')
  localStorage.removeItem('saveLogin')
  localStorage.removeItem('useLastLogin')
  localStorage.removeItem('tgChatId')
  localStorage.removeItem('tgNotify')

  window.location.href = '/'
}

const onClickSearch = async () => {
  isLoading.value = true
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`
  const currentTimeStr = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`
  if (account.appointmentDateJwt === '') {
    account.appointmentDateJwt = getAcbsJwt({
      'appointmentType': 'passBooking',
      'direction': 'S',
      'iss': account.uuid,
    })
  }
  await getAppointmentDate(
    { jwt: account.appointmentDateJwt, _method: 'POST' },
    account.token,
  ).then(resp => {
    if (resp.responseCode !== 200) {
      showNotify({ type: 'danger', message: `[澳車北上預約系統] ${resp.responseMessage}` })

      if (resp.responseCode === 802) {
        onClickLogout()
      }
      return
    }

    account.appointmentDateData = resp.responseResult.appointmentDateList
    account.appointmentDateDataUpdate = `${todayStr} ${currentTimeStr}`
  }).finally(() => {
    isLoading.value = false
  })

  if (account.appointmentDateData !== null) {
    for (const info of account.appointmentDateData) {
      const temp: any = info
      const tempDate = new Date(temp.appointmentDateRef)
      if (account.appointmentDateStart > tempDate) {
        account.appointmentDateStart = tempDate
      }
      if (account.appointmentDateEnd < tempDate) {
        account.appointmentDateEnd = tempDate
      }
    }
  }

  if (account.appointmentDateData.filter((r: any) => parseInt(r.applyNum) !== parseInt(r.quota)).length > 0) {
    showNotify({ type: 'success', message: `有位！` })
    sendApplyNotify({
      data: account.appointmentDateData,
      chatId: localStorage.getItem('tgNotify') ? localStorage.getItem('tgChatId') : ''
    })
  }

}

const calendarFormatter = (day: any) => {
  for (const info of account.appointmentDateData) {
    const temp: any = info
    if (
      (new Date(temp.appointmentDateRef)).toLocaleDateString() === day.date.toLocaleDateString()
    ) {
      day.bottomInfo = (parseInt(temp.quota) - parseInt(temp.applyNum)).toString()
    }
  }
  return day
}

const randSecond = (min: number, max: number) => {
  return Math.round(Math.random() * (max - min) + min)
}

let autoJob: any = null
let nextRunTime:Date = new Date()
const onChangeAutoSearch = (val: any) => {
  if (val === true) {
    onClickSearch()

    autoJob = setInterval(async () => {
      const currentTime = new Date()
      if (currentTime.getTime() >= nextRunTime.getTime() && account.autoSearch === true) {
        nextRunTime.setSeconds((new Date()).getSeconds() + 9999)
        await onClickSearch()
        const randNum = randSecond(updateSeconds.value[0], updateSeconds.value[1])
        nextRunTime.setTime((new Date()).getTime() + randNum * 1000)
      }
    }, 1000)
  } else {
    clearInterval(autoJob)
    autoJob = null
  }
}

onMounted(() => {
  let temp = localStorage.getItem('uuid')
  if (temp === undefined || temp === null || temp === '') {
    temp = $utils.uuid()
    localStorage.setItem('uuid', temp)
  }
  account.uuid = temp

  temp = localStorage.getItem('saveLogin')
  if (temp !== undefined && temp !== null && temp !== '') {
    saveLogin.value = JSON.parse(temp)
    if (saveLogin.value === false) {
      useLastLogin.value = false
    } else {
      temp = localStorage.getItem('useLastLogin')
      if (temp !== undefined && temp !== null && temp !== '') {
        useLastLogin.value = JSON.parse(temp)
      }
    }
  }

  if (saveLogin.value !== false) {
    temp = localStorage.getItem('username')
    if (temp !== undefined && temp !== null && temp !== '') {
      account.username = temp
    }
    temp = localStorage.getItem('passwordHash')
    if (temp !== undefined && temp !== null && temp !== '') {
      account.passwordHash = temp
    }
  }

  temp = localStorage.getItem('token')
  if (temp !== undefined && temp !== null && temp !== '') {
    account.token = temp

    temp = localStorage.getItem('name')
    if (temp !== undefined && temp !== null && temp !== '') {
      account.name = temp
    }
    temp = localStorage.getItem('userId')
    if (temp !== undefined && temp !== null && temp !== '') {
      account.userId = temp
    }
    setTimeout(() => {
      activeTab.value = 1
    }, 100)
  }

  if (account.token === '') {
    loadVerifyCode()
  }
})

</script>

<template>
  <div class="home">
    <Header />
    <VanTabs v-model:active="activeTab">
      <VanTab title="登入">
        <VanCellGroup title="賬戶資料">
          <VanField
            v-model="account.username"
            :rules="[{ required: true, message: '填寫賬戶' }]"
            :disabled="account.token !== ''"
            name="username"
            type="email"
            label="賬戶"
            placeholder="賬戶"
          />
          <template v-if="account.token === ''">
            <VanField
              v-model="account.password"
              v-if="useLastLogin == false"
              :rules="[{ required: true, message: '填寫密碼' }]"
              type="password"
              name="current-password"
              label="密碼"
              autocomplete="off"
            />
            <VanField
              v-model="account.verifyCode"
              :disabled="account.verifyCodeImg === ''"
              name="verify-code"
              label="驗證碼"
              center
            >
              <template #right-icon>
                <VanImage
                  :src="`${account.verifyCodeImg}`"
                  id="captcha"
                  @click="() => {
                    loadVerifyCode()
                  }"
                >
                  <template v-slot:loading>
                    <van-loading type="spinner" size="20" />
                  </template>
                </VanImage>                  
              </template>
            </VanField>
            <VanCell>
              <VanCheckbox v-model="saveLogin" style="margin: 5px 0">本機儲存登入資訊</VanCheckbox>
            </VanCell>
            <VanCell v-if="account.passwordHash !== '' && saveLogin === true">
              <VanCheckbox v-model="useLastLogin" style="margin: 5px 0">使用上次登入</VanCheckbox>
            </VanCell>
          </template>
        </VanCellGroup>
        <div style="margin: 16px">
          <VanButton
            @click="onClickLogin"
            v-if="account.token === ''"
            :loading="isLoading"
            :disabled="account.verifyCodeImg === ''"
            type="primary"
            round
            block
          >
            登入
          </VanButton>
          <VanButton
            @click="onClickLogout"
            v-else
            type="primary"
            round
            block
          >
            登出
          </VanButton>
        </div>
        <div style="margin: 16px">
          <VanButton
            @click="onClickClearStorage"
            type="info"
            round
            block
          >
            清除儲存資料
          </VanButton>
        </div>
        <VanCellGroup v-if="account.token !== ''" title="登入訊息">
          <VanField
            v-model="account.token"
            name="token"
            label="TOKEN"
            disabled
          />
        </VanCellGroup>
      </VanTab>
      <!--<VanTab title="查詢">-->
      <VanTab title="查詢" :disabled="account.token === ''">
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
            <VanSlider v-model="updateSeconds" :max="10" :min="2" :step="1" range button-size="12px" style="margin-top: 10px;" :disabled="account.autoSearch" />
            {{ `${updateSeconds[0]}s 至 ${updateSeconds[1]}s` }}
          </VanCell>
          <VanCell
            title="最後更新時間"
          >
            {{ account.appointmentDateDataUpdate }}
          </VanCell>
          <VanCell
            title="是否有空位"
          >
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
      </VanTab>
      <VanTab title="設定">
        <Settings ref="settingTab" />
      </VanTab>
      <VanTab title="說明">
        <Description />
      </VanTab>
    </VanTabs>
    <Footer />
  </div>
</template>

<style lang="scss">
.home {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  font-size: 14px;

  .van-cell {
    justify-content: space-between;

    .van-cell__title {
      width: var(--van-field-label-width) !important;
      flex: none;
    }
  }

  .slider-cell {
    overflow: visible !important;
  }

  a {
    color: inherit;
    text-decoration: inherit;
  }
}
</style>
