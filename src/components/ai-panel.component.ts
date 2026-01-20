import { Component, input, computed } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Speaker, Emotion } from '../services/cognitive.service';

@Component({
  selector: 'app-ai-panel',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  template: `
    <div class="h-full flex flex-col p-4 border rounded-xl bg-opacity-10 bg-black backdrop-blur-sm transition-all duration-500"
         [class.border-blue-500]="type() === 'SEARCHER_MIND'"
         [class.border-pink-500]="type() === 'CURIOUS_SOUL'"
         [class.shadow-[0_0_20px_rgba(59,130,246,0.2)]]="type() === 'SEARCHER_MIND' && isActive()"
         [class.shadow-[0_0_20px_rgba(236,72,153,0.2)]]="type() === 'CURIOUS_SOUL' && isActive()"
         [class.border-gray-800]="!isActive()">

      <!-- Header -->
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold brand-font"
            [class.text-blue-400]="type() === 'SEARCHER_MIND'"
            [class.text-pink-400]="type() === 'CURIOUS_SOUL'">
          {{ name() }}
        </h2>
        <span class="text-xs uppercase tracking-wider text-gray-500">{{ emotion() }}</span>
      </div>

      <!-- Avatar Visualization (Abstract) -->
      <div class="relative w-full aspect-square mb-4 bg-black rounded-lg overflow-hidden border border-gray-800 flex items-center justify-center">
        <!-- Searcher Visual: Geometric Grid -->
        @if (type() === 'SEARCHER_MIND') {
          <div class="absolute inset-0 grid grid-cols-6 grid-rows-6 gap-1 opacity-20">
            @for (i of [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36]; track i) {
              <div class="bg-blue-500 w-full h-full animate-pulse" [style.animation-delay]="(i * 50) + 'ms'"></div>
            }
          </div>
          <div class="z-10 w-24 h-24 border-2 border-blue-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)]"
               [class.animate-pulse]="isActive()">
            <div class="w-16 h-16 border border-blue-400 rotate-45"></div>
          </div>
        }

        <!-- Curious Visual: Organic Blobs -->
        @if (type() === 'CURIOUS_SOUL') {
          <div class="absolute inset-0 opacity-20 bg-gradient-to-tr from-pink-900 to-purple-900"></div>
          <div class="z-10 w-24 h-24 bg-pink-600 rounded-full blur-xl opacity-50 animate-bounce"></div>
          <div class="z-10 w-20 h-20 bg-purple-500 rounded-full blur-lg opacity-70 animate-pulse delay-75 mix-blend-screen"></div>
          <div class="z-20 w-32 h-32 border border-pink-500/30 rounded-full absolute animate-spin-slow"></div>
        }
      </div>

      <!-- Stats -->
      <div class="space-y-3">
        <!-- Health Bar -->
        <div>
          <div class="flex justify-between text-xs mb-1 text-gray-400">
            <span>INTEGRITY</span>
            <span>{{ health() }}%</span>
          </div>
          <div class="w-full h-2 bg-gray-900 rounded-full overflow-hidden">
            <div class="h-full transition-all duration-1000"
                 [style.width.%]="health()"
                 [class.bg-blue-500]="type() === 'SEARCHER_MIND'"
                 [class.bg-pink-500]="type() === 'CURIOUS_SOUL'"
                 [class.bg-red-500]="health() < 30">
            </div>
          </div>
        </div>

        <!-- Brain / Logic Stat -->
        <div class="flex justify-between items-center bg-gray-900/50 p-2 rounded">
          <span class="text-xs text-gray-400">
            {{ type() === 'CURIOUS_SOUL' ? 'BRAIN MASS' : 'LOGIC DEPTH' }}
          </span>
          <span class="font-mono font-bold text-sm"
                [class.text-pink-300]="type() === 'CURIOUS_SOUL'"
                [class.text-blue-300]="type() === 'SEARCHER_MIND'">
             {{ secondaryStat() }}
          </span>
        </div>
      </div>

      <!-- Activity Indicator -->
      <div class="mt-auto pt-4 flex items-center justify-center">
        @if (isActive()) {
          <span class="flex h-3 w-3 relative">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  [class.bg-blue-400]="type() === 'SEARCHER_MIND'"
                  [class.bg-pink-400]="type() === 'CURIOUS_SOUL'"></span>
            <span class="relative inline-flex rounded-full h-3 w-3"
                  [class.bg-blue-500]="type() === 'SEARCHER_MIND'"
                  [class.bg-pink-500]="type() === 'CURIOUS_SOUL'"></span>
          </span>
          <span class="ml-2 text-xs text-gray-400 animate-pulse">SPEAKING...</span>
        } @else {
          <span class="text-xs text-gray-600">LISTENING</span>
        }
      </div>

    </div>
  `,
  styles: [`
    .animate-spin-slow {
      animation: spin 8s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class AiPanelComponent {
  name = input.required<string>();
  type = input.required<Speaker>();
  health = input.required<number>();
  emotion = input.required<Emotion>();
  isActive = input.required<boolean>();
  secondaryStat = input.required<number | string>(); // Changed to accept formatted strings
}
