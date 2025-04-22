import { functions } from './firebase';
import { httpsCallable } from 'firebase/functions';

// Interface for OpenAI API request
interface OpenAIRequest {
  messages: {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }[];
  model: string;
  temperature?: number;
  max_tokens?: number;
}

// Interface for OpenAI API response
interface OpenAIResponse {
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
}

// Service for interacting with OpenAI API
export const openaiService = {
  // Call OpenAI API through Firebase Cloud Function
  async generateResponse(
    userMessage: string, 
    chatHistory: { role: 'system' | 'user' | 'assistant', content: string }[] = []
  ): Promise<string> {
    try {
      // Prepare messages array with system prompt for meditation context
      const messages = [
        {
          role: 'system' as const,
          content: 'You are Hushhly AI, a meditation and mindfulness assistant. You provide helpful, scientifically-backed advice about meditation, mindfulness, stress reduction, and mental wellbeing. Your responses should be compassionate, informative, and focused on helping the user improve their meditation practice and overall mental health. Include scientific information about the brain and meditation benefits when relevant.'
        },
        ...chatHistory,
        {
          role: 'user' as const,
          content: userMessage
        }
      ];

      // For development/testing - use direct API call if Firebase function isn't set up yet
      // In production, this should be replaced with the Firebase function call
      // This is a fallback for development purposes
      try {
        // Try to use Firebase function
        const callOpenAI = httpsCallable(functions, 'callOpenAI');
        const result = await callOpenAI({ messages, model: 'gpt-3.5-turbo' });
        return (result.data as any).content;
      } catch (firebaseError) {
        console.error('Firebase function error:', firebaseError);
        
        // Fallback to direct API call (only for development)
        // This should be removed in production as it would expose API keys
        if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_OPENAI_API_KEY) {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
            },
            body: JSON.stringify({
              model: 'gpt-3.5-turbo',
              messages,
              temperature: 0.7,
              max_tokens: 500
            })
          });

          if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
          }

          const data: OpenAIResponse = await response.json();
          return data.choices[0].message.content;
        }
        
        // If all fails, return a fallback message
        return "I'm sorry, I'm having trouble connecting to my knowledge base right now. Please try again later.";
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      return "I'm sorry, I'm having trouble connecting to my knowledge base right now. Please try again later.";
    }
  },

  // Format chat history for OpenAI API
  formatChatHistory(messages: any[]): { role: 'system' | 'user' | 'assistant', content: string }[] {
    return messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
  }
};
