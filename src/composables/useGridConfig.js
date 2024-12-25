import { reactive } from 'vue';

export function useGridConfig() {
  const gridConfig = reactive({
    cols: 3,
    rowHeight: 100,
    margin: 10,
    maxRows: 4
  });

  return {
    gridConfig
  };
}