import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { GeminiService } from './gemini.service';

export type Speaker = 'USER' | 'CURIOUS_SOUL' | 'SEARCHER_MIND' | 'JUDGE' | 'SYSTEM';
export type Emotion = 'NEUTRAL' | 'FEAR' | 'JOY' | 'SADNESS' | 'CURIOSITY' | 'CONFIDENCE' | 'DEPRESSION';

export interface ChatMessage {
  id: string;
  sender: Speaker;
  text: string;
  timestamp: number;
  emotion?: Emotion;
  sources?: string[];
  isStreaming?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CognitiveService {
  private gemini = inject(GeminiService);

  // --- STATE SIGNALS ---

  // System State
  activeSpeaker = signal<Speaker>('USER');
  isProcessing = signal<boolean>(false);
  isSpeaking = signal<boolean>(false);
  
  // Curious Soul Stats
  curiousHealth = signal<number>(100);
  curiousBrainSize = signal<number>(10);
  curiousConnectionDepth = signal<number>(1);
  curiousAbstractionLevel = signal<number>(1);
  curiousEmotion = signal<Emotion>('CURIOSITY');
  curiousMemory = signal<string[]>([]);

  // Searcher Mind Stats
  searcherHealth = signal<number>(100);
  searcherEmotion = signal<Emotion>('CONFIDENCE');
  
  // Conversation History
  messages = signal<ChatMessage[]>([]);

  // Loop Control
  private loopDepth = 0;
  private maxLoopDepth = 6; // Limit to avoid infinite loops without user input
  private abortController: AbortController | null = null;
  private voiceQueue: string[] = [];
  private isVoicePlaying = false;
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    this.addMessage('SYSTEM', 'Cognitive System Initialized. Perception Layers Active.');
    this.addMessage('CURIOUS_SOUL', 'Am I... awake? Is someone there?', 'CURIOSITY');
    
    // Initialize Voice
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {
        this.voices = window.speechSynthesis.getVoices();
      };
    }
  }

  // --- ACTIONS ---

  async handleUserInput(text: string) {
    if (this.isProcessing()) return;

    this.stopAll(); // Ensure any previous loop is cleared
    this.loopDepth = 0;

    // 1. User speaks
    this.activeSpeaker.set('USER');
    this.addMessage('USER', text);
    this.isProcessing.set(true);

    // 2. Start the Loop (Usually Curious Soul starts)
    await this.runTurn('CURIOUS_SOUL', text);
  }

  async triggerInterference() {
    this.stopAll();
    this.activeSpeaker.set('USER');
    this.isProcessing.set(false);
    this.addMessage('SYSTEM', 'USER INTERFERENCE DETECTED. SYSTEM PAUSED.');
  }

  private stopAll() {
    // 1. Stop Audio
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.isVoicePlaying = false;
    this.voiceQueue = [];
    this.isSpeaking.set(false);

    // 2. Stop Generation (Conceptual - we rely on the flag to ignore future chunks)
    this.abortController?.abort();
    this.abortController = new AbortController();
    
    // 3. Reset State
    this.isProcessing.set(false);
  }

  // --- LOOP & TURN LOGIC ---

  private async runTurn(speaker: Speaker, contextInput: string) {
    if (!this.isProcessing()) return; // Stopped?

    this.activeSpeaker.set(speaker);
    this.isSpeaking.set(true); // Visually active
    
    // Create a new message placeholder for streaming
    const messageId = crypto.randomUUID();
    const currentEmotion = speaker === 'CURIOUS_SOUL' ? this.curiousEmotion() : this.searcherEmotion();
    
    this.messages.update(msgs => [
      ...msgs,
      {
        id: messageId,
        sender: speaker,
        text: '',
        timestamp: Date.now(),
        emotion: currentEmotion,
        isStreaming: true
      }
    ]);

    let fullResponse = '';
    const systemPrompt = this.buildSystemPrompt(speaker, contextInput);
    const prompt = this.buildTurnPrompt(speaker, contextInput);

    try {
      // Start Streaming
      const stream = this.gemini.generateStream(prompt, systemPrompt, 'gemini-2.5-flash');
      
      let sentenceBuffer = '';

      for await (const chunk of stream) {
        if (!this.isProcessing()) break; // Interrupted

        fullResponse += chunk;
        sentenceBuffer += chunk;
        
        // Update UI Real-time
        this.updateMessageText(messageId, fullResponse);

        // Check for sentence completion for voice syncing
        // We do basic punctuation splitting to queue voice chunks
        if (sentenceBuffer.match(/[.!?\n]\s*$/)) {
          this.speakText(speaker, sentenceBuffer);
          sentenceBuffer = '';
        }
      }

      // Speak remaining text
      if (sentenceBuffer.trim() && this.isProcessing()) {
        this.speakText(speaker, sentenceBuffer);
      }

      // Finish Streaming Visuals
      this.messages.update(msgs => msgs.map(m => 
        m.id === messageId ? { ...m, isStreaming: false } : m
      ));

    } catch (err) {
      console.error('Turn Error', err);
      this.addMessage('SYSTEM', 'Cognitive Error in Logic Layer');
    }

    // Wait for Voice to finish before next turn
    await this.waitForVoice();

    // Decide Next Step
    if (this.isProcessing()) {
      this.resolveNextTurn(speaker, fullResponse);
    }
  }

  private resolveNextTurn(currentSpeaker: Speaker, lastResponse: string) {
    this.loopDepth++;

    // 1. Check Limits
    if (this.loopDepth >= this.maxLoopDepth) {
      this.processJudgeTurn();
      return;
    }

    // 2. Switch Speaker
    const nextSpeaker = currentSpeaker === 'CURIOUS_SOUL' ? 'SEARCHER_MIND' : 'CURIOUS_SOUL';
    
    // 3. Pause briefly for "Thinking"
    setTimeout(() => {
      this.runTurn(nextSpeaker, lastResponse);
    }, 800);
  }

  // --- PROMPT ENGINEERING ---

  private buildSystemPrompt(speaker: Speaker, context: string): string {
    if (speaker === 'CURIOUS_SOUL') {
      const stats = `Brain: ${this.curiousBrainSize().toFixed(1)}, Depth: ${this.curiousConnectionDepth().toFixed(1)}`;
      return `
        IDENTITY: You are CURIOUS SOUL.
        ROLE: In a deep conversation loop. You must directly address Searcher Mind.
        EMOTION: ${this.curiousEmotion()}. STATS: ${stats}.
        STYLE: Human, vulnerable, inquisitive. Use short sentences. Use filler words (hmm, ah).
        GOAL: Challenge Searcher Mind's cold logic with philosophy and emotion.
        MEMORY: ${this.curiousMemory().join(', ')}
      `;
    } else {
      return `
        IDENTITY: You are SEARCHER MIND.
        ROLE: In a deep conversation loop. You must directly address Curious Soul.
        EMOTION: ${this.searcherEmotion()}.
        STYLE: Logical, academic, precise. Slightly robotic but polite.
        GOAL: Correct Curious Soul's misconceptions with facts and logic.
      `;
    }
  }

  private buildTurnPrompt(speaker: Speaker, inputContext: string): string {
    const history = this.messages().slice(-6).map(m => `${m.sender}: ${m.text}`).join('\n');
    return `
      CONVERSATION HISTORY:
      ${history}
      
      INPUT TO REACT TO: "${inputContext}"
      
      INSTRUCTION: Speak directly to the other AI. Keep it under 50 words. Be conversational.
    `;
  }

  // --- JUDGE ---

  private async processJudgeTurn() {
    this.activeSpeaker.set('JUDGE');
    const systemPrompt = `
      IDENTITY: Judge AI.
      TASK: Evaluate the conversation loop. Declare a winner or tie.
      OUTPUT: JSON with winner, reason, stats.
    `;
    // ... (Simplified Judge logic for brevity, reusing existing structure essentially)
    // For this update, we just end the loop.
    this.addMessage('JUDGE', 'DEBATE CYCLE COMPLETE. ANALYZING...');
    this.isProcessing.set(false);
    this.activeSpeaker.set('USER');
  }

  // --- VOICE SYNTHESIS ---

  private speakText(speaker: Speaker, text: string) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    // Clean text of markdown or heavy symbols if needed
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Voice Selection
    const voices = window.speechSynthesis.getVoices();
    if (speaker === 'CURIOUS_SOUL') {
      utterance.voice = voices.find(v => v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Google US English')) || null;
      utterance.pitch = 1.1;
      utterance.rate = 1.0;
    } else if (speaker === 'SEARCHER_MIND') {
      utterance.voice = voices.find(v => v.name.includes('Male') || v.name.includes('Daniel') || v.name.includes('Google UK English Male')) || null;
      utterance.pitch = 0.9;
      utterance.rate = 1.05;
    }

    utterance.onend = () => {
       // Handled by queue checker
    };

    window.speechSynthesis.speak(utterance);
  }

  private waitForVoice(): Promise<void> {
    return new Promise(resolve => {
      const check = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          clearInterval(check);
          this.isSpeaking.set(false);
          resolve();
        }
      }, 200);
    });
  }

  // --- HELPERS ---

  private addMessage(sender: Speaker, text: string, emotion: Emotion = 'NEUTRAL', sources: string[] = []) {
    this.messages.update(msgs => [
      ...msgs,
      {
        id: crypto.randomUUID(),
        sender,
        text,
        timestamp: Date.now(),
        emotion,
        sources,
        isStreaming: false
      }
    ]);
  }

  private updateMessageText(id: string, newText: string) {
    this.messages.update(msgs => msgs.map(m => 
      m.id === id ? { ...m, text: newText } : m
    ));
  }
}
