import ReactMarkdown from "react-markdown"
import rehypeKatex from "rehype-katex"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"

interface AIResponseMarkdownProps {
  children: string
  className?: string
}

export function AIResponseMarkdown({
  children,
  className = "",
}: AIResponseMarkdownProps) {
  return (
    <div
      className={`prose prose-sm dark:prose-invert sm:prose-base max-w-[90vw] break-words sm:max-w-none ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Limit heading levels to h2 and h3 only as per LLM instructions
          h1: ({ children }) => (
            <h2 className="mb-2 mt-3 text-lg font-semibold first:mt-0 sm:text-base">
              {children}
            </h2>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2 mt-3 text-lg font-semibold first:mt-0 sm:text-base">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-1 mt-2 text-base font-medium first:mt-0 sm:text-sm">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h3 className="mb-1 mt-2 text-base font-medium first:mt-0 sm:text-sm">
              {children}
            </h3>
          ),
          h5: ({ children }) => (
            <h3 className="mb-1 mt-2 text-base font-medium first:mt-0 sm:text-sm">
              {children}
            </h3>
          ),
          h6: ({ children }) => (
            <h3 className="mb-1 mt-2 text-base font-medium first:mt-0 sm:text-sm">
              {children}
            </h3>
          ),
          // Customize other elements to fit our design with mobile-first larger text
          p: ({ children }) => (
            <p className="mb-2 text-base last:mb-0 sm:text-sm">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="mb-2 pl-4 text-base sm:text-sm">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-2 pl-4 text-base sm:text-sm">{children}</ol>
          ),
          li: ({ children }) => <li className="mb-1">{children}</li>,
          code: ({ children, className }) => {
            const isInline = !className
            return isInline ? (
              <code className="bg-muted inline-block max-w-[80vw] break-all rounded px-1 py-0.5 font-mono text-sm sm:text-xs">
                {children}
              </code>
            ) : (
              <code className={className}>{children}</code>
            )
          },
          pre: ({ children }) => (
            <pre className="bg-muted mb-2 max-w-[85vw] overflow-x-auto rounded p-2 text-sm sm:text-xs">
              {children}
            </pre>
          ),
          // Style blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-muted mb-2 border-l-4 pl-4 italic">
              {children}
            </blockquote>
          ),
          // Style tables
          table: ({ children }) => (
            <div className="max-w-[85vw] overflow-x-auto sm:max-w-full">
              <table className="border-muted mb-2 border-collapse border text-sm sm:text-xs">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-muted bg-muted/50 border px-2 py-1 text-left font-medium">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-muted border px-2 py-1">{children}</td>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
