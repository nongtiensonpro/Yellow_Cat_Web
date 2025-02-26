<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { demo_store } from './demo_store';
import demo from './demo';

const { fetchDemo } = demo_store();

const List_Demo = ref<demo[]>([]);

onMounted(async () => {
  await fetchDemoList();
});

const fetchDemoList = async () => {
  const result = await fetchDemo();
  if (Array.isArray(result)) {
    List_Demo.value = result;
  } else {
    console.error('fetchDemo did not return an array');
  }
}

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'age', label: 'Age' }
];
</script>

<template>
  <div v-if="List_Demo.length>0" class="container mx-auto p-4">
    <UTable :columns="columns" :rows="List_Demo" />
  </div>
  <div v-else>
    <p>No data found.</p>
  </div>
</template>

<style scoped>
</style>