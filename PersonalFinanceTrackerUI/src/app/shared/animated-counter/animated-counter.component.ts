import { Component, Input, signal, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-animated-counter',
  standalone: true,
  template: `<span>{{ display() }}</span>`,
})
export class AnimatedCounterComponent implements AfterViewInit {
  @Input() value = 0;
  @Input() duration = 1100;
  @Input({ required: false }) formatter: (v: number) => string = (v) => Math.round(v).toString();

  private _display = signal('0');
  get display() { return this._display; }

  ngAfterViewInit() {
    const start = performance.now();
    const from = 0;
    const to = this.value;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);

    setTimeout(() => {
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / this.duration);
        const v = from + (to - from) * ease(t);
        this._display.set(this.formatter(v));
        if (t < 1) requestAnimationFrame(tick);
        else this._display.set(this.formatter(to));
      };

      requestAnimationFrame(tick);
    }, 100);
  }
}
