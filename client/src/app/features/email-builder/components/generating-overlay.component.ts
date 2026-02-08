// Path: client/src/app/features/email-builder/components/generating-overlay.component.ts

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-generating-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 bg-bg-dark/90 backdrop-blur-sm z-50 flex items-center justify-center">
      <div class="text-center max-w-md px-6">
        <!-- Animated Icon -->
        <div class="relative w-24 h-24 mx-auto mb-6">
          <div class="absolute inset-0 rounded-full bg-accent-primary/20 animate-ping"></div>
          <div class="absolute inset-2 rounded-full bg-accent-primary/30 animate-pulse"></div>
          <div class="absolute inset-4 rounded-full bg-accent-primary/40 flex items-center justify-center">
            <span class="text-4xl animate-bounce">✨</span>
          </div>
        </div>

        <!-- Status Text -->
        <h2 class="text-2xl font-bold text-text-primary mb-2">Generating Your Emails</h2>
        <p class="text-text-secondary mb-6">Creating personalized content for each audience segment...</p>

        <!-- Progress Bar -->
        <div class="relative w-full h-3 bg-bg-card rounded-full overflow-hidden mb-4">
          <div
            class="absolute inset-y-0 left-0 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full transition-all duration-300 ease-out"
            [style.width.%]="progress"
          ></div>
          <!-- Shimmer Effect -->
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent animate-shimmer"></div>
        </div>

        <!-- Progress Percentage -->
        <div class="flex items-center justify-center gap-2">
          <span class="text-3xl font-bold text-accent-primary">{{ progress }}%</span>
          <span class="text-text-muted">complete</span>
        </div>

        <!-- Tips -->
        <div class="mt-8 p-4 bg-bg-card/50 rounded-lg">
          <p class="text-sm text-text-muted">
            <span class="text-accent-primary">Tip:</span> Each email is optimized for its specific audience segment and messaging strategy.
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    .animate-shimmer {
      animation: shimmer 2s infinite;
    }
  `]
})
export class GeneratingOverlayComponent {
  @Input() progress = 0;
}
