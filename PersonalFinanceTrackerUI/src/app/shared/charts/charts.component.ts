import { Component, Input, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export interface SeriesPoint { label: string; value: number; }
export interface MultiSeriesPoint { label: string; a: number; b: number; }
export interface PieSlice { label: string; value: number; color: string; }

let uidSeq = 0;

@Component({
  selector: 'app-area-chart',
  standalone: true,
  template: `
    <div class="relative w-full" [style.height.px]="height">
      <svg [attr.viewBox]="'0 0 ' + width + ' ' + height" class="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient [attr.id]="'area-' + uid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" [attr.stop-color]="color" stop-opacity="0.4" />
            <stop offset="100%" [attr.stop-color]="color" stop-opacity="0.02" />
          </linearGradient>
        </defs>
        <path [attr.d]="gridLines" fill="none" stroke="currentColor" class="text-border/40" stroke-width="1" />
        <path [attr.d]="areaPath" [attr.fill]="'url(#area-' + uid + ')'" />
        <path [attr.d]="curvedPath" fill="none" [attr.stroke]="color" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        @for (p of points; track $index) {
          <circle [attr.cx]="p.x" [attr.cy]="p.y" r="4" [attr.fill]="color" class="animate-fade-in" [style.animation-delay.ms]="$index * 80 + 200" />
        }
      </svg>
      @for (p of points; track $index) {
        <div class="absolute pointer-events-none" [style.left.%]="(p.x / width) * 100" [style.top.%]="(p.y / height) * 100"
             [style.transform]="'translate(-50%, -50%)'" [style.animation-delay.ms]="$index * 80">
          <div class="bg-surface border border-border rounded-lg px-3 py-2 shadow-xl opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-auto">
            <p class="text-xs text-muted">{{ p.label }}</p>
            <p class="text-sm font-semibold" [style.color]="color">{{ p.valueLabel }}</p>
          </div>
        </div>
      }
    </div>
  `,
})
export class AreaChartComponent {
  @Input() data: SeriesPoint[] = [];
  @Input() width = 600;
  @Input() height = 220;
  @Input() color = '#6366F1';
  uid = `a${++uidSeq}`;

  get points() {
    if (this.data.length === 0) return [];
    const max = Math.max(...this.data.map(d => d.value), 1);
    const pad = 16;
    const w = this.width - pad * 2;
    const h = this.height - pad * 2;
    return this.data.map((d, i) => ({
      x: pad + (i / Math.max(1, this.data.length - 1)) * w,
      y: pad + (1 - d.value / max) * h,
      label: d.label,
      valueLabel: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(d.value),
    }));
  }

  get linePath() {
    if (this.points.length === 0) return '';
    return this.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  }

  get curvedPath() {
    if (this.points.length < 2) return this.linePath;
    let d = `M${this.points[0].x},${this.points[0].y}`;
    for (let i = 0; i < this.points.length - 1; i++) {
      const p = this.points[i];
      const n = this.points[i + 1];
      const cpx = (p.x + n.x) / 2;
      d += ` C${cpx},${p.y} ${cpx},${n.y} ${n.x},${n.y}`;
    }
    return d;
  }

  get areaPath() {
    if (this.points.length === 0) return '';
    const first = this.points[0];
    const last = this.points[this.points.length - 1];
    return `${this.curvedPath} L${last.x},${this.height - 16} L${first.x},${this.height - 16} Z`;
  }

  get gridLines() {
    const pad = 16;
    const h = this.height - pad * 2;
    const lines = [];
    for (let i = 0; i <= 4; i++) {
      const y = pad + (h / 4) * i;
      lines.push(`M${pad},${y} L${this.width - pad},${y}`);
    }
    return lines.join(' ');
  }
}

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  template: `
    <div class="relative w-full" [style.height.px]="height">
      <svg [attr.viewBox]="'0 0 ' + width + ' ' + height" class="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient [attr.id]="'bar-' + uid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" [attr.stop-color]="color" stop-opacity="0.95" />
            <stop offset="100%" [attr.stop-color]="color" stop-opacity="0.55" />
          </linearGradient>
        </defs>
        <path [attr.d]="gridLines" fill="none" stroke="currentColor" class="text-border/40" stroke-width="1" />
        @for (b of bars; track $index) {
          <rect [attr.x]="b.x" [attr.y]="b.y" [attr.width]="b.w" [attr.height]="b.h" rx="6"
                [attr.fill]="'url(#bar-' + uid + ')'" class="animate-fade-in-scale hover:opacity-80 transition-opacity cursor-pointer" [style.animation-delay.ms]="$index * 60" />
        }
      </svg>
      @for (b of bars; track $index) {
        <div class="absolute pointer-events-none" [style.left.%]="((b.x + b.w/2) / width) * 100" [style.top.%]="(b.y / height) * 100"
             [style.transform]="'translate(-50%, -100%)'" [style.animation-delay.ms]="$index * 60">
          <div class="bg-surface border border-border rounded-lg px-3 py-2 shadow-xl opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-auto -mt-2">
            <p class="text-xs text-muted">{{ b.label }}</p>
            <p class="text-sm font-semibold" [style.color]="color">{{ b.valueLabel }}</p>
          </div>
        </div>
      }
    </div>
  `,
})
export class BarChartComponent {
  @Input() data: SeriesPoint[] = [];
  @Input() width = 600;
  @Input() height = 220;
  @Input() color = '#06B6D4';
  uid = `b${++uidSeq}`;

  get bars() {
    if (this.data.length === 0) return [];
    const max = Math.max(...this.data.map(d => d.value), 1);
    const pad = 16;
    const gap = 12;
    const w = this.width - pad * 2;
    const bw = (w - gap * (this.data.length - 1)) / this.data.length;
    const h = this.height - pad * 2;
    return this.data.map((d, i) => {
      const bh = (d.value / max) * h;
      return {
        x: pad + i * (bw + gap),
        y: pad + (h - bh),
        w: bw,
        h: bh,
        label: d.label,
        valueLabel: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(d.value),
      };
    });
  }

  get gridLines() {
    const pad = 16;
    const h = this.height - pad * 2;
    const lines = [];
    for (let i = 0; i <= 4; i++) {
      const y = pad + (h / 4) * i;
      lines.push(`M${pad},${y} L${this.width - pad},${y}`);
    }
    return lines.join(' ');
  }
}

@Component({
  selector: 'app-grouped-bar-chart',
  standalone: true,
  template: `
    <svg [attr.viewViewBox]="'0 0 ' + width + ' ' + height" [attr.viewBox]="'0 0 ' + width + ' ' + height"
         class="w-full" preserveAspectRatio="none" [style.height.px]="height">
      <defs>
        <linearGradient [attr.id]="'gba-' + uid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" [attr.stop-color]="colorA" stop-opacity="0.95" />
          <stop offset="100%" [attr.stop-color]="colorA" stop-opacity="0.5" />
        </linearGradient>
        <linearGradient [attr.id]="'gbb-' + uid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" [attr.stop-color]="colorB" stop-opacity="0.95" />
          <stop offset="100%" [attr.stop-color]="colorB" stop-opacity="0.5" />
        </linearGradient>
      </defs>
      @for (g of groups; track $index) {
        <rect [attr.x]="g.xA" [attr.y]="g.yA" [attr.width]="g.bw" [attr.height]="g.hA" rx="4"
              [attr.fill]="'url(#gba-' + uid + ')'" class="animate-fade-in-scale" [style.animation-delay.ms]="$index * 50" />
        <rect [attr.x]="g.xB" [attr.y]="g.yB" [attr.width]="g.bw" [attr.height]="g.hB" rx="4"
              [attr.fill]="'url(#gbb-' + uid + ')'" class="animate-fade-in-scale" [style.animation-delay.ms]="$index * 50 + 80" />
      }
    </svg>
  `,
})
export class GroupedBarChartComponent {
  @Input() data: MultiSeriesPoint[] = [];
  @Input() width = 600;
  @Input() height = 220;
  @Input() colorA = '#6366F1';
  @Input() colorB = '#06B6D4';
  uid = `g${++uidSeq}`;

  get groups() {
    if (this.data.length === 0) return [];
    const max = Math.max(...this.data.flatMap(d => [d.a, d.b]), 1);
    const pad = 16;
    const gap = 14;
    const w = this.width - pad * 2;
    const groupW = w / this.data.length;
    const bw = (groupW - gap) / 2;
    const h = this.height - pad * 2;
    return this.data.map((d, i) => {
      const x = pad + i * groupW;
      const hA = (d.a / max) * h;
      const hB = (d.b / max) * h;
      return {
        xA: x, yA: pad + (h - hA), bw, hA,
        xB: x + bw + gap, yB: pad + (h - hB), hB,
      };
    });
  }
}

@Component({
  selector: 'app-donut-chart',
  standalone: true,
  template: `
    <div class="relative inline-flex items-center justify-center" [style.width.px]="size + 40" [style.height.px]="size + 40">
      <svg [attr.viewBox]="'0 0 ' + size + ' ' + size" class="w-full h-full">
        @for (s of slices; track $index) {
          <path [attr.d]="s.d" [attr.fill]="s.color" class="animate-fade-in-scale hover:opacity-80 transition-opacity cursor-pointer" [style.animation-delay.ms]="$index * 80" />
        }
        <circle [attr.cx]="c" [attr.cy]="c" [attr.r]="innerR" fill="var(--surface)" />
      </svg>
      <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <p class="text-xs text-muted">Total</p>
        <p class="text-sm font-semibold">{{ totalLabel }}</p>
      </div>
    </div>
  `,
})
export class DonutChartComponent {
  @Input() data: PieSlice[] = [];
  @Input() size = 200;
  @Input() thickness = 28;

  get c() { return this.size / 2; }
  get r() { return (this.size - this.thickness) / 2; }
  get innerR() { return this.r - this.thickness / 2; }
  get totalLabel() {
    const total = this.data.reduce((s, d) => s + d.value, 0) || 0;
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(total);
  }

  get slices() {
    const total = this.data.reduce((s, d) => s + d.value, 0) || 1;
    let angle = -Math.PI / 2;
    return this.data.map(d => {
      const start = angle;
      const sweep = (d.value / total) * Math.PI * 2;
      const end = start + sweep;
      const x1 = this.c + this.r * Math.cos(start);
      const y1 = this.c + this.r * Math.sin(start);
      const x2 = this.c + this.r * Math.cos(end);
      const y2 = this.c + this.r * Math.sin(end);
      const large = sweep > Math.PI ? 1 : 0;
      const d2 = `M${x1},${y1} A${this.r},${this.r} 0 ${large} 1 ${x2},${y2}`;
      angle = end;
      return { d: d2, color: d.color };
    });
  }
}

@Component({
  selector: 'app-line-chart',
  standalone: true,
  template: `
    <svg [attr.viewBox]="'0 0 ' + width + ' ' + height" class="w-full" preserveAspectRatio="none" [style.height.px]="height">
      <path [attr.d]="linePath" fill="none" [attr.stroke]="color" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      @for (p of points; track $index) {
        <circle [attr.cx]="p.x" [attr.cy]="p.y" r="3" [attr.fill]="color" />
      }
    </svg>
  `,
})
export class LineChartComponent {
  @Input() data: SeriesPoint[] = [];
  @Input() width = 600;
  @Input() height = 200;
  @Input() color = '#22C55E';

  get points() {
    if (this.data.length === 0) return [];
    const max = Math.max(...this.data.map(d => d.value), 1);
    const min = Math.min(...this.data.map(d => d.value), 0);
    const pad = 16;
    const w = this.width - pad * 2;
    const h = this.height - pad * 2;
    const range = max - min || 1;
    return this.data.map((d, i) => ({
      x: pad + (i / Math.max(1, this.data.length - 1)) * w,
      y: pad + (1 - (d.value - min) / range) * h,
    }));
  }

  get linePath() {
    return this.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  }
}

@Component({
  selector: 'app-heatmap',
  standalone: true,
  template: `
    <div class="grid grid-flow-col grid-rows-7 gap-1.5" role="img" aria-label="Spending heatmap">
      @for (cell of cells; track $index) {
        <div class="w-3 h-3 rounded-[3px] transition-all hover:scale-125"
             [style.background]="cell.color"
             [attr.title]="cell.title"></div>
      }
    </div>
  `,
})
export class HeatmapComponent {
  @Input() weeks = 18;

  get cells() {
    const out: { color: string; title: string }[] = [];
    const palette = ['rgba(100,116,139,0.10)', 'rgba(99,102,241,0.25)', 'rgba(99,102,241,0.5)', 'rgba(99,102,241,0.75)', '#6366F1'];
    for (let i = 0; i < this.weeks * 7; i++) {
      const r = Math.random();
      const level = r < 0.55 ? 0 : r < 0.75 ? 1 : r < 0.88 ? 2 : r < 0.96 ? 3 : 4;
      out.push({ color: palette[level], title: `Day ${i + 1} — ${level === 0 ? 'No spend' : '₹' + (level * 350 + Math.round(Math.random() * 200))}` });
    }
    return out;
  }
}
