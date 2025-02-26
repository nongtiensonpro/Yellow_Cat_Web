<script setup lang="ts">
import Logo from "../components/logo.vue";

const links1 = [{
  label: 'Home',
  icon: 'i-heroicons-book-open',
  to: '/'
},{
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
</script>

<template>
  <div>
    <UHeader :links="links1">
      <template #logo>
        <Logo />
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
    <div class="m-4 p-4">
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
