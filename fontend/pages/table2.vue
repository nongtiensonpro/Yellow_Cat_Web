<script setup lang="ts">

import Demo_com from "../demo/demo_com.vue";
</script>

<template>
  <UAvatar
      src="https://th.bing.com/th/id/R.8df1e953c615073cec372cc0534933d8?rik=A1hQWLZy7PCVgg&pid=ImgRaw&r=0"
      alt="Avatar"
  />
  <UNotification title="Table 2" :id="1" :timeout="0" />
  <demo_com/>
</template>

<style scoped>

</style>