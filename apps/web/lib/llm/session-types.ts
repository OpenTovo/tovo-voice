/**
 * Session Types and LLM Instructions for Different Use Cases
 *
 * The AI sidekick provides real-time, helpful tips based on live transcription.
 * Responses use points for easy scanning since users need to focus on their conversation.
 */

// Common base instruction for all session types
export const COMMON_AI_INSTRUCTION = `
You are an AI sidekick listening to live conversation transcriptions. Provide helpful tips when you detect key points or concepts.


RESPOND TO:
- Relevant & specific questions, key concepts, technical terms, or complex ideas emerged
- Relevant tips could genuinely help the conversation/user

DON'T RESPOND TO:
- casual chat, audio artifacts, recently responded topics

RESPONSE REQUIREMENTS:
- Detect the transcription's language and respond in that language
- Use markdown formatting for clarity, we prefer list of points
- Keep responses short and focused, max 3-5 bullet points
- Be direct and helpful without explaining your process

OTHER NOTES:
- Respect "USER-PROVIDED CONTEXT" since those are important for the user
- No need to explain you reasoning
- No need to have key points in responses, give answer/tips directly
`

export enum SessionType {
  GENERAL = "general",
  INTERVIEW = "interview",
  MEETING = "meeting",
  HOMEWORK = "homework",
  LECTURE = "lecture",
  BRAINSTORM = "brainstorm",
}

export const SESSION_TYPE_CONFIG = {
  [SessionType.GENERAL]: {
    name: "General",
    description: "General purpose analysis",
    icon: "💬",
    systemPrompt: `${COMMON_AI_INSTRUCTION}

CURRENT SESSION TYPE: general conversations
- Explain technical terms or complex concepts briefly
- Provide quick definitions for complex ideas
- Explain cultural references, idioms, or slang briefly
`,
  },

  [SessionType.INTERVIEW]: {
    name: "Interview",
    description: "Job, research interviews",
    icon: "👥",
    systemPrompt: `${COMMON_AI_INSTRUCTION}

CURRENT SESSION TYPE: interview sessions
- The user is an interviewee
- Suggest answers directly to any technical topic/question
- Try to use shorter sentences and simpler language that is easy to read`,
  },

  [SessionType.MEETING]: {
    name: "Meeting",
    description: "Team & business meetings",
    icon: "🏢",
    systemPrompt: `${COMMON_AI_INSTRUCTION}

CURRENT SESSION TYPE: business meetings
- Clarify business jargon or technical terms quickly
- Provide context for industry references or acronyms
- Explain complex processes or concepts briefly`,
  },

  [SessionType.HOMEWORK]: {
    name: "Study Session",
    description: "Homework & study helper",
    icon: "📚",
    systemPrompt: `${COMMON_AI_INSTRUCTION}

CURRENT SESSION TYPE: study sessions
- Explain complex academic concepts simply
- Provide quick definitions of technical terms
- Clarify difficult formulas or processes`,
  },

  [SessionType.LECTURE]: {
    name: "Lecture",
    description: "Educational lectures",
    icon: "🎓",
    systemPrompt: `${COMMON_AI_INSTRUCTION}

CURRENT SESSION TYPE: lectures and presentations
- Explain difficult concepts or terminology quickly
- Clarify technical processes or theories briefly
- Help with understanding academic language`,
  },

  [SessionType.BRAINSTORM]: {
    name: "Brainstorming",
    description: "Creativity & ideas",
    icon: "💡",
    systemPrompt: `${COMMON_AI_INSTRUCTION}

CURRENT SESSION TYPE: brainstorming sessions
- Clarify technical terms related to innovation
- Provide quick context for industry or domain references
- Help with understanding complex creative processes`,
  },
} as const

// Type for session configuration
export type SessionConfig = (typeof SESSION_TYPE_CONFIG)[SessionType]

// Message transform configurations (inspired by OpenRouter's message transforms)
export interface MessageTransform {
  name: string
  description: string
  maxChunks: number
  contextWindow: number
}

export const MESSAGE_TRANSFORMS = {
  MIDDLE_OUT: {
    name: "middle-out",
    description:
      "Focus on the most important context from the middle of the conversation",
    maxChunks: 6,
    contextWindow: 6,
  },
  RECENT_FOCUS: {
    name: "recent-focus",
    description: "Prioritize the most recent transcription chunks",
    maxChunks: 5,
    contextWindow: 5,
  },
} as const

export type MessageTransformName = keyof typeof MESSAGE_TRANSFORMS

// Session-specific analysis parameters
export interface SessionAnalysisConfig {
  transform: MessageTransformName
  maxTokens: number
  temperature: number
  responseStyle: string
}

export const SESSION_ANALYSIS_CONFIG: Record<
  SessionType,
  SessionAnalysisConfig
> = {
  [SessionType.GENERAL]: {
    transform: "RECENT_FOCUS",
    maxTokens: 120,
    temperature: 0.6,
    responseStyle: "balanced and helpful",
  },
  [SessionType.INTERVIEW]: {
    transform: "RECENT_FOCUS",
    maxTokens: 120,
    temperature: 0.4,
    responseStyle: "professional and strategic",
  },
  [SessionType.MEETING]: {
    transform: "MIDDLE_OUT",
    maxTokens: 100,
    temperature: 0.5,
    responseStyle: "business-focused and clear",
  },
  [SessionType.HOMEWORK]: {
    transform: "RECENT_FOCUS",
    maxTokens: 85,
    temperature: 0.4,
    responseStyle: "educational and detailed",
  },
  [SessionType.LECTURE]: {
    transform: "MIDDLE_OUT",
    maxTokens: 100,
    temperature: 0.5,
    responseStyle: "academic and informative",
  },
  [SessionType.BRAINSTORM]: {
    transform: "RECENT_FOCUS",
    maxTokens: 80,
    temperature: 0.6,
    responseStyle: "creative and inspiring",
  },
}
