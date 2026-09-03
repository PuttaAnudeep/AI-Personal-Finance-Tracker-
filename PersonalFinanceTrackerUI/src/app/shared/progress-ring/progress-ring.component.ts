import { Component, Input, signal, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-progress-ring',
  standalone: true,
  template: `
    <div class="relative inline-flex items-center justify-center" [style.width.px]="size" [style.height.px]="size">
      <svg [attr.width]="size" [attr.height]="size" [attr.viewBox]="viewBox" class="-rotate-90">
        <circle [attr.cx]="c" [attr.cy]="c" [attr.r]="r" fill="none"
                [attr.stroke]="trackColor" [attr.stroke-width]="strokeWidth" />
        <circle [attr.cx]="c" [attr.cy]="c" [attr.r]="r" fill="none"
                [attr.stroke]="color" [attr.stroke-width]="strokeWidth"
                stroke-linecap="round"
                [attr.stroke-dasharray]="circumference"
                [attr.stroke-dashoffset]="dashoffset()"
                [style.transition]="'stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)'"
                [attr.filter]="glow ? 'url(#ringGlow)' : null" />
        <defs>
          <filter id="ringGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
      </svg>
      <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
        <ng-content></ng-content>
      </div>
    </div>
  `,
})
export class ProgressRingComponent implements AfterViewInit {
  @Input() value = 0; // 0-100
  @Input() size = 120;
  @Input() strokeWidth = 10;
  @Input() color = '#6366F1';
  @Input() trackColor = 'rgba(100,116,139,0.15)';
  @Input() glow = false;

  private _dashoffset = signal(0);
  dashoffset = this._dashoffset.asReadonly();

  get c() { return this.size / 2; }
  get r() { return (this.size - this.strokeWidth) / 2; }
  get viewBox() { return `0 0 ${this.size} ${this.size}`; }
  get circumference() { return 2 * Math.PI * this.r; }

  ngAfterViewInit() {
    // animate from full offset (empty) to value
    this._dashoffset.set(this.circumference);
    setTimeout(() => {
      const pct = Math.max(0, Math.min(100, this.value)) / 100;
      this._dashoffset.set(this.circumference * (1 - pct));
    }, 100);
  }
}
