import { Component, ElementRef, HostListener, OnInit, Output, ViewChild } from '@angular/core';
import { CanvasRecorder } from "../canvas-recorder/canvas-recorder.component";

@Component({
  selector: 'app-canvas',
  imports: [CanvasRecorder],
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.less']
})
export class CanvasComponent implements OnInit {
  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  private _context!: CanvasRenderingContext2D;

  isDrawing!: boolean;
  private _prevX!: number;
  private _prevY!: number;
  readonly _subGridSize = 20;
  readonly _subGridColor = '#e0e0e0'; // Light gray color for sub-gridlines
  readonly _mainGridSize = 80;
  readonly _mainGridColor = '#b0b0b0'; // Darker gray for main-gridlines

  ngOnInit(): void {
    this.canvas.nativeElement.width = window.innerWidth;
    this.canvas.nativeElement.height = window.innerHeight;
    this._context = this.canvas.nativeElement.getContext('2d')!;
    this.drawGrid(); // Draw gridlines on the canvas
    this.isDrawing = false;
  }

  // Required for correct typing
  get canvasElement(): ElementRef<HTMLCanvasElement> {
    return this.canvas;
  }

  // Draws the gridlines on the canvas
  private drawGrid(): void {
    const { width, height } = this.canvas.nativeElement;

    // Draw vertical lines
    this._context.strokeStyle = this._subGridColor
    this._context.lineWidth = 0.5;
    for (let x = 0; x <= width; x += this._subGridSize) {
      this.drawLine(x, 0, x, height)
    }
    // Draw horizontal lines
    for (let y = 0; y <= height; y += this._subGridSize) {
      this.drawLine(0, y, width, y)
    }
    
     // Same for main-gridlines
     this._context.strokeStyle = this._mainGridColor
     this._context.lineWidth = 1;
    this._context.setLineDash([2, 4])
     for (let x = 0; x <= width; x += this._mainGridSize) {
       this.drawLine(x, 0, x, height)
     }
     for (let y = 0; y <= height; y += this._mainGridSize) {
      this.drawLine(0, y, width, y)
     }

     this._context.setLineDash([]);
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    this.isDrawing = true;
    this._context.strokeStyle = '#000';
    this._context.lineWidth = 2;

    const rect = this.canvas.nativeElement.getBoundingClientRect();
    this._prevX = event.clientX - rect.left;
    this._prevY = event.clientY - rect.top;
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isDrawing) return;

    const rect = this.canvas.nativeElement.getBoundingClientRect();
    const currentX = event.clientX - rect.left;
    const currentY = event.clientY - rect.top;

    this.drawLine(this._prevX, this._prevY, currentX, currentY);
    this._prevX = currentX;
    this._prevY = currentY;
  }

  @HostListener('mouseup')
  @HostListener('mouseleave')
  onMouseUp(): void {
    this.isDrawing = false;
  }

  // Draws a line between two points
  private drawLine(x1: number, y1: number, x2: number, y2: number): void {
    this._context.beginPath();
    this._context.moveTo(x1, y1);
    this._context.lineTo(x2, y2);
    this._context.stroke();
  }
}
