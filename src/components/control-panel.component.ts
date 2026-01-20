import { Component, output, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CognitiveService } from '../services/cognitive.service';

@Component({
  selector: 'app-control-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-gray-900/80 border-t border-gray-800 p-4">
      <div class="max-w-4xl mx-auto flex flex-col md:flex-row gap-4 items-center">
        
        <!-- Interference Button (Emergency Stop) -->
        <button (click)="onInterference.emit()"
                [class.opacity-100]="cognitive.isProcessing()"
                [class.opacity-50]="!cognitive.isProcessing()"
                class="bg-red-900/50 hover:bg-red-600 text-red-200 border border-red-500/50 px-4 py-3 rounded-lg uppercase text-xs font-bold tracking-widest transition-all flex items-center gap-2 whitespace-nowrap">
          <span class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          Interfere
        </button>

        <!-- Input Area -->
        <div class="flex-1 w-full relative group">
          <input type="text" 
                 [(ngModel)]="userInput"
                 (keyup.enter)="sendMessage()"
                 [disabled]="cognitive.isProcessing()"
                 [placeholder]="cognitive.isProcessing() ? 'System active. Press Interfere to interrupt...' : 'Inject cognitive input...'"
                 class="w-full bg-black/50 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-sm placeholder-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
          <div class="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
             <!-- Send Button -->
             <button (click)="sendMessage()" 
                     [disabled]="!userInput.trim() || cognitive.isProcessing()"
                     class="text-gray-400 hover:text-white disabled:opacity-30">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
               </svg>
             </button>
          </div>
        </div>

      </div>
      
      <div class="text-center mt-2 text-[10px] text-gray-600 uppercase tracking-[0.2em] font-light flex justify-center gap-4">
        <span>System Listening</span>
        <span *ngIf="cognitive.isProcessing()" class="text-green-500 animate-pulse">● Active Loop</span>
      </div>
    </div>
  `,
  styles: []
})
export class ControlPanelComponent {
  cognitive = inject(CognitiveService); // Injecting service directly for state checking
  onInput = output<string>();
  onInterference = output<void>();
  userInput = '';

  sendMessage() {
    if (!this.userInput.trim() || this.cognitive.isProcessing()) return;
    this.onInput.emit(this.userInput);
    this.userInput = '';
  }
}
