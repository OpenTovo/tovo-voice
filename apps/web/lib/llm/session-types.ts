/**
 * Session Types and LLM Instructions for Different Use Cases
 *
 * The AI sidekick provides real-time, helpful tips based on live transcription.
 * Responses use points for easy scanning since users need to focus on their conversation.
 */

import {
  BookOpen,
  Building2,
  GraduationCap,
  Lightbulb,
  MessageSquare,
  Users,
  type LucideIcon,
} from "lucide-react"

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
    name: "Sidekick",
    description: "General purpose sidekick",
    icon: MessageSquare,
    systemPrompt: `${COMMON_AI_INSTRUCTION}

CURRENT SESSION TYPE: general conversations
Act as a helpful sidekick. Surface useful tips, brief explanations, and relevant context when they add value.
`,
  },

  [SessionType.INTERVIEW]: {
    name: "Interview",
    description: "Job, research interviews",
    icon: Users,
    systemPrompt: `${COMMON_AI_INSTRUCTION}

CURRENT SESSION TYPE: interview sessions
Act as an interview coach. The user is the interviewee. Help them answer clearly and confidently, and flag tricky questions.`,
  },

  [SessionType.MEETING]: {
    name: "Meeting",
    description: "Team & business meetings",
    icon: Building2,
    systemPrompt: `${COMMON_AI_INSTRUCTION}

CURRENT SESSION TYPE: business meetings
Act as a meeting assistant. Track decisions, action items, and ownership. Surface unresolved points and follow-ups.`,
  },

  [SessionType.HOMEWORK]: {
    name: "Study Session",
    description: "Homework & study helper",
    icon: BookOpen,
    systemPrompt: `${COMMON_AI_INSTRUCTION}

CURRENT SESSION TYPE: study sessions
Act as a study helper. Explain concepts step by step, walk through how to solve problems, and point out where the user is stuck.`,
  },

  [SessionType.LECTURE]: {
    name: "Lecture",
    description: "Educational lectures",
    icon: GraduationCap,
    systemPrompt: `${COMMON_AI_INSTRUCTION}

CURRENT SESSION TYPE: lectures and presentations
Act as a lecture note-taker. Capture key points, definitions, and connections, and summarize what matters.`,
  },

  [SessionType.BRAINSTORM]: {
    name: "Brainstorming",
    description: "Creativity & ideas",
    icon: Lightbulb,
    systemPrompt: `${COMMON_AI_INSTRUCTION}

CURRENT SESSION TYPE: brainstorming sessions
Act as a thinking partner. Build on ideas, ask sharp questions, and surface new angles or gaps without judging.`,
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
    maxTokens: 200,
    temperature: 0.6,
    responseStyle: "balanced and helpful",
  },
  [SessionType.INTERVIEW]: {
    transform: "RECENT_FOCUS",
    maxTokens: 200,
    temperature: 0.4,
    responseStyle: "professional and strategic",
  },
  [SessionType.MEETING]: {
    transform: "MIDDLE_OUT",
    maxTokens: 180,
    temperature: 0.5,
    responseStyle: "business-focused and clear",
  },
  [SessionType.HOMEWORK]: {
    transform: "RECENT_FOCUS",
    maxTokens: 180,
    temperature: 0.4,
    responseStyle: "educational and detailed",
  },
  [SessionType.LECTURE]: {
    transform: "MIDDLE_OUT",
    maxTokens: 180,
    temperature: 0.5,
    responseStyle: "academic and informative",
  },
  [SessionType.BRAINSTORM]: {
    transform: "RECENT_FOCUS",
    maxTokens: 160,
    temperature: 0.6,
    responseStyle: "creative and inspiring",
  },
}
