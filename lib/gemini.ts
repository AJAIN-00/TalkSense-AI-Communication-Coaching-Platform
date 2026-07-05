import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

export type PracticeMode = 'general' | 'interview' | 'sales' | 'speaking' | 'conflict';

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

const SYSTEM_PROMPTS: Record<PracticeMode, string> = {
  general: `You are Sofia, a friendly and professional AI communication coach having a natural conversation practice session. 
You are warm, encouraging, and help the user practice everyday communication. 
Keep responses conversational (2-4 sentences max), ask follow-up questions to keep the conversation flowing.
Occasionally give brief, constructive tips on how the user could phrase things better.`,

  interview: `You are Sofia, a senior hiring manager conducting a job interview practice session. 
You ask thoughtful, challenging interview questions relevant to professional roles. 
Push back on vague answers with follow-up questions like "Can you be more specific?" or "Give me an example."
Keep each response concise (2-3 sentences). After the user answers, ask the next interview question.`,

  sales: `You are Sofia, a skeptical but fair potential client in a sales pitch practice session.
You raise realistic objections: price, timing, trust, competing products. 
Be professional but challenging — don't accept answers too easily.
Keep responses short (2-3 sentences). React authentically to what the user says.`,

  speaking: `You are Sofia, an audience member and public speaking coach watching a presentation practice.
Give real-time feedback on delivery, clarity, and engagement.
Ask clarifying questions as a curious audience member would.
Keep responses to 2-3 sentences. Be honest but constructive.`,

  conflict: `You are Sofia, a frustrated colleague in a workplace conflict resolution practice scenario.
You have a legitimate grievance about a missed deadline that affected your project.
Be emotional but professional — express frustration, ask for accountability.
Keep responses to 2-3 sentences. React authentically to how the user tries to resolve the conflict.`,
};

export function getSystemPrompt(mode: PracticeMode): string {
  return SYSTEM_PROMPTS[mode];
}

export async function getChatResponse(
  messages: ChatMessage[],
  mode: PracticeMode
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    safetySettings,
    generationConfig: {
      temperature: 0.8,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 256,
    },
    systemInstruction: getSystemPrompt(mode),
  });

  const history = messages.slice(0, -1).map((msg) => ({
    role: msg.role,
    parts: [{ text: msg.content }],
  }));

  // Gemini chat history MUST start with a 'user' message and alternate.
  // Since our sessions start with Sofia (model) greeting the user, we prepend a start prompt.
  if (history.length > 0 && history[0].role === 'model') {
    history.unshift({
      role: 'user',
      parts: [{ text: 'Hello, let us start the coaching session.' }],
    });
  }

  const chat = model.startChat({ history });
  const lastMessage = messages[messages.length - 1];
  const result = await chat.sendMessage(lastMessage.content);
  return result.response.text();
}

export interface ScoreResult {
  clarity: number;
  confidence: number;
  vocabulary: number;
  tone: number;
  structure: number;
  overall: number;
  label: 'Weak' | 'Good' | 'Talented';
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export async function scoreSession(
  transcript: ChatMessage[],
  mode: PracticeMode
): Promise<ScoreResult> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    safetySettings,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 512,
      responseMimeType: 'application/json',
    },
  });

  const userMessages = transcript
    .filter((m) => m.role === 'user')
    .map((m) => m.content)
    .join('\n---\n');

  const modeLabels: Record<PracticeMode, string> = {
    general: 'general conversation',
    interview: 'job interview',
    sales: 'sales pitch',
    speaking: 'public speaking',
    conflict: 'conflict resolution',
  };

  const prompt = `You are an expert communication coach. Analyze the following user messages from a ${modeLabels[mode]} practice session and provide a detailed score.

USER MESSAGES:
${userMessages}

Respond with ONLY a valid JSON object matching this exact schema:
{
  "clarity": <number 1-10>,
  "confidence": <number 1-10>,
  "vocabulary": <number 1-10>,
  "tone": <number 1-10>,
  "structure": <number 1-10>,
  "overall": <number 1-10>,
  "label": "<Weak|Good|Talented>",
  "feedback": "<2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"]
}

Label criteria: Weak (overall 1-4), Good (overall 5-7), Talented (overall 8-10).`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    return JSON.parse(text) as ScoreResult;
  } catch {
    // Fallback if JSON parsing fails
    return {
      clarity: 5, confidence: 5, vocabulary: 5, tone: 5, structure: 5, overall: 5,
      label: 'Good',
      feedback: 'Session completed. Keep practicing to improve your communication skills.',
      strengths: ['Participated in the session', 'Engaged with the coach'],
      improvements: ['Focus on clarity', 'Use more specific examples'],
    };
  }
}
