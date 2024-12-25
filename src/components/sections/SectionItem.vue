<script setup>
import { defineProps, defineEmits } from 'vue';
import { getMaxColumns } from '../../utils/sectionUtils';

defineProps({
  section: {
    type: Object,
    required: true
  }
});

defineEmits(['delete', 'toggle', 'edit-column']);
</script>

<template>
  <v-list-group
    v-model="section.active"
    active-class="activeSection"
    @click="$emit('toggle')"
  >
    <template v-slot:activator>
      <v-list-item-content>
        <v-list-item-title>{{ section.name }}</v-list-item-title>
        <v-list-item-subtitle>({{ section.type }})</v-list-item-subtitle>
      </v-list-item-content>
      <v-list-item-action>
        <v-icon small @click.stop="$emit('delete')">
          mdi-delete
        </v-icon>
      </v-list-item-action>
    </template>

    <template v-if="section.type.startsWith('group')">
      <v-list-item
        v-for="colIndex in getMaxColumns(section.type)"
        :key="colIndex"
        class="light-blue lighten-4"
        @click="$emit('edit-column', colIndex)"
      >
        <v-list-item-content>
          <v-list-item-title>Column {{ colIndex }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </template>
  </v-list-group>
</template>

<style scoped>
.activeSection {
  background-color: #e3f2fd;
}
</style>