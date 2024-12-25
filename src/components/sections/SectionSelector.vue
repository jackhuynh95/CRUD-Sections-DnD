<script setup>
import { ref } from 'vue';
import { sectionTypes } from '../../constants/sectionTypes';

const selectedSection = ref(0);
const emit = defineEmits(['add-section']);

const handleChange = () => {
  if (selectedSection.value === 0) return;
  emit('add-section', selectedSection.value);
  selectedSection.value = 0;
};
</script>

<template>
  <!-- <v-select
    v-model="selectedSection"
    :items="sectionTypes"
    item-text="name"
    item-value="id"
    label="Add a section"
    dense
    @change="handleChange"
  /> -->
  <select id="sectionSelect" v-model="selectedSection" @change="handleChange">
    <option value="" disabled selected>Add a section</option>
    <option v-for="section in sectionTypes" :key="section.id" :value="section.id">
      {{ section.name }}
    </option>
  </select>
</template>