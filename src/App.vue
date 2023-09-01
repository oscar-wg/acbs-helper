<script lang="ts" setup>
import { inject } from '@vercel/analytics'

defineOptions({
  name: 'App',
})

onMounted(() => {
  inject()
})
</script>

<template>
  <RouterView />
</template>
