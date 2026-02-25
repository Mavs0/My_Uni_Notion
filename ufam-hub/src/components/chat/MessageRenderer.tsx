"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import { Copy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface MessageRendererProps {
  content: string;
  isStreaming?: boolean;
  onCopy?: () => void;
}

export function MessageRenderer({
  content,
  isStreaming = false,
  onCopy,
}: MessageRendererProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css";
    document.head.appendChild(link);
    
    const style = document.createElement("style");
    style.textContent = `
      .dark pre code.hljs,
      pre code.hljs {
        background: #0d1117 !important;
        color: #c9d1d9 !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(link);
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .dark pre code.hljs,
      pre code.hljs {
        background: #0d1117 !important;
        color: #c9d1d9 !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleCopy = async () => {
    try {
      if (onCopy) {
        onCopy();
      } else {
        await navigator.clipboard.writeText(content);
        toast.success("Mensagem copiada!");
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Erro ao copiar mensagem");
    }
  };

  if (!content && !isStreaming) {
    return null;
  }

  return (
    <div className="relative group">
      <div className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-border prose-code:text-sm prose-code:before:content-none prose-code:after:content-none">
        {isStreaming && !content ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-xs">Pensando...</span>
          </div>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight, rehypeRaw]}
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || "");
                const codeString = String(children).replace(/\n$/, "");
                return !inline && match ? (
                  <div className="relative group/code">
                    <div className="absolute top-2 right-2 z-10 opacity-0 group-hover/code:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 bg-background/80 backdrop-blur-sm"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(codeString);
                            toast.success("Código copiado!");
                          } catch (error) {
                            toast.error("Erro ao copiar código");
                          }
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <pre className={`${className} overflow-x-auto`} {...props}>
                      <code className={className}>{children}</code>
                    </pre>
                  </div>
                ) : (
                  <code className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono" {...props}>
                    {children}
                  </code>
                );
              },
              table({ children }: any) {
                return (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full border-collapse border border-border">
                      {children}
                    </table>
                  </div>
                );
              },
              th({ children }: any) {
                return (
                  <th className="border border-border bg-muted px-4 py-2 text-left font-semibold">
                    {children}
                  </th>
                );
              },
              td({ children }: any) {
                return (
                  <td className="border border-border px-4 py-2">
                    {children}
                  </td>
                );
              },
              blockquote({ children }: any) {
                return (
                  <blockquote className="border-l-4 border-primary/50 pl-4 italic my-4 text-muted-foreground">
                    {children}
                  </blockquote>
                );
              },
              a({ href, children }: any) {
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {children}
                  </a>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        )}
      </div>
      {content && !isStreaming && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-0 right-0 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleCopy}
        >
          {copied ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      )}
    </div>
  );
}
