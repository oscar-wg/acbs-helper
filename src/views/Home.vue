<script lang="ts" setup>
import { showNotify } from 'vant'
import { getLogin, getVehicleInfo, getVerifyCode, solveImageCaptcha } from '@/services/api'
import { $utils } from '@/utils/index'
import { getAcbsJwt, getAcbsPwHash } from '@/utils/acbs'
import { pngVerifyCodeImgFilter } from '@/utils/tesseract'
// import { parseVerifyCode } from '@/utils/tesseract'

defineOptions({
  name: 'Home',
})

const filterImg = ref('')
const autoVerify = ref(false)
const enquiryTab = ref<any>(null)
const applyTab = ref<any>(null)
const activeTab = ref(0)
const saveLogin = ref(false)
const useLastLogin = ref(false)
const isLoading = reactive({
  verifyCode: false,
  vehicle: false,
  login: false,
  logout: false,
})
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
  plateNumber: '',
  formInstanceId: '',
  appointmentDates: [],
})
const appointmentDatePicker = reactive({
  show: false,
})

const getVerifyCodeDecode = async () => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const image: any = document.querySelector('#captcha img')
  if (ctx !== null && image !== null) {
    canvas.width = image.width
    canvas.height = image.height
    ctx.drawImage(image, 0, 0)
    filterImg.value = await pngVerifyCodeImgFilter(canvas.toDataURL())
  }
  solveImageCaptcha({
    captcha: filterImg.value,
  }).then(resp => {
    const answer = resp.responseResult.result
    if (answer && answer.length === 4) {
      account.verifyCode = answer
    } else {
      showNotify({
        type: 'warning',
        message: '無法識別',
      })
      loadVerifyCode()
    }
  })
}

const loadVerifyCode = async () => {
  isLoading.verifyCode = true
  filterImg.value = ''
  account.verifyCode = ''
  account.verifyCodeId = ''
  account.verifyCodeImg = ''

  const jwtEncode = getAcbsJwt({
    iss: account.uuid,
  })

  await getVerifyCode({ jwt: jwtEncode })
    .then(async resp => {
      if (resp.responseCode !== 200) {
        showNotify({ type: 'danger', message: `[澳車北上預約系統] ${resp.responseMessage}` })
        return
      }
      account.verifyCodeImg = resp.responseResult.imageUrl
      account.verifyCodeId = resp.responseResult.verifyCodeId

      if (autoVerify.value === true) {
        setTimeout(async () => {
          getVerifyCodeDecode()
        }, 100)
      }
    })
    .finally(() => {
      isLoading.verifyCode = false
    })
}

const loadVehicle = async () => {
  getVehicleInfo({
    jwt: getAcbsJwt({
      iss: account.uuid,
    }),
    _method: '_POST',
  }).then(resp => {
    if (resp.responseCode !== 200) {
      showNotify({ type: 'danger', message: `[澳車北上預約系統] ${resp.responseMessage}` })
      if (resp.responseCode === 802) {
        onClickLogout()
      }
      return
    }
    account.plateNumber =
      resp['responseResult']['formInstanceList'][0]['formInstance']['plateNumber']
    account.formInstanceId =
      resp['responseResult']['formInstanceList'][0]['formInstance']['formInstanceId']
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
  if (
    (account.password.trim() === '' || account.password.trim().length < 8) &&
    account.passwordHash === ''
  ) {
    showNotify({ type: 'danger', message: '填寫密碼' })
    return
  }
  if (
    (account.verifyCode.trim() === '' || account.verifyCode.trim().length < 8) &&
    account.verifyCode === ''
  ) {
    showNotify({ type: 'danger', message: '填寫驗證碼' })
    return
  }

  if (account.password !== '') {
    account.passwordHash = getAcbsPwHash(account.password)
  }

  isLoading.login = true

  if (account.verifyCode !== '') {
    const jwtEncode = getAcbsJwt({
      accountNo: account.username,
      password: account.passwordHash,
      verificationCode: account.verifyCode,
      pVerificationCode: '',
      loginVerifyCode: account.verifyCode,
      verifyCodeId: account.verifyCodeId,
      isNeedCheckVerifyCode: 'true',
      accountType: 'personal',
      iss: account.uuid,
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
      loadVehicle()
      setTimeout(() => {
        activeTab.value = 1
      }, 100)
    })
  }

  isLoading.login = false
}

const onClickLogout = async () => {
  isLoading.logout = true
  account.token = ''
  account.password = ''
  account.verifyCode = ''
  account.verifyCodeId = ''
  account.verifyCodeImg = ''
  account.verifyCode = ''

  if (enquiryTab.value) {
    enquiryTab.value.autoJobCancel()
  }
  activeTab.value = 0

  localStorage.removeItem('token')
  isLoading.logout = false
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
  localStorage.removeItem('token')
  localStorage.removeItem('proxyHost')

  window.location.href = '/'
}

const onChangeAutoVerify = (val: boolean) => {
  localStorage.setItem('autoImageVerify', val.toString())
  if (val === true && account.verifyCodeImg !== '') {
    getVerifyCodeDecode()
  } else {
    filterImg.value = ''
  }
}

onMounted(async () => {
  let temp = localStorage.getItem('uuid')
  if (temp === undefined || temp === null || temp === '') {
    temp = $utils.uuid()
    localStorage.setItem('uuid', temp)
  }
  account.uuid = temp

  temp = localStorage.getItem('autoImageVerify')
  if (temp !== undefined && temp !== null && temp !== '') {
    autoVerify.value = JSON.parse(temp)
  }

  temp = localStorage.getItem('apiMethod')
  if (temp === undefined || temp === null || temp === '') {
    localStorage.setItem('apiMethod', 'proxy')
  }
  temp = localStorage.getItem('proxyHost')
  if (temp === undefined || temp === null || temp === '') {
    localStorage.setItem('proxyHost', 'https://acbs-proxy.vercel.app')
  }

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

    loadVehicle()
    setTimeout(() => {
      activeTab.value = 1
    }, 300)
  }

  if (account.token === '') {
    setTimeout(loadVerifyCode, 200)
  }
})
</script>

<template>
  <div class="home">
    <Header />
    <div style="margin-top: 46px">
      <VanTabs
        v-model:active="activeTab"
        animated
      >
        <VanTab title="登入">
          <VanCellGroup title="賬戶資料">
            <VanField
              v-model="account.username"
              :rules="[{ required: true, message: '填寫賬戶' }]"
              :disabled="account.token !== '' || isLoading.login === true"
              name="username"
              type="email"
              label="賬戶"
              placeholder="賬戶"
            />
            <template v-if="account.token === ''">
              <VanField
                v-model="account.password"
                v-if="useLastLogin == false"
                :disabled="isLoading.login === true"
                :rules="[{ required: true, message: '填寫密碼' }]"
                type="password"
                name="current-password"
                label="密碼"
                autocomplete="off"
              />
              <VanField
                v-model="account.verifyCode"
                :disabled="
                  account.verifyCodeImg === '' ||
                  isLoading.verifyCode === true ||
                  isLoading.login === true
                "
                name="verify-code"
                label="驗證碼"
                center
              >
                <template #right-icon>
                  <VanImage
                    v-if="filterImg !== ''"
                    :src="filterImg"
                  />
                  <VanImage
                    :src="`${account.verifyCodeImg}`"
                    :show-loading="isLoading.verifyCode === true"
                    id="captcha"
                  >
                    <template v-slot:loading>
                      <van-loading
                        type="spinner"
                        size="20"
                      />
                    </template>
                  </VanImage>
                </template>
              </VanField>
              <VanCell
                title="自動填驗證碼"
                center
              >
                <template #value>
                  <div style="text-align: left; line-height: 10px">
                    <VanSwitch
                      v-model="autoVerify"
                      :disabled="isLoading.login || isLoading.verifyCode"
                      @change="onChangeAutoVerify"
                    />
                  </div>
                </template>
              </VanCell>
              <VanCell>
                <VanCheckbox
                  v-model="saveLogin"
                  :disabled="isLoading.login"
                  style="margin: 5px 0"
                  >本機儲存登入資訊</VanCheckbox
                >
              </VanCell>
              <VanCell
                v-if="
                  account.passwordHash !== '' &&
                  saveLogin === true &&
                  !(isLoading.login === true && useLastLogin === false)
                "
              >
                <VanCheckbox
                  v-model="useLastLogin"
                  :disabled="isLoading.login"
                  style="margin: 5px 0"
                  >使用上次登入</VanCheckbox
                >
              </VanCell>
            </template>
          </VanCellGroup>
          <div style="margin: 16px">
            <VanButton
              @click="onClickLogin"
              v-if="account.token === ''"
              :loading="isLoading.login"
              :disabled="isLoading.verifyCode === true"
              type="primary"
              round
              block
            >
              登入
            </VanButton>
          </div>
          <VanRow
            style="margin: 16px"
            gutter="16"
            justify="center"
          >
            <VanCol span="12">
              <VanButton
                v-if="account.token === ''"
                @click="loadVerifyCode"
                :loading="isLoading.verifyCode"
                :disabled="isLoading.login"
                type="default"
                round
                block
              >
                更換驗證碼
              </VanButton>

              <VanButton
                @click="onClickLogout"
                v-else
                :loading="isLoading.logout"
                type="primary"
                round
                block
              >
                登出
              </VanButton>
            </VanCol>
            <VanCol span="12">
              <VanButton
                @click="onClickClearStorage"
                :disabled="
                  isLoading.login === true ||
                  isLoading.verifyCode === true ||
                  isLoading.logout === true
                "
                type="default"
                round
                block
              >
                清除儲存資料
              </VanButton>
            </VanCol>
          </VanRow>
          <VanCellGroup
            v-if="account.token !== ''"
            title="登入訊息"
          >
            <VanField
              v-model="account.name"
              name="name"
              label="用戶名稱"
              disabled
            />
            <VanField
              v-model="account.token"
              name="token"
              label="TOKEN"
              disabled
            />
          </VanCellGroup>
        </VanTab>
        <VanTab
          title="查詢"
          :disabled="account.token === ''"
        >
          <Enquiry
            v-if="account.token !== ''"
            ref="enquiryTab"
            :account="account"
            :logout="onClickLogout"
          />
        </VanTab>
        <VanTab
          :disabled="account.token === ''"
          title-class="apply-tab"
          title="快速申請"
          badge="PRO"
        >
          <Apply
            v-if="activeTab === 2"
            ref="applyTab"
            :account="account"
            :logout="onClickLogout"
            :appointmentPickerToggle="
              (val: boolean = !appointmentDatePicker.show) => {
                appointmentDatePicker.show = val
              }
            "
            :updateAppointment="enquiryTab.enquiry"
          />
        </VanTab>
        <VanTab title="說明">
          <Description />
        </VanTab>
      </VanTabs>
    </div>
    <Footer />
    <VanPopup
      v-model:show="appointmentDatePicker.show"
      position="bottom"
    >
      <VanPicker
        title="預約日期"
        :columns="
          account.appointmentDates.map((r: any) => {
            return {
              text: `${r.appointmentDateRef} / 剩餘位置: ${
                parseInt(r.quota) - parseInt(r.applyNum)
              }`,
              value: r.appointmentDateRef,
              // disabled: (parseInt(r.applyNum) - parseInt(r.quota)) <= 0
            }
          }) /* .filter(r => r.disabled !== true) */
        "
        :swipe-duration="0"
        confirm-button-text="確定"
        cancel-button-text="取消"
        @cancel="appointmentDatePicker.show = false"
        @confirm="
          val => {
            applyTab.changeApplyDate(val)
          }
        "
      />
    </VanPopup>
  </div>
</template>

<style lang="scss">
.home {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  font-size: 14px;

  .van-tab__text--ellipsis {
    overflow: visible;
  }

  .van-cell {
    justify-content: space-between;

    .van-cell__title {
      width: var(--van-field-label-width) !important;
      margin-right: var(--van-field-label-margin-right);
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

  .apply-tab .van-badge--top-right {
    right: -16px;
  }
}
</style>
