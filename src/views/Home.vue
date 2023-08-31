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

const isLoading = ref(false)
const activeTab = ref(0)
const saveLogin = ref(false)
const useLastLogin = ref(false)
const updateSeconds = ref<[number, number]>([2, 5])
const apiMethod = ref('proxy')

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
  tgNotify: false,
  tgChatId: '',
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
    account.tgChatId = ''
    account.tgNotify = false
    localStorage.removeItem('tgChatId')
    localStorage.removeItem('tgNotify')
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
      chatId: account.tgNotify ? account.tgChatId : ''
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

const onChangeTgNotify = (val: any) => {
  localStorage.setItem('tgNotify', val)
  if (val === true) {
    localStorage.setItem('tgChatId', account.tgChatId)
  } else {
    localStorage.removeItem('tgChatId')
  }
}

const onChangeApiMethod = (val: string) => {
  localStorage.setItem('apiMethod', val)
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
  
  temp = localStorage.getItem('tgChatId')
  if (temp !== undefined && temp !== null && temp !== '') {
    account.tgChatId = temp
  }
  temp = localStorage.getItem('tgNotify')
  if (temp !== undefined && temp !== null && temp !== '') {
    account.tgNotify = JSON.parse(temp)
  }
  temp = localStorage.getItem('apiMethod')
  if (temp !== undefined && temp !== null && temp !== '') {
    apiMethod.value = temp
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
    <VanNavBar title="澳車北上小助手" />
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
        <VanCellGroup title="API">
          <VanCell title="請求方法" center>
            <template #extra>
              <VanRadioGroup v-model="apiMethod" @change="onChangeApiMethod" style="width: 100%">
              <VanRadio name="direct">直連</VanRadio>
              <VanRadio name="proxy">Reverse Proxy</VanRadio>
            </VanRadioGroup>
            </template>
          </VanCell>
        </VanCellGroup>
        <VanCellGroup title="Telegarm">
          <VanField
            v-model="account.tgChatId"
            :disabled="account.tgNotify"
            type="text"
            label="Chat ID"
            placeholder="@acbshelper_bot聯天室的Chat ID "
            />
          <VanCell
            title="啟動自動通知"
            center
          >
            <template #right-icon>
              <VanSwitch
                v-model="account.tgNotify"
                :disabled="account.tgChatId === ''"
                @change="onChangeTgNotify"
              />
            </template>
          </VanCell>
        </VanCellGroup>
        <div style="margin: 16px; color: gray; font-size: 14px;">
          查看 chat id 方法: 進入 Telegarm -> Contacts, 搜尋 @acbshelper_bot, 發送信息 /chatid
        </div>
      </VanTab>
      <VanTab title="說明">
        <VanCellGroup title="說明">
          <VanCell>
            <div class="disc">
              <p>
                感謝您使用開源網站"澳車北上小助手"，本網站的開發旨在為澳門市民提供方便快捷查詢方式。
              </p>
              <p>
                市民可以使用本網站快速查詢申請餘額，或開啟自動定時查詢 （需要保持網頁開啟），可以設定Telegarm訊息通知讓你第一時間收到餘額通知。本網站中的API請求是由用戶端網絡發起至「"澳車北上"信息管理服务系统」網站，本網站不存在伺服器（Serverless）進行任何網絡攻擊之行為，請仔細閱讀免責聲明，善意使用工具，維護網絡秩序。
              </p>
            </div>
          </VanCell>
        </VanCellGroup>
        <VanCellGroup title="開發說明">
          <VanCell>
            <div class="disc">
              <p>
                此網站使用Serverless方式開發 （Serverless不包括Telegarm通知功能），目的是讓使用者終端直接調用「"澳車北上"信息管理服务系统」提供的API，減少私隱安全疑慮，開發代碼已開源於Github上，有興趣的人士也可自行下載搭建，觀迎各界人士提供指導。
              </p>
              <p>
                由於「"澳車北上"信息管理服务系统」API有CORS（跨域源資源共用）限制，此網站demo有一般版本及Proxy版本，假如您的瀏覧器有安裝"Allow CORS"之類的插件，可以使用一般版本。Proxy版由本網管理設置的Reverse Proxy，只作為API請求轉發，如不信任請不要使用Proxy版本。
              </p>
            </div>
          </VanCell>
        </VanCellGroup>
        <VanCellGroup title="免責聲明">
          <VanCell>
            <div class="disc">
              <p>
                在使用本網站之前，請您詳細閱讀以下免責聲明內容。使用本網站即表示您同意以下條款和條件。
              </p>
              <ul>
                <li>
                  免責內容: 本網站所提供的內容和資訊僅供參考。雖然我們已經盡力確保內容的準確性，但不保證內容的完整性、及時性和準確性。您在使用本網站的任何資訊時，需自行承擔風險。
                </li>
                <li>
                  技術負擔: 使用本網站所提供的任何代碼、工具、插件或指南時，您應該了解這些內容可能需要進一步的技術知識和經驗。我們不對因使用這些內容導致的技術問題、錯誤或損失負責。
                </li>
                <li>
                  第三方連結: 本網站可能包含指向第三方網站或資源的連結。這些連結僅為方便用戶提供，並不代表我們對該等第三方網站的支持或背書。我們對於這些第三方內容的準確性和可用性不承擔任何責任。
                </li>
                <li>
                  程式碼安全性: 雖然我們已經努力確保在我們的開源代碼中沒有已知的安全問題，但使用這些代碼可能存在風險。我們強烈建議您在使用前仔細審查和測試這些代碼，以確保其安全性。
                </li>
                <li>
                  免責聲明的變更: 我們保留隨時更改或更新此免責聲明的權利。我們建議您定期查看此頁面以獲取最新的免責聲明信息。
                </li>
              </ul>
              <p>
                總之，您使用此網站的一切內容和資源時，都是基於自己的判斷和風險承擔。我們不對使用本網站內容可能導致的任何直接或間接損失負責。
              </p>
            </div>
          </VanCell>
        </VanCellGroup>
      </VanTab>
    </VanTabs>
    <VanRow justify="center">
      <VanCol>
        <div style="margin: 20px 0 30px 0; font-size: 10px;">
            &copy; Copyright 2023 <a target="_blank" href="https://github.com/oscar-wg">oscar-wg</a>
        </div>
      </VanCol>
    </VanRow>
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

  .disc {
    color: black;
    text-align: left;
    
    p:not(:last-child) {
      margin-bottom: 5px;
    }
    p:last-child {
      margin-top: 5px;
    }
    li {
      list-style: disc;
      margin-left: 25px;
    }
  }

  a {
    color: inherit;
    text-decoration: inherit;
  }
}
</style>
