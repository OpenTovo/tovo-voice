"use client"

import { motion } from "framer-motion"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"

const faqs = [
  {
    question: "What data do we collect?",
    answer:
      "Nothing! All session content stays on your device and is not saved on any remote server. Your privacy is completely protected.",
  },
  {
    question: "What AI models can I use?",
    answer:
      "Tovo supports open source models that are optimized for on-device use. We offer relatively small models (1B-3B parameters) that can be downloaded directly to your device, including Llama 3.2 1B for mobile devices and Llama 3.2 3B for desktop. All models run entirely offline for complete privacy.",
  },
  {
    question: "Can I use the app on desktop and mobile?",
    answer:
      "Yes! The app works great on desktop and Android mobile devices. Unfortunately, iOS Safari has memory limitations (200-400MB) while our app requires at least 650MB to run properly, so iOS is not currently supported.",
  },
  {
    question: "How to install the app on mobile/desktop?",
    answer:
      "Visit our guides page for step-by-step installation instructions for your desktop or Android device.",
  },
  {
    question: "Why doesn't it work on iOS?",
    answer:
      "iOS Safari has strict memory limitations (200-400MB depending on device), but our app needs at least 650MB to run the transcription model and AI assistant together. Until these limitations are lifted, please use a desktop or Android device.",
  },
  {
    question: "AI output is too slow?",
    answer:
      "Please download a smaller model. Your device GPU cannot provide fast enough computation to handle the current model. Try switching to a lighter model for better performance.",
  },
  {
    question: "AI Sidekick response is not good?",
    answer:
      "Try larger models which are generally more capable. We recommend mobile devices use 'Llama3.2 1B' and desktop devices use 'Llama3.2 3B'. If your device cannot handle these models, stay tuned for more optimized models.",
  },
  {
    question: "App crashed on Android or desktop?",
    answer:
      "This may be due to memory limitations causing crashes from: 1) transcription model loading, or 2) WebGPU memory insufficient. Try using smaller models or closing other browser tabs to free up memory.",
  },
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="mb-5 text-4xl font-bold tracking-tight md:text-5xl">
            Frequently Asked <span className="text-zima">Questions</span>
          </h2>
          <p className="text-lg text-neutral-500">
            Get answers to common questions about Tovo
          </p>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
              viewport={{ once: true }}
              className="glass overflow-hidden rounded-xl"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-white/[0.03]"
              >
                <h3 className="pr-4 text-base font-medium text-neutral-200">
                  {faq.question}
                </h3>
                {openIndex === index ? (
                  <ChevronUp className="h-4 w-4 flex-shrink-0 text-[#0090EE]" />
                ) : (
                  <ChevronDown className="h-4 w-4 flex-shrink-0 text-neutral-600" />
                )}
              </button>

              <motion.div
                initial={false}
                animate={{
                  height: openIndex === index ? "auto" : 0,
                  opacity: openIndex === index ? 1 : 0,
                }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 text-sm leading-relaxed text-neutral-500">
                  {faq.answer}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
