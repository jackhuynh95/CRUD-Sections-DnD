import { ref } from 'vue';
import { sectionTypes } from '../constants/sectionTypes';
import { getMaxColumns } from '../utils/sectionUtils';

export function useSections() {
  const sections = ref([]);

  const addSection = (sectionId) => {
    const section = sectionTypes.find(s => s.id === sectionId);
    if (!section) return;

    const maxCols = getMaxColumns(section.type);
    
    sections.value.push({
      ...section,
      index: sections.value.length,
      active: false,
      x: 0,
      y: 0,
      width: 200,
      height: 100,
      maxCols,
      draggable: true,
      resizable: true
    });
  };

  const deleteSection = (index) => {
    sections.value = sections.value.filter((s, i) => i !== index);
  };

  const toggleSection = (index) => {
    const section = sections.value[index];
    if (section) {
      section.active = !section.active;
    }
  };

  const editSectionColumn = (sectionIndex, columnIndex) => {
    // Handle column editing
  };

  return {
    sections,
    addSection,
    deleteSection,
    toggleSection,
    editSectionColumn
  };
}