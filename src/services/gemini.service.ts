import { Injectable } from '@angular/core';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    // Initialize Gemini Client
    this.ai = new GoogleGenAI({ apiKey: process.env['API_KEY'] });
  }

  async generateContent(
    prompt: string,
    systemInstruction: string,
    modelName: string = 'gemini-2.5-flash'
  ): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.8,
        }
      });
      return response.text || '';
    } catch (error) {
      console.error('Gemini API Error:', error);
      return '...system error...';
    }
  }

  async *generateStream(
    prompt: string,
    systemInstruction: string,
    modelName: string = 'gemini-2.5-flash'
  ): AsyncGenerator<string, void, unknown> {
    try {
      const responseStream = await this.ai.models.generateContentStream({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.9, // Higher temp for more natural conversation
        }
      });

      for await (const chunk of responseStream) {
        const text = chunk.text;
        if (text) {
          yield text;
        }
      }
    } catch (error) {
      console.error('Gemini Stream Error:', error);
      yield '...signal lost...';
    }
  }

  async generateWithSearch(
    prompt: string,
    systemInstruction: string
  ): Promise<{ text: string; sources: string[] }> {
    try {
      // Search grounding doesn't easily support streaming with the same API shape in this simplified service
      // keeping it as a single block for the "Searcher Verification" step if needed, 
      // but for the conversational loop, we will stick to the stream method usually.
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          tools: [{ googleSearch: {} }]
        }
      });

      const text = response.text || '';
      
      const sources: string[] = [];
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        chunks.forEach((chunk: any) => {
          if (chunk.web?.uri) {
            sources.push(chunk.web.uri);
          }
        });
      }

      return { text, sources };
    } catch (error) {
      console.error('Searcher API Error:', error);
      return { text: 'I cannot access the network right now.', sources: [] };
    }
  }
}
