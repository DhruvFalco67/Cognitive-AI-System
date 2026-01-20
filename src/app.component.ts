import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CognitiveService } from './services/cognitive.service';
import { AiPanelComponent } from './components/ai-panel.component';
import { ChatFeedComponent } from './components/chat-feed.component';
import { ControlPanelComponent } from './components/control-panel.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, AiPanelComponent, ChatFeedComponent, ControlPanelComponent],
  templateUrl: './app.component.html',
  styleUrls: [] // Styles are in index.html for global application
})
export class AppComponent {
  cognitive = inject(CognitiveService);
}
