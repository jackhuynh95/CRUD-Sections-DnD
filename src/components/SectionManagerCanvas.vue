<template>
  <v-card>
    <v-card-title>
      Section Manager
      <v-spacer></v-spacer>
      <v-btn style="margin-right: 20px;" @click="visibleSelection = !visibleSelection">Show / Hide Sections</v-btn>
      <v-btn @click="exportJSON">Export Sections</v-btn>
    </v-card-title>
    <v-card-text>
      <!-- Increase/Decrease rows and columns -->
      <v-row>
        <v-col cols="6">
          <v-btn-toggle mandatory>
            <v-btn @click="changeGridSize('column', -1)">
              <v-icon>mdi-minus</v-icon>
            </v-btn>
            <v-btn disabled>{{ gridColumns }} Columns</v-btn>
            <v-btn @click="changeGridSize('column', 1)">
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </v-btn-toggle>
        </v-col>
        <v-col cols="6">
          <v-btn-toggle mandatory>
            <v-btn @click="changeGridSize('row', -1)">
              <v-icon>mdi-minus</v-icon>
            </v-btn>
            <v-btn disabled>{{ gridRows }} Rows</v-btn>
            <v-btn @click="changeGridSize('row', 1)">
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </v-btn-toggle>
        </v-col>
      </v-row>

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
          <div ref="canvasContainer" style="height: 400px; overflow-y: auto;">
            <canvas ref="fabricCanvas"></canvas>
          </div>
        </v-col>
        <v-col cols="12" md="4" v-if="visibleSelection">
          <v-list dense >
            <v-list-item
              v-for="(section, index) in sections"
              :key="section.id"
              :class="{ 'highlighted': hoveredSection === section.id }"
              @mouseover="hoveredSection = section.id"
              @mouseleave="hoveredSection = null"
              @focus="focusSection(section.id)"
              @blur="hoveredSection = null"
            >
              <v-list-item-content>
                <v-list-item-title>{{ section.name }}</v-list-item-title>
                <v-list-item-subtitle>({{ section.type }}) - Columns: {{ section.columns }}</v-list-item-subtitle>
              </v-list-item-content>
              <v-list-item-action>
                <v-btn icon small @click="deleteSection(index)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </v-list-item-action>
            </v-list-item>
          </v-list>
        </v-col>
      </v-row>
    </v-card-text>
    <v-card-actions>
      <v-btn @click="undo" :disabled="!canUndo">Undo</v-btn>
      <v-btn @click="redo" :disabled="!canRedo">Redo</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import { fabric } from 'fabric-pure-browser';
import 'fabric-pure-browser';
import { createDeleteControl } from '../utils/fabricControls';
import { setupBoundaryConstraints } from '../utils/fabricBoundary';
import { groupSectionsByRow  } from '../utils/fabric';
import { sectionTypes as NEW_SECTIONS, COLUMN_WIDTH, ROW_HEIGHT, GRID_COLUMNS, GRID_ROWS } from '../constants/sectionTypes';

export default {
  data() {
    return {
      newSections: NEW_SECTIONS,
      selectedNewSection: 0,
      sections: [],
      canvas: null,
      gridColumns: GRID_COLUMNS,
      gridRows: GRID_ROWS,
      columnWidth: COLUMN_WIDTH,
      rowHeight: ROW_HEIGHT,
      hoveredSection: null,
      visibleSelection: true,
      history: [],
      historyIndex: -1,
    };
  },
  computed: {
    groupedSections() {
      return groupSectionsByRow(this.sections);
    },
    canUndo() {
      return this.historyIndex > 0;
    },
    canRedo() {
      return this.historyIndex < this.history.length - 1;
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.initFabricCanvas();
      // Pass the handleDelete callback to createDeleteControl
      createDeleteControl(this.handleDelete);
      setupBoundaryConstraints(
        this.canvas, 
        this.gridColumns, 
        this.columnWidth, 
        this.rowHeight
      );
    });
  },
  methods: {
    initFabricCanvas() {
      this.canvas = new fabric.Canvas(this.$refs.fabricCanvas, {
        width: this.gridColumns * this.columnWidth,
        height: this.gridRows * this.rowHeight,
        backgroundColor: '#f0f0f0',
        selection: false,
      });

      this.drawGrid();

      this.canvas.on('object:moving', (e) => {
        this.snapToGrid(e);
        if (this.checkOverlap(this.fabricObjectToSection(e.target))) {
          e.target.set(e.transform.original);
          this.canvas.renderAll();
        }
      });

      this.canvas.on('object:scaling', (e) => {
        this.limitResize(e);
        if (this.checkOverlap(this.fabricObjectToSection(e.target))) {
          e.target.set(e.transform.original);
          this.canvas.renderAll();
        }
      });

      this.canvas.on('object:modified', this.addToHistory);

      // this.$refs.canvasContainer.addEventListener('scroll', this.handleScroll);
    },
    drawGrid() {
      this.canvas.clear();
      this.canvas.setWidth(this.gridColumns * this.columnWidth);
      this.canvas.setHeight(this.gridRows * this.rowHeight);

      for (let i = 1; i < this.gridColumns; i++) {
        this.canvas.add(new fabric.Line([i * this.columnWidth, 0, i * this.columnWidth, this.canvas.height], {
          stroke: '#ccc',
          selectable: false,
          evented: false,
        }));
      }

      for (let i = 1; i < this.gridRows; i++) {
        this.canvas.add(new fabric.Line([0, i * this.rowHeight, this.canvas.width, i * this.rowHeight], {
          stroke: '#ccc',
          selectable: false,
          evented: false,
        }));
      }

      this.redrawSections();
    },
    redrawSections() {
      this.sections.forEach(section => {
        const existingObject = this.canvas.getObjects().find(obj => obj.sectionId === section.id);
        if (existingObject) {
          this.canvas.remove(existingObject);
        }
        this.addSectionToCanvas(section);
      });
    },
    changeGridSize(type, change) {
      if (type === 'column') {
        this.gridColumns = Math.max(1, this.gridColumns + change);
      } else {
        this.gridRows = Math.max(1, this.gridRows + change);
      }
      this.drawGrid();
      this.addToHistory();
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
          width: this.columnWidth,
          height: this.rowHeight,
        };
        if (!this.checkOverlap(section)) {
          this.sections.push(section);
          this.addSectionToCanvas(section);
          this.addToHistory();
        } else {
          console.warn('Cannot place section: overlaps with existing section');
        }
        this.selectedNewSection = 0;
      }
    },
    getNextAvailableRow() {
      const occupiedRows = this.sections.map(s => Math.floor(s.top / this.rowHeight));
      let row = 0;
      while (occupiedRows.includes(row)) {
        row++;
      }
      return row;
    },
    addSectionToCanvas(section) {
      let fabricObject, rectObject, textObject;

      const width = this.columnWidth;
      const height = this.rowHeight;

      switch (section.type) {
        case 'text':
          // Improved 'text' section rendering
          fabricObject = new fabric.Textbox(section.name, {
            left: section.left,
            top: section.top,
            width: width,
            height: height,
            fontSize: 16,
            fill: '#333',
            backgroundColor: '#f8f8f8',
            borderColor: '#ddd',
            borderWidth: 1,
            padding: 5,
          });
          break;
        case 'image':
        case 'gif':
          rectObject = new fabric.Rect({
            left: section.left,
            top: section.top,
            width: width,
            height: height,
            fill: '#cccccc',
          });
          textObject = new fabric.Text(section.name, {
            left: section.left + 5,
            top: section.top + (section.type === 'button' ? height / 2 - 7 : 5),
            fontSize: 14,
            fill: section.type === 'button' ? 'white' : 'black',
            selectable: false,
            evented: false,
          });

          fabricObject = new fabric.Group([rectObject, textObject], {
            left: section.left,
            top: section.top,
            width: width,
            height: height,
          });
          break;
        case 'button':
          rectObject = new fabric.Rect({
            left: section.left,
            top: section.top,
            width: width,
            height: height,
            fill: '#4CAF50',
            rx: 5,
            ry: 5,
          });
          textObject = new fabric.Text(section.name, {
            left: section.left + 5,
            top: section.top + height / 2 - 7,
            fontSize: 14,
            fill: 'white',
            selectable: false,
            evented: false,
          });

          fabricObject = new fabric.Group([rectObject, textObject], {
            left: section.left,
            top: section.top,
            width: width,
            height: height,
          });
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
          fabricObject.addWithUpdate(new fabric.Text(section.name, {
            left: section.left + 5,
            top: section.top + 5,
            fontSize: 14,
            selectable: false,
            evented: false,
          }));
          section.columns = columns;
          break;
        case 'code':
          rectObject = new fabric.Rect({
            left: section.left,
            top: section.top,
            width: width,
            height: height,
            fill: '#2c3e50',
          });
          textObject = new fabric.Text('{ code }', {
            left: section.left + 5,
            top: section.top + height / 2 - 7,
            fontSize: 14,
            fill: '#ecf0f1',
            selectable: false,
            evented: false,
          });

          fabricObject = new fabric.Group([rectObject, textObject], {
            left: section.left,
            top: section.top,
            width: width,
            height: height,
          });
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
        lockMovementX: false,
        lockMovementY: false,
        lockScalingX: false,
        lockScalingY: false,
        lockRotation: true,
        hasControls: true,
        hasBorders: true,
        sectionId: section.id,
      });

      // Add delete control to the group
      fabricObject.setControlsVisibility({
        mtr: false, // hide rotation control
        deleteControl: true // show delete control
      });
      
      // Add the object to canvas
      this.canvas.add(fabricObject);
      this.canvas.renderAll();
    },
    // Add new method to handle delete events
    handleDelete(sectionId) {
      const index = this.sections.findIndex(section => section.id === sectionId);
      if (index !== -1) {
        this.sections.splice(index, 1);
        this.addToHistory();
      }
    },
    deleteSection(index) {
      const sectionId = this.sections[index].id;
      this.sections.splice(index, 1);
      const objectsToRemove = this.canvas.getObjects().filter(obj => obj.sectionId === sectionId);
      objectsToRemove.forEach(obj => this.canvas.remove(obj));
      this.canvas.renderAll();
      this.addToHistory();
    },
    focusSection(sectionId) {
      this.hoveredSection = sectionId;
      // You can add additional logic here to focus the section on the canvas if needed
    },
    snapToGrid(e) {
      const target = e.target;
      const gridSizeX = this.columnWidth;
      const gridSizeY = this.rowHeight;
      const newLeft = Math.round(target.left / gridSizeX) * gridSizeX;
      const newTop = Math.round(target.top / gridSizeY) * gridSizeY;

      target.set({
        left: newLeft,
        top: newTop,
      });

      const section = this.sections.find(s => s.id === target.sectionId);
      if (section) {
        section.left = newLeft;
        section.top = newTop;
      }
    },
    limitResize(e) {
      const target = e.target;
      const minColumns = 1;
      const maxColumns = 3;
      const gridSize = this.columnWidth;

      let width = target.width * target.scaleX;
      let columns = Math.round(width / gridSize);

      if (columns < minColumns) columns = minColumns;
      if (columns > maxColumns) columns = maxColumns;

      const newWidth = columns * gridSize;

      target.set({
        width: newWidth,
        // scaleX: columns,
        scaleX: 1,
        scaleY: 1,
      });

      const section = this.sections.find(s => s.id === target.sectionId);
      if (section) {
        section.columns = columns;
        section.width = newWidth;
      }
    },
    //#region [Scroll Loader]
    // handleScroll() {
    //   const scrollTop = this.$refs.canvasContainer.scrollTop;
    //   const scrollHeight = this.$refs.canvasContainer.scrollHeight;
    //   const clientHeight = this.$refs.canvasContainer.clientHeight;

    //   if (scrollHeight - scrollTop === clientHeight) {
    //     this.gridRows += 2;
    //     this.drawGrid();
    //   }
    // },
    //#endregion
    //#region [Undo/Redo functionality]
    addToHistory() {
      this.history = this.history.slice(0, this.historyIndex + 1);
      this.history.push(JSON.stringify(this.sections));
      this.historyIndex = this.history.length - 1;
    },
    undo() {
      if (this.canUndo) {
        this.historyIndex--;
        this.sections = JSON.parse(this.history[this.historyIndex]);
        this.redrawSections();
      }
    },
    redo() {
      if (this.canRedo) {
        this.historyIndex++;
        this.sections = JSON.parse(this.history[this.historyIndex]);
        this.redrawSections();
      }
    },
    //#endregion
    //#region [JSON DATA]
    exportJSON() {
      const sections = JSON.stringify(this.sections);
      console.log("🚀 ~ exportJSON ~ sections:", sections)
      return sections;
    },
    //#endregion
    //#region [Check Overlay]
    checkOverlap(newSection) {
      return this.sections.some(existingSection => {
        if (existingSection.id === newSection.id) return false; // Don't check against itself
        return (
          newSection.left < existingSection.left + existingSection.columns * this.columnWidth &&
          newSection.left + newSection.columns * this.columnWidth > existingSection.left &&
          newSection.top < existingSection.top + this.rowHeight &&
          newSection.top + this.rowHeight > existingSection.top
        );
      });
    },
    fabricObjectToSection(fabricObject) {
      return {
        id: fabricObject.sectionId,
        left: fabricObject.left,
        top: fabricObject.top,
        columns: Math.round(fabricObject.width / this.columnWidth),
        width: fabricObject.width,
        height: fabricObject.height,
      };
    },
    //#endregion
  },
};
</script>

<style scoped>
canvas {
  border: 1px solid #ccc;
}

.highlighted {
  background-color: rgba(0, 0, 0, 0.1);
}
</style>
