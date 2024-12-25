<script setup>
import { ref } from 'vue';
import SectionList from './sections/SectionList.vue';
import SectionSelector from './sections/SectionSelector.vue';
import { useGridConfig } from '../composables/useGridConfig';
import { useSections } from '../composables/useSections';

const { gridConfig } = useGridConfig();
const { sections, addSection, deleteSection, toggleSection, editSectionColumn } = useSections();
</script>

<template>
  <div class="section-manager">
    <SectionSelector @add-section="addSection" />
    <SectionList 
      :sections="sections"
      :grid-config="gridConfig"
      @delete="deleteSection"
      @toggle="toggleSection"
      @edit-column="editSectionColumn"
    />
  </div>
</template>

<style scoped>
.section-manager {
  width: screen;
  /* padding: 20px; */
}
</style>