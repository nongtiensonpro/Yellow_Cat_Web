<script setup lang="ts">

import Demo_com from "../demo/demo_com.vue";
</script>

<template>
  <UAvatar
      src="https://th.bing.com/th/id/OIP.fW6RxzXHQYRG6sjVThirfgHaGL?rs=1&pid=ImgDetMain"
      alt="Avatar"
  />
  <UNotification title="Table 1" :id="1" :timeout="0" />
  <demo_com/>
</template>

<style scoped>

</style>