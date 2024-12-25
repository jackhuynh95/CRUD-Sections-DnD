import { ROW_HEIGHT } from '../constants/sectionTypes';

export function groupSectionsByRow(sections) {
  const groupedSections = {};

  sections.forEach(section => {
    const rowIndex = Math.floor(section.top / ROW_HEIGHT);
    if (!groupedSections[rowIndex]) {
      groupedSections[rowIndex] = [];
    }
    groupedSections[rowIndex].push(section);
  });

  return Object.values(groupedSections);
}

