export function setupBoundaryConstraints(canvas, gridColumns, columnWidth, rowHeight) {
  canvas.on('object:moving', (e) => {
    const obj = e.target;
    const objWidth = obj.width * obj.scaleX;
    const maxLeft = canvas.width - objWidth;
    const maxTop = canvas.height - obj.height * obj.scaleY;

    // Constrain horizontal movement
    if (obj.left < 0) {
      obj.left = 0;
    } else if (obj.left > maxLeft) {
      obj.left = maxLeft;
    }

    // Constrain vertical movement
    if (obj.top < 0) {
      obj.top = 0;
    } else if (obj.top > maxTop) {
      obj.top = maxTop;
    }

    // Snap to grid
    obj.left = Math.round(obj.left / columnWidth()) * columnWidth();
    obj.top = Math.round(obj.top / rowHeight()) * rowHeight();
  });

  canvas.on('object:scaling', (e) => {
    const obj = e.target;
    const maxWidth = gridColumns() * columnWidth();
    
    // Prevent scaling beyond canvas width
    if (obj.width * obj.scaleX > maxWidth) {
      obj.scaleX = maxWidth / obj.width;
    }
    
    // Maintain minimum width of one column
    if (obj.width * obj.scaleX < columnWidth()) {
      obj.scaleX = columnWidth() / obj.width;
    }
    
    // Lock height scaling
    obj.scaleY = 1;
  });
}