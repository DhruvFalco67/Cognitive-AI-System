import { Component, input, effect, ElementRef, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatMessage } from '../services/cognitive.service';

@Component({
  selector: 'app-chat-feed',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="h-full flex flex-col space-y-4 overflow-y-auto p-4 scroll-smooth" #scrollContainer>
      @for (msg of messages(); track msg.id) {
        <div class="flex w-full" 
             [class.justify-end]="msg.sender === 'USER'"
             [class.justify-start]="msg.sender !== 'USER'"
             [class.justify-center]="msg.sender === 'JUDGE' || msg.sender === 'SYSTEM'">
          
          <div class="max-w-[85%] p-4 rounded-xl backdrop-blur-md border border-opacity-20 animate-fade-in relative transition-all"
               [class.bg-blue-900]="msg.sender === 'SEARCHER_MIND'"
               [class.border-blue-500]="msg.sender === 'SEARCHER_MIND'"
               [class.bg-pink-900]="msg.sender === 'CURIOUS_SOUL'"
               [class.border-pink-500]="msg.sender === 'CURIOUS_SOUL'"
               [class.bg-gray-800]="msg.sender === 'USER'"
               [class.border-gray-600]="msg.sender === 'USER'"
               [class.bg-yellow-900]="msg.sender === 'JUDGE'"
               [class.border-yellow-600]="msg.sender === 'JUDGE'"
               [class.bg-red-900]="msg.sender === 'SYSTEM'"
               [class.border-red-600]="msg.sender === 'SYSTEM'"
               [class.bg-opacity-20]="true">
            
            <!-- Sender Label -->
            <div class="text-xs font-bold mb-1 opacity-70 flex justify-between">
              <span>{{ formatSender(msg.sender) }}</span>
              <span *ngIf="msg.emotion" class="uppercase tracking-widest text-[10px]">{{ msg.emotion }}</span>
            </div>

            <!-- Content -->
            <div class="text-sm md:text-base leading-relaxed whitespace-pre-wrap font-light">
              {{ msg.text }}<span *ngIf="msg.isStreaming" class="inline-block w-2 h-4 bg-white/50 animate-pulse ml-1 align-middle"></span>
            </div>

            <!-- Sources (Searcher Only) -->
            @if (msg.sources && msg.sources.length > 0) {
              <div class="mt-3 pt-2 border-t border-white/10">
                <p class="text-[10px] text-gray-400 mb-1">DATA STREAMS:</p>
                <div class="flex flex-wrap gap-2">
                  @for (source of msg.sources; track source) {
                    <a [href]="source" target="_blank" class="text-[10px] text-blue-300 hover:text-blue-100 truncate max-w-[150px] underline">
                      {{ cleanUrl(source) }}
                    </a>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ChatFeedComponent {
  messages = input.required<ChatMessage[]>();
  scrollContainer = viewChild<ElementRef>('scrollContainer');

  constructor() {
    effect(() => {
      const msgs = this.messages(); // Signal dependency
      // Trigger scroll on any message update (including streaming text changes)
      // We throttle this slightly to avoid performance hits during fast streaming
      requestAnimationFrame(() => {
        const el = this.scrollContainer()?.nativeElement;
        if (el) {
          // Only scroll if we were already near the bottom or it's a new message
          const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
          if (isNearBottom) {
             el.scrollTop = el.scrollHeight;
          }
        }
      });
    });
  }

  formatSender(sender: string): string {
    return sender.replace('_', ' ');
  }

  cleanUrl(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return 'external-source';
    }
  }
}
