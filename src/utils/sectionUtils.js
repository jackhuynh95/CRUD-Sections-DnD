export function getMaxColumns(type) {
  switch (type) {
    case 'group1': return 1;
    case 'group2': return 2;
    case 'group3': return 3;
    default: return 1;
  }
}