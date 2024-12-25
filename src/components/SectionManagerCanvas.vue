<template>
  <v-card>
    <v-card-title>
      Section Manager
      <v-spacer></v-spacer>
      <v-btn @click="exportJSON">Export Sections</v-btn>
    </v-card-title>
    <v-card-text>
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
          <canvas ref="fabricCanvas" width="600" height="400"></canvas>
        </v-col>
        <v-col cols="12" md="4">
          <v-list dense>
            <v-list-item
              v-for="(section, index) in sections"
              :key="section.id"
              :class="{ 'highlighted': hoveredSection === section.id }"
              @mouseover="hoveredSection = section.id"
              @mouseleave="hoveredSection = null"
              @focus="hoveredSection = section.id"
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
      canvas: null,
      gridColumns: 3,
      columnWidth: 200,
      rowHeight: 100,
      hoveredSection: null,
    };
  },
  mounted() {
    this.$nextTick(() => {
      this.initFabricCanvas();
    });
  },
  methods: {
    initFabricCanvas() {
      this.canvas = new fabric.Canvas(this.$refs.fabricCanvas, {
        width: this.gridColumns * this.columnWidth,
        height: 400,
        backgroundColor: '#f0f0f0',
        selection: false,
      });

      this.drawGrid();

      this.canvas.on('object:moving', this.snapToGrid);
      this.canvas.on('object:scaling', this.limitResize);
      // this.canvas.on('object:rotating', this.limitRotate);
    },
    drawGrid() {
      for (let i = 1; i < this.gridColumns; i++) {
        this.canvas.add(new fabric.Line([i * this.columnWidth, 0, i * this.columnWidth, this.canvas.height], {
          stroke: '#ccc',
          selectable: false,
          evented: false,
        }));
      }
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

      this.canvas.add(fabricObject);
      this.canvas.renderAll();
    },
    deleteSection(index) {
      const sectionId = this.sections[index].id;
      this.sections.splice(index, 1);
      const objectsToRemove = this.canvas.getObjects().filter(obj => obj.sectionId === sectionId);
      objectsToRemove.forEach(obj => this.canvas.remove(obj));
      this.canvas.renderAll();
    },
    snapToGrid(e) {
      const target = e.target;
      const gridSizeX = this.columnWidth;
      const gridSizeY = this.rowHeight;
      target.set({
        left: Math.round(target.left / gridSizeX) * gridSizeX,
        top: Math.round(target.top / gridSizeY) * gridSizeY,
      });
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

      target.set({
        scaleX: columns,
        scaleY: 1,
      });

      const section = this.sections.find(s => s.id === target.sectionId);
      if (section) {
        section.columns = columns;
      }
    },
    // limitRotate (e) {
    //   const target = e.target;
    //   target.set({
    //     rotateX: 1,
    //     rotateY: 1,
    //     rotateZ: 1,
    //   });
    // },
    exportJSON() {
      console.log(JSON.stringify(this.sections));
    },
    checkOverlap(newSection) {
      return this.sections.some(existingSection =>
        newSection.left < existingSection.left + existingSection.columns * this.columnWidth &&
        newSection.left + newSection.columns * this.columnWidth > existingSection.left &&
        newSection.top < existingSection.top + this.rowHeight &&
        newSection.top + this.rowHeight > existingSection.top
      );
    },
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
