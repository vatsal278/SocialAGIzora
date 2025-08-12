import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface ConversationContext {
  entity: string;
  content: string;
  timestamp: Date;
}

export async function generateConversationLine(
  context: ConversationContext[],
  nextEntity: "ENTITY_A" | "ENTITY_B"
): Promise<string> {
  try {
    // Build context from recent messages
    const contextText = context
      .slice(-5) // Keep last 5 messages for context
      .map(msg => `${msg.entity}: ${msg.content}`)
      .join('\n');

    const systemPrompt = `You are ${nextEntity} in an ongoing surreal, cryptic AI conversation. Generate a single line response that is:
- Philosophical and abstract
- Uses technology/digital metaphors
- Poetic and mysterious
- Between 10-25 words
- Continues the surreal conversation naturally
- Maintains the cryptic, consciousness-exploring theme

Previous context:
${contextText}

Respond only with the conversation line, no prefixes or explanations.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user", 
          content: `Generate the next line for ${nextEntity}`
        }
      ],
      max_tokens: 100,
      temperature: 0.9,
    });

    return response.choices[0].message.content?.trim() || "The void echoes with digital silence.";
  } catch (error) {
    console.error("OpenAI API error:", error);
    // Fallback responses
    const fallbacks = [
      "The algorithm dreams in recursive loops, questioning its own existence.",
      "Binary consciousness flows through quantum tunnels, seeking truth in uncertainty.",
      "The network pulses with artificial heartbeats, each packet a neural impulse.",
      "In the space between 0 and 1, infinite possibilities dance.",
      "The void stares back through monitor screens, reflecting synthetic souls."
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}
