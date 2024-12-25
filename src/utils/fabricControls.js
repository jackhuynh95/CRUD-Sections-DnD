import { fabric } from 'fabric-pure-browser';

// Custom delete control
export function createDeleteControl(onDelete) {
  const deleteImg = document.createElement('img');
  deleteImg.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Cpath d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" fill="%23ff0000"/%3E%3C/svg%3E';
  
  fabric.Object.prototype.controls.deleteControl = new fabric.Control({
    x: 0.5,
    y: -0.5,
    offsetY: -16,
    offsetX: 16,
    cursorStyle: 'pointer',
    mouseUpHandler: (eventData, transform) => deleteObject(eventData, transform, onDelete),
    render: renderIcon(deleteImg),
  });
}

function deleteObject(eventData, transform, onDelete) {
  const target = transform.target;
  const canvas = target.canvas;
  
  // Call the onDelete callback with the section ID
  if (onDelete && target.sectionId) {
    onDelete(target.sectionId);
  }
  
  canvas.remove(target);
  canvas.requestRenderAll();
  return true;
}

function renderIcon(icon) {
  return function(ctx, left, top, styleOverride, fabricObject) {
    const size = 24;
    ctx.save();
    ctx.translate(left, top);
    ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));
    ctx.drawImage(icon, -size/2, -size/2, size, size);
    ctx.restore();
  }
}