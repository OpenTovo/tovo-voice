"use client"

import { motion, useReducedMotion } from "framer-motion"
import { Plus } from "lucide-react"
import { useState } from "react"

const faqs = [
  {
    question: "What data do you collect?",
    answer:
      "Nothing. All session content stays on your device and is never sent to any server. Your privacy is completely protected.",
  },
  {
    question: "What AI models can I use?",
    answer:
      "Tovo Voice supports compact open models optimized for on-device use, including Gemma 3 1B, Llama 3.2 1B, Qwen3.5 0.8B, Qwen3 1.7B, and Qwen3 4B. Once downloaded, they run locally for complete privacy.",
  },
  {
    question: "Can I use the app on desktop and mobile?",
    answer:
      "Yes — the app works great on desktop and Android mobile devices. Unfortunately, iOS Safari has memory limitations (200-400MB) while the app requires at least 650MB to run properly, so iOS is not currently supported.",
  },
  {
    question: "How do I install the app?",
    answer:
      "Visit our guides page for step-by-step installation instructions for your desktop or Android device.",
  },
  {
    question: "Why doesn't it work on iOS?",
    answer:
      "iOS Safari has strict memory limitations (200-400MB depending on device), but the app needs at least 650MB to run the transcription model and AI assistant together. Until these limitations are lifted, please use a desktop or Android device.",
  },
  {
    question: "Why is the AI output slow?",
    answer:
      "Your device GPU may not be fast enough for the current model. Download a smaller model in Settings for quicker responses.",
  },
  {
    question: "How do I improve AI Sidekick responses?",
    answer:
      "Try a larger model, which is generally more capable. Start with Gemma 3 1B or Llama 3.2 1B on mobile, and try Qwen3 1.7B or Qwen3 4B on a capable desktop device.",
  },
  {
    question: "What if the app crashes?",
    answer:
      "Crashes are usually memory-related — either the transcription model or WebGPU running out of memory. Try a smaller model, or close other browser tabs to free up memory.",
  },
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const reduceMotion = useReducedMotion()

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="px-4 py-24 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true, amount: 0.4 }}
          className="mb-14"
        >
          <h2 className="text-ink mb-5 text-4xl font-semibold tracking-[-0.02em] md:text-5xl">
            Frequently asked questions
          </h2>
          <p className="text-ink-muted text-lg leading-relaxed">
            Everything you need to know about Tovo Voice.
          </p>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true, amount: 0.2 }}
          className="border-hairline divide-hairline divide-y border-t border-b"
        >
          {faqs.map((faq, index) => (
            <div key={faq.question}>
              <button
                type="button"
                onClick={() => toggleFAQ(index)}
                aria-expanded={openIndex === index}
                aria-controls={`faq-panel-${index}`}
                className="hover:bg-ink/[0.02] flex w-full items-center justify-between gap-4 px-2 py-5 text-left transition-colors"
              >
                <h3 className="text-ink text-base font-medium">
                  {faq.question}
                </h3>
                <Plus
                  className={`text-accent-strong h-4 w-4 flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? "rotate-45" : ""
                  }`}
                />
              </button>

              <motion.div
                id={`faq-panel-${index}`}
                initial={false}
                animate={{
                  height: openIndex === index ? "auto" : 0,
                  opacity: openIndex === index ? 1 : 0,
                }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { duration: 0.32, ease: [0.16, 1, 0.3, 1] }
                }
                className="overflow-hidden"
              >
                <div className="text-ink-muted px-2 pb-5 text-sm leading-relaxed">
                  {faq.answer}
                </div>
              </motion.div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
