<script setup>
import SectionManager from './components/SectionManager.vue'
import SectionManagerCanvas from './components/SectionManagerCanvas.vue'
</script>

<template>
  <div>
    <h1>DOM HTML Interacting</h1>
    <SectionManager msg="Vite + Vue" />

    <hr class="py-2"/>
    
    <h1>Canvas Drawing</h1>
    <SectionManagerCanvas msg="Vite + Vue" />
  </div>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
