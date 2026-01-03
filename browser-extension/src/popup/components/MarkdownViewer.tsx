import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import ReactMarkdown from "react-markdown";
import DOMPurify from "dompurify";

interface MarkdownViewerProps {
  content: string;
  onEdit: () => void;
}

export function MarkdownViewer({ content, onEdit }: MarkdownViewerProps) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onEdit}
        className="absolute top-2 right-2 z-10 rounded-md bg-slate-800 px-3 py-1 text-xs font-medium text-white transition hover:bg-slate-700"
      >
        Edit
      </button>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <ReactMarkdown
          components={{
            code({ className, children }) {
              const match = /language-(\w+)/.exec(className || "");
              const language = match ? match[1] : "";

              return match ? (
                <SyntaxHighlighter
                  style={oneDark as any}
                  language={language}
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
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              ) : (
                <code
                  className="rounded-md bg-slate-200 px-1.5 py-0.5 text-sm font-mono text-slate-800"
                >
                  {children}
                </code>
              );
            },
            p({ children }) {
              return <p className="mb-3 text-sm text-slate-700">{children}</p>;
            },
            ul({ children }) {
              return <ul className="list-disc pl-6 mb-3 text-sm text-slate-700">{children}</ul>;
            },
            ol({ children }) {
              return <ol className="list-decimal pl-6 mb-3 text-sm text-slate-700">{children}</ol>;
            },
            li({ children }) {
              return <li className="mb-1 text-sm text-slate-700">{children}</li>;
            },
            h1({ children }) {
              return <h1 className="text-lg font-bold mb-3 text-slate-900">{children}</h1>;
            },
            h2({ children }) {
              return <h2 className="text-base font-bold mb-2 text-slate-900">{children}</h2>;
            },
            h3({ children }) {
              return <h3 className="text-sm font-bold mb-2 text-slate-900">{children}</h3>;
            },
            a({ children, href }) {
              return (
                <a
                  href={href}
                  className="text-blue-600 underline hover:text-blue-800"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              );
            },
          }}
        >
          {DOMPurify.sanitize(content)}
        </ReactMarkdown>
      </div>
    </div>
  );
}
