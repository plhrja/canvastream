import { CommonModule } from "@angular/common";
import { Component, ElementRef, HostListener, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-canvas-recorder',
  imports: [CommonModule],
  templateUrl: './canvas-recorder.component.html',
  styleUrl: './canvas-recorder.component.less'
})
export class CanvasRecorder implements OnInit {
  @Input() isDrawing!: boolean;
  @Input() canvas!: ElementRef<HTMLCanvasElement>;

  isRecording!: boolean;

  ngOnInit(): void {
    this.isRecording = false;
  }

  toggleRecording(): void {
    this.isRecording = !this.isRecording
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent) { 
    if (event.code == 'Space') {
      this.toggleRecording();
    }
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isRecording) return;

    const rect = this.canvas.nativeElement.getBoundingClientRect();
    const currentX = event.clientX - rect.left;
    const currentY = event.clientY - rect.top;
    console.table({
      is_drawing: this.isDrawing,
      coordinates: {
        x: currentX,
        y: currentY
      }
    })
  }
}
