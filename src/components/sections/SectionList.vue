<script setup>
import { defineProps, defineEmits } from 'vue';
import VueDraggableResizable from 'vue-draggable-resizable';
import SectionItem from './SectionItem.vue';

const props = defineProps({
  sections: {
    type: Array,
    required: true
  },
  gridConfig: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['delete', 'toggle', 'edit-column']);

const width = window.innerWidth

const onResize = (section, newRect) => {
  const maxWidth = (width / props.gridConfig.cols) * section.maxCols;
  if (newRect.width > maxWidth) {
    newRect.width = maxWidth;
  }
};
</script>

<template>
  <div class="grid-container" :style="{ height: gridConfig.rowHeight * gridConfig.maxRows + 'px' }">
    <div v-for="section in sections" :key="section.id">
      <!-- :parent="true" -->
      <vue-draggable-resizable
        :x="section.x"
        :y="section.y"
        :w="section.width"
        :h="section.height"
        :draggable="section.draggable"
        :resizable="section.resizable"
        :grid="[gridConfig.margin, gridConfig.margin]"
        :max-width="(width / gridConfig.cols) * section.maxCols"
        @resizing="(x, y, width, height) => onResize(section, { x, y, width, height })"
        class="section-item"
      >
        <SectionItem 
          :section="section"
          @delete="$emit('delete', section.index)"
          @toggle="$emit('toggle', section.index)"
          @edit-column="columnIndex => $emit('edit-column', section.index, columnIndex)"
        />
      </vue-draggable-resizable>
    </div>
  </div>
</template>

<style scoped>
.grid-container {
  position: relative;
  width: 100%;
  background: #f5f5f5;
  margin-top: 20px;
}

.section-item {
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>