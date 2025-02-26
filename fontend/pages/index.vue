<script setup lang="ts">

const links1 = [{
  label: 'Table 1',
  icon: 'i-heroicons-book-open',
  to: '/table1'
},{
  label: 'Table 2',
  icon: 'i-heroicons-book-open',
  to: '/table2'
}]

const links2 = [{
  label: 'Community',
  children: [{
    label: 'Nuxters',
    to: 'https://nuxters.nuxt.com',
    target: '_blank'
  }, {
    label: 'Video Courses',
    to: 'https://masteringnuxt.com/nuxt3?ref=nuxt',
    target: '_blank'
  }, {
    label: 'Nuxt on GitHub',
    to: 'https://github.com/nuxt',
    target: '_blank'
  }]
}, {
  label: 'Solutions',
  children: [{
    label: 'Nuxt Content',
    to: 'https://content.nuxt.com/',
    target: '_blank'
  }, {
    label: 'Nuxt DevTools',
    to: 'https://devtools.nuxt.com/',
    target: '_blank'
  }, {
    label: 'Nuxt Image',
    to: 'https://image.nuxt.com/',
    target: '_blank'
  }, {
    label: 'Nuxt UI',
    to: 'https://ui.nuxt.com/',
    target: '_blank'
  }]
}]
const items = [
  'https://picsum.photos/600/800?random=1',
  'https://picsum.photos/600/800?random=2',
  'https://picsum.photos/600/800?random=3',
  'https://picsum.photos/600/800?random=4',
  'https://picsum.photos/600/800?random=5',
  'https://picsum.photos/600/800?random=6'
]
</script>

<template>
  <div>
    <UHeader :links="links1">
      <template #logo>
        <Logo class="w-auto h-6" />
      </template>
      <template #right>
        <UColorModeButton />
        <UButton to="https://github.com/nuxt/ui" target="_blank" icon="i-simple-icons-github" color="gray"
          variant="ghost" />
        <UButton to="https://github.com/nuxt/ui" target="_blank" icon="material-symbols:login" color="gray"
          variant="ghost" />
      </template>
    </UHeader>
    <div class="container mx-auto p-4">
      <div class="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
        <NuxtPage />
      </div>
    </div>
    <UCarousel v-slot="{ item }" :items="items">
      <img :src="item" width="300" height="400" draggable="false">
    </UCarousel>
    <div class="m-4">
      <UFooterColumns :links="links2">
        <template #right>
          <UFormGroup name="email" label="Subscribe to our newsletter" size="lg">
            <UInput type="email" :ui="{ icon: { trailing: { pointer: '' } } }">
              <template #trailing>
                <UButton type="submit" size="2xs" color="black" label="Subscribe" />
              </template>
            </UInput>
          </UFormGroup>
        </template>
      </UFooterColumns>
    </div>
  </div>
</template>
