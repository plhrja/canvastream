import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CanvasComponent } from "./canvas/canvas.component";

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    CanvasComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  title = 'canvastream';
}
