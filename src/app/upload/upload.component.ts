import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { UploadService } from '../services/upload.service';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css'],
})
export class UploadComponent implements OnInit {
  file!: File;
  @Input() resetSubject = new Subject<boolean>();
  @Input() submitSubject = new Subject<boolean>();
  @Output() fileAdded = new EventEmitter();
  @Output() fileSubmitted = new EventEmitter();

  //file upload variables
  errorMsg = '';
  imageTypes = ['image/png', 'image/jpg', 'image/jpeg'];
  imageType = this.imageTypes.toString();
  ImageSize = 10; // in MB
  showPreview = false;
  imageData: {
    edited: boolean;
    base64: string;
    src: string;
    alt: string;
    type: string;
  } = {
    edited: false,
    base64: '',
    src: '',
    alt: '',
    type: '',
  };

  // for canvas
  myCanvas: any;
  context!: CanvasRenderingContext2D;
  isDrawing = false;
  x = 0;
  y = 0;
  ongoingTouches: any[] = [];
  offsetY: any;
  offsetX: any;
  brushColor = '#000000';
  brushSize = 1;
  isEdited = false;
  showEdit = false;

  constructor(private uploadService: UploadService) {}

  ngOnInit(): void {
    this.resetSubject.subscribe((res) => {
      if (res) {
        this.removeFile();
      }
    });

    this.submitSubject.subscribe((res) => {
      if (res) {
        if (this.isEdited) {
          this.generateImageFromCanvas();
        } else {
          this.fileSubmitted.emit(true);
        }
      }
    });
  }

  onEditClick() {
    this.showEdit = !this.showEdit;
    if (this.showEdit) {
      this.startup();
    }
  }
  onFileChange(event: any, drag = false) {
    try {
      this.uploadService.startLoader();
      this.errorMsg = '';
      let file: any;
      if (drag) {
        file = event?.[0];
      } else {
        file = event?.target?.files?.[0];
      }
      if (
        !(file && this.validateFile(file, 1) && this.validateFileSize(file, 1))
      ) {
        this.uploadService.stopLoader();
        return;
      }
      const fileReader = new FileReader();
      fileReader.onloadend = () => {
        const base64String = this.convertToBase64(fileReader.result as string);
        this.imageData = {
          edited: false,
          base64: base64String,
          src: fileReader.result as string,
          alt: file.name,
          type: file.type,
        };

        this.fileAdded.emit(this.imageData);
        setTimeout(() => {
          this.myCanvas = document.getElementById('canvas');
          this.context = this.myCanvas?.getContext('2d');
          const image = new Image();
          image.src = this.imageData.src;
          image.onload = () => {
            this.drawImageScaled(image, this.context);
            this.uploadService.stopLoader();
          };
        }, 1000);
      };
      fileReader.readAsDataURL(file);
    } catch (error) {
      this.uploadService.stopLoader();
      this.removeFile();
    }
  }

  drawImageScaled(img: any, ctx: CanvasRenderingContext2D) {
    var canvas = ctx.canvas;
    const containerWidth = canvas?.parentElement?.clientWidth; // Get container width
    canvas.width = containerWidth || canvas.width;
    const containerHeight = canvas?.parentElement?.clientHeight; // Get container height
    canvas.height = containerHeight || canvas.height;

    const canvasWidth = canvas.clientWidth;
    const canvasHeight = canvas.clientHeight;

    const imageAspectRatio = img.width / img.height;
    const canvasAspectRatio = canvasWidth / canvasHeight;

    let renderedWidth, renderedHeight;
    if (imageAspectRatio < canvasAspectRatio) {
      // Image is wider than canvas, fit to height
      renderedHeight = canvasHeight;
      renderedWidth = img.width * (renderedHeight / img.height);
    } else {
      // img is taller than canvas, fit to width
      renderedWidth = canvasWidth;
      renderedHeight = img.height * (renderedWidth / img.width);
    }

    // canvas.style.width = renderableWidth.toString() + 'px';
    // canvas.style.height = renderableHeight.toString() + 'px';
    canvas.width = renderedWidth;
    canvas.height = renderedHeight;

    this.context.drawImage(img, 0, 0, renderedWidth, renderedHeight);
    this.showPreview = true;
  }

  validateFile(file: any, fileFormate: number): boolean {
    const ext = file.type;
    if (fileFormate == 1) {
      const fileExt = this.imageType.includes(ext);
      if (!fileExt) {
        this.errorMsg = 'Invalid Image format.';
        return false;
      }
    }
    return true;
  }

  validateFileSize(file: any, fileFormate: number): boolean {
    const size = file.size;
    if (fileFormate == 1) {
      if (size > this.ImageSize * 1000000) {
        this.errorMsg = `File can't be more than ${this.ImageSize}MB.`;
        return false;
      }
    }
    return true;
  }

  removeFile() {
    this.errorMsg = '';
    this.imageData = {
      edited: false,
      base64: '',
      src: '',
      alt: '',
      type: '',
    };
    this.brushColor = '#000000';
    this.brushSize = 1;
    this.isEdited = false;
    this.showPreview = false;
  }

  startup() {
    const canvas = this.myCanvas;
    this.context = canvas.getContext('2d');

    // Remove any existing event listeners before adding new ones
    canvas.removeEventListener('touchstart', this.handleStart);
    canvas.removeEventListener('touchend', this.handleEnd);
    canvas.removeEventListener('touchcancel', this.handleCancel);
    canvas.removeEventListener('touchmove', this.handleMove);
    canvas.removeEventListener('mousedown', (event: any) =>
      this.handleMouseDown(event)
    );
    canvas.removeEventListener('mousemove', (event: any) =>
      this.handleMouseMove(event)
    );
    canvas.removeEventListener('mouseup', (event: any) =>
      this.handleMouseUp(event)
    );

    // Add new event listeners
    canvas.addEventListener('touchstart', this.handleStart);
    canvas.addEventListener('touchend', this.handleEnd);
    canvas.addEventListener('touchcancel', this.handleCancel);
    canvas.addEventListener('touchmove', this.handleMove);
    canvas.addEventListener('mousedown', (event: any) =>
      this.handleMouseDown(event)
    );
    canvas.addEventListener('mousemove', (event: any) =>
      this.handleMouseMove(event)
    );
    canvas.addEventListener('mouseup', (event: any) =>
      this.handleMouseUp(event)
    );
  }

  handleMouseDown(evt: { offsetX: number; offsetY: number }) {
    this.x = evt.offsetX;
    this.y = evt.offsetY;
    this.isDrawing = true;
  }

  handleMouseMove(evt: { offsetX: number; offsetY: number }) {
    if (this.isDrawing) {
      this.drawLine(this.context, this.x, this.y, evt.offsetX, evt.offsetY);
      this.x = evt.offsetX;
      this.y = evt.offsetY;
    }
  }

  handleMouseUp(evt: { offsetX: any; offsetY: any }) {
    if (this.isDrawing) {
      this.drawLine(this.context, this.x, this.y, evt.offsetX, evt.offsetY);
      this.x = 0;
      this.y = 0;
      this.isDrawing = false;
    }
  }

  handleStart(evt: TouchEvent) {
    evt.preventDefault();
    const touches = evt.changedTouches;
    this.offsetX = this.myCanvas.getBoundingClientRect().left;
    this.offsetY = this.myCanvas.getBoundingClientRect().top;

    for (let i = 0; i < touches.length; i++) {
      this.ongoingTouches.push(this.copyTouch(touches[i]));
    }
  }

  handleMove(evt: TouchEvent) {
    evt.preventDefault();
    const touches = evt.changedTouches;

    for (let i = 0; i < touches.length; i++) {
      const idx = this.ongoingTouchIndexById(touches[i].identifier);
      if (idx >= 0) {
        this.context.beginPath();
        this.context.moveTo(
          this.ongoingTouches[idx].clientX - this.offsetX,
          this.ongoingTouches[idx].clientY - this.offsetY
        );
        this.context.lineTo(
          touches[i].clientX - this.offsetX,
          touches[i].clientY - this.offsetY
        );
        this.context.lineWidth = this.brushSize;
        this.context.strokeStyle = this.brushColor;
        this.context.lineJoin = 'round';
        this.context.closePath();
        this.context.stroke();
        this.isEdited = true;
        this.imageData.edited = true;
        this.ongoingTouches.splice(idx, 1, this.copyTouch(touches[i])); // swap in the new touch record
      }
    }
  }

  handleEnd(evt: TouchEvent) {
    evt.preventDefault();
    const touches = evt.changedTouches;

    for (let i = 0; i < touches.length; i++) {
      const color = (document.getElementById('selColor') as HTMLInputElement)
        .value;
      let idx = this.ongoingTouchIndexById(touches[i].identifier);
      if (idx >= 0) {
        this.context.lineWidth = (
          document.getElementById('selWidth') as HTMLInputElement
        ).valueAsNumber;
        this.context.fillStyle = color;
        this.ongoingTouches.splice(idx, 1); // remove it; we're done
      }
    }
  }

  handleCancel(evt: any) {
    evt.preventDefault();
    const touches = evt.changedTouches;
    for (let i = 0; i < touches.length; i++) {
      let idx = this.ongoingTouchIndexById(touches[i].identifier);
      this.ongoingTouches.splice(idx, 1); // remove it; we're done
    }
  }

  copyTouch({ identifier, clientX, clientY }: Touch) {
    return { identifier, clientX, clientY };
  }

  ongoingTouchIndexById(idToFind: number) {
    for (let i = 0; i < this.ongoingTouches.length; i++) {
      const id = this.ongoingTouches[i].identifier;
      if (id === idToFind) {
        return i;
      }
    }
    return -1; // not found
  }

  drawLine(
    context: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: any,
    y2: any
  ) {
    context.beginPath();
    // context.strokeStyle = document.getElementById("selColor").value;
    // context.lineWidth = document.getElementById("selWidth").value;
    context.strokeStyle = this.brushColor;
    context.lineWidth = this.brushSize;
    context.lineJoin = 'round';
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.closePath();
    context.stroke();
    this.isEdited = true;
    this.imageData.edited = true;
  }

  clearArea() {
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.clearRect(
      0,
      0,
      this.context.canvas.width,
      this.context.canvas.height
    );
  }

  onColorChange(event: any) {
    this.brushColor = event.target.value;
  }

  onSizeChange(event: any) {
    this.brushSize = parseInt(event.target.value);
  }

  generateImageFromCanvas() {
    const canvasImage = this.myCanvas.toDataURL();
    this.imageData.base64 = this.convertToBase64(canvasImage);
    this.imageData.src = canvasImage;
    this.fileSubmitted.emit(true);
  }

  convertToBase64(imgUrl: string) {
    return imgUrl.replace('data:', '').replace(/^.+,/, '');
  }
}
