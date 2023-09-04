<script lang="ts" setup>
import { showNotify } from 'vant'
import { getLogin, getVerifyCode } from '@/services/api'
import { $utils } from '@/utils/index'
import { getAcbsJwt, getAcbsPwHash } from '@/utils/acbs'
// import { parseVerifyCode } from '@/utils/tesseract'

defineOptions({
  name: 'Home',
})

const enquiryTab = ref<any>(null)
const isLoading = ref(false)
const activeTab = ref(0)
const saveLogin = ref(false)
const useLastLogin = ref(false)
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
})

const loadVerifyCode = async () => {
  account.verifyCode = ''
  account.verifyCodeId = ''
  account.verifyCodeImg = ''

  const jwtEncode = getAcbsJwt({
    iss: account.uuid,
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

  isLoading.value = true

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

  if (enquiryTab.value) {
    enquiryTab.value.autoJobCancel()
  }
  activeTab.value = 0

  localStorage.removeItem('token')
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

  window.location.href = '/'
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
    <VanTabs
      v-model:active="activeTab"
      animated
      scrollspy
    >
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
                  @click="
                    () => {
                      loadVerifyCode()
                    }
                  "
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
            <VanCell>
              <VanCheckbox
                v-model="saveLogin"
                style="margin: 5px 0"
                >本機儲存登入資訊</VanCheckbox
              >
            </VanCell>
            <VanCell v-if="account.passwordHash !== '' && saveLogin === true">
              <VanCheckbox
                v-model="useLastLogin"
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
      <!--<VanTab title="查詢">-->
      <VanTab
        title="查詢"
        :disabled="account.token === ''"
      >
        <Enquiry
          ref="enquiryTab"
          :account="account"
          :logout="onClickLogout"
        />
      </VanTab>
      <VanTab disabled>
        <template #title>
          <van-badge :offset="[15, 3]">
            <template #content>
              <span>PRO</span>
            </template>
            {{ '快速申請' }}
          </van-badge>
        </template>
        <!-- TODO: in another version -->
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
