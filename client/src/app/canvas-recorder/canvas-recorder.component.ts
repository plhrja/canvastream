import { CommonModule } from "@angular/common";
import { Component, ElementRef, HostListener, Input, OnInit } from '@angular/core';
import { v7 as uuidv7 } from 'uuid'
import { CanvasRecording, FirehoseService } from "../firehose/firehose.service";

@Component({
  selector: 'app-canvas-recorder',
  imports: [CommonModule],
  templateUrl: './canvas-recorder.component.html',
  styleUrl: './canvas-recorder.component.less'
})
export class CanvasRecorder implements OnInit {
  @Input() isDrawing!: boolean;
  @Input() canvas!: ElementRef<HTMLCanvasElement>;

  private _isRecording!: boolean;
  private _recordingId!: string | undefined;

  get isRecording(): boolean { return this._isRecording}

  constructor(private _firehoseService: FirehoseService) {}

  ngOnInit(): void {
    this._isRecording = false;
    this._recordingId = undefined;
  }

  toggleRecording(): void {
    this._isRecording = !this._isRecording
    this._recordingId = this._isRecording
      ? uuidv7()
      : undefined;
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent) { 
    if (event.code == 'Space') {
      this.toggleRecording();
    }
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this._isRecording) return;

    const rect = this.canvas.nativeElement.getBoundingClientRect();
    const currentX = event.clientX - rect.left;
    const currentY = event.clientY - rect.top;
    
    this._firehoseService.sendRecordingToFirehose(
      new CanvasRecording(
        (this._recordingId as string),
        new Date(),
        currentX,
        currentY,
        this.isDrawing
      )
    );
  }
}
