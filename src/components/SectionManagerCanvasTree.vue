<template>
  <v-card>
    <v-card-title>Section Manager</v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="4">
          <v-btn-toggle v-model="gridRows" mandatory>
            <v-btn @click="gridRows = Math.max(1, gridRows - 1)">
              <v-icon>mdi-minus</v-icon>
            </v-btn>
            <v-btn disabled>{{ gridRows }} Rows</v-btn>
            <v-btn @click="gridRows++">
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </v-btn-toggle>
        </v-col>
        <v-col cols="4">
          <v-btn-toggle>
            <v-btn @click="zoomOut" :disabled="zoomLevel === 0">
              <v-icon>mdi-magnify-minus</v-icon>
            </v-btn>
            <v-btn disabled>Zoom {{ zoomLevel + 1 }}</v-btn>
            <v-btn @click="zoomIn" :disabled="zoomLevel === zoomLevels.length - 1">
              <v-icon>mdi-magnify-plus</v-icon>
            </v-btn>
          </v-btn-toggle>
        </v-col>
      </v-row>

      <v-breadcrumbs :items="breadcrumbs" @click:item="navigateToBreadcrumb">
        <template v-slot:item="{ item }">
          <v-breadcrumbs-item :disabled="item.disabled">
            {{ item.text }}
          </v-breadcrumbs-item>
        </template>
      </v-breadcrumbs>

      <!-- <v-select
        v-model="selectedNewSection"
        :items="newSections"
        item-text="name"
        item-value="id"
        label="Add a section"
        dense
        @change="addNewSection"
      ></v-select> -->
      <select id="sectionSelect" v-model="selectedNewSection" @change="addNewSection">
        <option value="" disabled selected>Add a section</option>
        <option v-for="section in newSections" :key="section.id" :value="section.id">
          {{ section.name }}
        </option>
      </select>

      <v-row>
        <v-col cols="12" md="8">
          <div ref="canvasContainer" style="height: 400px; overflow: auto;">
            <canvas ref="fabricCanvas"></canvas>
          </div>
        </v-col>
        <v-col cols="12" md="4">
          <v-list dense>
            <v-list-item v-for="(section, index) in currentLevelSections" :key="section.id">
              <v-list-item-content>
                <v-list-item-title>{{ section.name }}</v-list-item-title>
                <v-list-item-subtitle>({{ section.type }}) - Columns: {{ section.columns }}</v-list-item-subtitle>
              </v-list-item-content>
              <v-list-item-action>
                <v-btn icon small @click="deleteSection(index)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
                <v-btn v-if="section.children" icon small @click="navigateToChild(section)">
                  <v-icon>mdi-chevron-right</v-icon>
                </v-btn>
              </v-list-item-action>
            </v-list-item>
          </v-list>
        </v-col>
      </v-row>
    </v-card-text>
    <v-card-actions>
      <v-btn @click="exportTree">Export Tree</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import { fabric } from 'fabric-pure-browser';
import 'fabric-pure-browser';

export default {
  data() {
    return {
      newSections: [
        { id: 0, type: "", name: "Select a Section" },
        { id: 1, type: "text", name: "Text" },
        { id: 2, type: "image", name: "Image" },
        { id: 3, type: "button", name: "Button" },
        { id: 4, type: "separator", name: "Separator" },
        { id: 5, type: "gif", name: "Animated Gif" },
        { id: 6, type: "group1", name: "Group 1 Column" },
        { id: 7, type: "group2", name: "Group 2 Columns" },
        { id: 8, type: "group3", name: "Group 3 Columns" },
        { id: 9, type: "code", name: "Code" }
      ],
      selectedNewSection: 0,
      sections: [],
      currentPath: [],
      canvas: null,
      gridColumns: 3,
      gridRows: 4,
      zoomLevels: [
        { columnWidth: 100, rowHeight: 50 },
        { columnWidth: 200, rowHeight: 100 },
        { columnWidth: 300, rowHeight: 150 },
      ],
      zoomLevel: 1,
      canvasHeight: 400,
    };
  },
  computed: {
    columnWidth() {
      return this.zoomLevels[this.zoomLevel].columnWidth;
    },
    rowHeight() {
      return this.zoomLevels[this.zoomLevel].rowHeight;
    },
    canvasWidth() {
      return this.columnWidth * this.gridColumns;
    },
    currentLevelSections() {
      let current = this.sections;
      for (const pathItem of this.currentPath) {
        current = current.find(section => section.id === pathItem).children;
      }
      return current;
    },
    breadcrumbs() {
      const crumbs = [{ text: 'Root', disabled: false }];
      let current = this.sections;
      for (const pathItem of this.currentPath) {
        const section = current.find(section => section.id === pathItem);
        crumbs.push({ text: section.name, disabled: false });
        current = section.children;
      }
      crumbs[crumbs.length - 1].disabled = true;
      return crumbs;
    },
  },
  mounted() {
    this.initFabricCanvas();
  },
  methods: {
    initFabricCanvas() {
      this.canvas = new fabric.Canvas(this.$refs.fabricCanvas, {
        width: this.canvasWidth,
        height: this.canvasHeight,
        backgroundColor: '#f0f0f0',
        selection: false,
      });

      this.drawGrid();

      this.canvas.on('object:moving', this.snapToGrid);
      this.canvas.on('object:scaling', this.limitResize);
    },
    drawGrid() {
      this.canvas.clear();
      this.canvas.setWidth(this.canvasWidth);
      this.canvas.setHeight(this.canvasHeight);

      for (let i = 1; i < this.gridColumns; i++) {
        this.canvas.add(new fabric.Line([i * this.columnWidth, 0, i * this.columnWidth, this.canvasHeight], {
          stroke: '#ccc',
          selectable: false,
          evented: false,
        }));
      }

      for (let i = 1; i <= this.gridRows; i++) {
        this.canvas.add(new fabric.Line([0, i * this.rowHeight, this.canvasWidth, i * this.rowHeight], {
          stroke: '#ccc',
          selectable: false,
          evented: false,
        }));
      }

      this.redrawSections();
    },
    addNewSection() {
      const newSection = this.newSections.find(section => section.id === this.selectedNewSection);
      if (newSection) {
        const section = {
          id: `section-${Date.now()}`,
          type: newSection.type,
          name: newSection.name,
          left: 0,
          top: this.getNextAvailableRow() * this.rowHeight,
          columns: 1,
        };
        
        if (['group1', 'group2', 'group3'].includes(newSection.type)) {
          section.children = [];
        }

        if (this.currentPath.length === 0) {
          this.sections.push(section);
        } else {
          let current = this.sections;
          for (const pathItem of this.currentPath.slice(0, -1)) {
            current = current.find(section => section.id === pathItem).children;
          }
          current.find(section => section.id === this.currentPath[this.currentPath.length - 1]).children.push(section);
        }

        this.addSectionToCanvas(section);
        this.selectedNewSection = 0;
      }
    },
    getNextAvailableRow() {
      const occupiedRows = this.currentLevelSections.map(s => Math.floor(s.top / this.rowHeight));
      let row = 0;
      while (occupiedRows.includes(row)) {
        row++;
      }
      return row;
    },
    addSectionToCanvas(section) {
      let fabricObject;

      const width = this.columnWidth * section.columns;
      const height = this.rowHeight;

      switch (section.type) {
        case 'text':
          fabricObject = new fabric.Textbox(section.name, {
            left: section.left,
            top: section.top,
            width: width,
            height: height,
            fontSize: 16,
          });
          break;
        case 'image':
        case 'gif':
          fabricObject = new fabric.Rect({
            left: section.left,
            top: section.top,
            width: width,
            height: height,
            fill: '#cccccc',
          });
          this.canvas.add(new fabric.Text(section.name, {
            left: section.left + 5,
            top: section.top + 5,
            fontSize: 14,
            selectable: false,
            evented: false,
          }));
          break;
        case 'button':
          fabricObject = new fabric.Rect({
            left: section.left,
            top: section.top,
            width: width,
            height: height,
            fill: '#4CAF50',
            rx: 5,
            ry: 5,
          });
          this.canvas.add(new fabric.Text(section.name, {
            left: section.left + 5,
            top: section.top + height / 2 - 7,
            fontSize: 14,
            fill: 'white',
            selectable: false,
            evented: false,
          }));
          break;
        case 'separator':
          fabricObject = new fabric.Rect({
            left: section.left,
            top: section.top,
            width: width,
            height: 2,
            fill: '#000000',
          });
          break;
        case 'group1':
        case 'group2':
        case 'group3':
          const columns = parseInt(section.type.slice(-1));
          fabricObject = new fabric.Group([], {
            left: section.left,
            top: section.top,
            width: width * columns,
            height: height,
          });
          for (let i = 0; i < columns; i++) {
            fabricObject.addWithUpdate(new fabric.Rect({
              left: i * width,
              top: 0,
              width: width,
              height: height,
              fill: `rgba(173, 216, 230, ${0.5 + (i * 0.2)})`,
              stroke: 'blue',
              strokeWidth: 1,
            }));
          }
          this.canvas.add(new fabric.Text(section.name, {
            left: section.left + 5,
            top: section.top + 5,
            fontSize: 14,
            selectable: false,
            evented: false,
          }));
          section.columns = columns;
          break;
        case 'code':
          fabricObject = new fabric.Rect({
            left: section.left,
            top: section.top,
            width: width,
            height: height,
            fill: '#2c3e50',
          });
          this.canvas.add(new fabric.Text('{ code }', {
            left: section.left + 5,
            top: section.top + height / 2 - 7,
            fontSize: 14,
            fill: '#ecf0f1',
            selectable: false,
            evented: false,
          }));
          break;
        default:
          fabricObject = new fabric.Rect({
            left: section.left,
            top: section.top,
            width: width,
            height: height,
            fill: 'lightgray',
          });
      }

      fabricObject.set({
        borderColor: 'gray',
        cornerColor: 'black',
        cornerSize: 6,
        transparentCorners: false,
        lockMovementY: true,
        lockScalingY: true,
        hasControls: true,
        hasBorders: true,
        sectionId: section.id,
      });

      this.canvas.add(fabricObject);
      this.canvas.renderAll();
    },
    deleteSection(index) {
      let current = this.sections;
      for (const pathItem of this.currentPath.slice(0, -1)) {
        current = current.find(section => section.id === pathItem).children;
      }
      const sectionId = current[index].id;
      current.splice(index, 1);
      const objectsToRemove = this.canvas.getObjects().filter(obj => obj.sectionId === sectionId);
      objectsToRemove.forEach(obj => this.canvas.remove(obj));
      this.canvas.renderAll();
    },
    snapToGrid(e) {
      const target = e.target;
      const gridSize = this.columnWidth;
      target.set({
        left: Math.round(target.left / gridSize) * gridSize,
      });
    },
    limitResize(e) {
      const target = e.target;
      const minColumns = 1;
      const maxColumns = 3;

      let width = target.width * target.scaleX;
      let columns = Math.round(width / this.columnWidth);

      if (columns < minColumns) columns = minColumns;
      if (columns > maxColumns) columns = maxColumns;

      target.set({
        width: columns * this.columnWidth,
        scaleX: 1,
        scaleY: 1,
      });

      const section = this.findSectionById(target.sectionId);
      if (section) {
        section.columns = columns;
      }
    },
    redrawSections() {
      this.canvas.clear();
      this.drawGrid();
      this.currentLevelSections.forEach(section => {
        this.addSectionToCanvas(section);
      });
    },
    updateZoom() {
      this.canvas.setWidth(this.canvasWidth);
      this.canvas.setHeight(this.canvasHeight);
      this.drawGrid();
      this.currentLevelSections.forEach(section => {
        section.left = Math.round(section.left / this.columnWidth) * this.columnWidth;
        section.top = Math.round(section.top / this.rowHeight) * this.rowHeight;
      });
      this.redrawSections();
    },
    zoomIn() {
      if (this.zoomLevel < this.zoomLevels.length - 1) {
        this.zoomLevel++;
        this.updateZoom();
      }
    },
    zoomOut() {
      if (this.zoomLevel > 0) {
        this.zoomLevel--;
        this.updateZoom();
      }
    },
    navigateToChild(section) {
      this.currentPath.push(section.id);
      this.redrawSections();
    },
    navigateToBreadcrumb(item) {
      const index = this.breadcrumbs.indexOf(item);
      if (index === 0) {
        this.currentPath = [];
      } else {
        this.currentPath = this.currentPath.slice(0, index);
      }
      this.redrawSections();
    },
    findSectionById(id) {
      const findInTree = (sections) => {
        for (const section of sections) {
          if (section.id === id) {
            return section;
          }
          if (section.children) {
            const found = findInTree(section.children);
            if (found) return found;
          }
        }
        return null;
      };
      return findInTree(this.sections);
    },
    exportTree() {
      const exportLevel = (sections, level = 0) => {
        let result = '';
        for (const section of sections) {
          result += '  '.repeat(level) + `${section.name} (${section.type})\n`;
          if (section.children) {
            result += exportLevel(section.children, level + 1);
          }
        }
        return result;
      };
      const treeString = exportLevel(this.sections);
      console.log(treeString);
      // Here you could also save the string to a file or display it in the UI
    },
  },
};
</script>

<style scoped>
canvas {
  border: 1px solid #ccc;
}
</style>

