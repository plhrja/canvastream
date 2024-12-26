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
export class AppComponent implements OnInit, OnDestroy {
  ngOnDestroy(): void {
    throw new Error("Method not implemented.");
  }

  ngOnInit(): void {
    throw new Error("Method not implemented.");
  }

  title = 'canvastream';
}
