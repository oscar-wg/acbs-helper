<script lang="ts" setup>
defineOptions({
  name: 'Header',
})

const showSetting = ref(false)
const setting = ref<any>(null)
const webTitle = import.meta.env.VITE_APP_NAME

onMounted(() => {
  if (setting.value) {
    setting.value.init()
  }
})
</script>

<template>
  <VanNavBar
    :title="webTitle"
    fixed
    @click-right="showSetting = true"
  >
    <template #right>
      <van-icon
        name="setting-o"
        size="18"
      />
    </template>
  </VanNavBar>
  <VanPopup
    v-model:show="showSetting"
    closeable
    position="bottom"
    style="background-color: #f7f8fa"
  >
    <Settings
      ref="setting"
      style="margin-top: 30px"
    />
  </VanPopup>
</template>

<style lang="scss"></style>
