import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center justify-center py-8">
      <div 
        class="animate-spin rounded-full border-2 border-t-accent-primary border-r-transparent border-b-transparent border-l-transparent"
        [class]="size === 'sm' ? 'w-6 h-6' : 'w-8 h-8'"
      ></div>
      @if (text) {
        <p class="mt-4 text-sm text-text-secondary">{{ text }}</p>
      }
    </div>
  `,
})
export class LoadingComponent {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() text?: string;
}

