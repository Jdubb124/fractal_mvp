import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="containerClass" class="flex items-center justify-center">
      <div class="relative">
        <div 
          [class]="spinnerSizeClass"
          class="rounded-full border-2 border-border-color border-t-accent-primary animate-spin"
        ></div>
        @if (text) {
          <p class="mt-4 text-sm text-text-secondary text-center">{{ text }}</p>
        }
      </div>
    </div>
  `,
})
export class LoadingComponent {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() text?: string;
  @Input() fullScreen = false;

  get containerClass(): string {
    return this.fullScreen ? 'fixed inset-0 bg-bg-dark/80 z-50' : '';
  }

  get spinnerSizeClass(): string {
    const sizes = {
      sm: 'w-5 h-5',
      md: 'w-8 h-8',
      lg: 'w-12 h-12',
    };
    return sizes[this.size];
  }
}