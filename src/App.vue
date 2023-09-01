<script lang="ts" setup>
import { Analytics } from '@vercel/analytics'

defineOptions({
  name: 'App',
})
</script>

<template>
  <RouterView />
  <Analytics />
</template>
