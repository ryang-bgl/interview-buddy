import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "@/lib/utils";

interface MarkdownProps {
  content: string;
  className?: string;
}

export function Markdown({ content, className }: MarkdownProps) {
  return (
    <ReactMarkdown
      className={cn(
        "prose dark:prose-invert max-w-none prose-p:text-foreground prose-headings:text-foreground prose-strong:text-foreground",
        className
      )}
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          return !inline && match ? (
            <SyntaxHighlighter
              style={oneDark}
              language={match[1]}
              PreTag="div"
              customStyle={{
                borderRadius: "0.5rem",
                margin: "0.5rem 0",
                background: "#1e1e1e",
              }}
              codeTagProps={{
                style: {
                  color: "#d4d4d4",
                  background: "transparent",
                },
              }}
              {...props}
            >
              {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
          ) : (
            <code
              className={cn(
                "rounded-md bg-muted px-1.5 py-0.5 text-sm font-mono text-foreground",
                className
              )}
              {...props}
            >
              {children}
            </code>
          );
        },
        p({ children }) {
          return <p className="mb-4 last:mb-0 prose-p:text-foreground">{children}</p>;
        },
        ul({ children }) {
          return <ul className="list-disc pl-6 mb-4 prose-ul:text-foreground">{children}</ul>;
        },
        ol({ children }) {
          return <ol className="list-decimal pl-6 mb-4 prose-ol:text-foreground">{children}</ol>;
        },
        li({ children }) {
          return <li className="mb-1 prose-li:text-foreground">{children}</li>;
        },
        h1({ children }) {
          return <h1 className="text-2xl font-bold mb-4 text-foreground">{children}</h1>;
        },
        h2({ children }) {
          return <h2 className="text-xl font-bold mb-3 text-foreground">{children}</h2>;
        },
        h3({ children }) {
          return <h3 className="text-lg font-bold mb-2 text-foreground">{children}</h3>;
        },
        a({ children, href }) {
          return (
            <a
              href={href}
              className="text-primary underline hover:text-primary/80"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
