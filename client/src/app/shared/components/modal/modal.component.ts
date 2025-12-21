import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <div 
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        (click)="onOverlayClick($event)"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-bg-dark/80 backdrop-blur-sm"></div>
        
        <!-- Modal Content -->
        <div 
          class="relative bg-bg-panel border border-border-color rounded-lg shadow-glow w-full animate-fade-in"
          [class]="sizeClass"
        >
          <!-- Header -->
          @if (title) {
            <div class="flex items-center justify-between p-6 border-b border-border-color">
              <h2 class="text-lg font-semibold text-text-primary">{{ title }}</h2>
              <button 
                (click)="close.emit()"
                class="w-8 h-8 flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
              >
                ✕
              </button>
            </div>
          }
          
          <!-- Body -->
          <div class="p-6">
            <ng-content></ng-content>
          </div>
          
          <!-- Footer (if projected) -->
          <ng-content select="[modal-footer]"></ng-content>
        </div>
      </div>
    }
  `,
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title?: string;
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() closeOnOverlay = true;
  
  @Output() close = new EventEmitter<void>();

  get sizeClass(): string {
    const sizes = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-2xl',
    };
    return sizes[this.size];
  }

  onOverlayClick(event: MouseEvent): void {
    if (this.closeOnOverlay && event.target === event.currentTarget) {
      this.close.emit();
    }
  }
}