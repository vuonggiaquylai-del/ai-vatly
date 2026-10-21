"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

type Message = {
  id: number;
  role: "user" | "ai";
  text: string;
};

const MAX_INPUT_HEIGHT = 200;
export type ExperimentKind = "density" | "current" | "heat";

// AI mở đầu câu trả lời bằng một trong các chuỗi này khi cần hiện thí nghiệm
const MARKERS: Record<ExperimentKind, string> = {
  density: "[SHOW_DENSITY]",
  current: "[SHOW_CURRENT]",
  heat: "[SHOW_HEAT]",
};

// remark-math chỉ hiểu $...$ và $$...$$, nên đổi \(...\) và \[...\] sang dạng đó
function normalizeMath(text: string) {
  return text
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, m) => `\n$$\n${m.trim()}\n$$\n`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, m) => `$${m.trim()}$`);
}

// Hiển thị tin nhắn AI: markdown + công thức toán
function MarkdownMessage({ text }: { text: string }) {
  return (
    <div className="chat-md text-base leading-7 break-words text-[#1f1f1f]">
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[[rehypeKatex, { throwOnError: false }]]}>
        {normalizeMath(text)}
      </ReactMarkdown>
    </div>
  );
}

// Icon SVG dạng nét, cỡ 20px
function Icon({ children, size = 20 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick?: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-full text-[#444] transition-colors hover:bg-black/5"
    >
      {children}
    </button>
  );
}

function AiActions({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Trình duyệt chặn clipboard: bỏ qua
    }
  }

  return (
    <div className="mt-2 -ml-2 flex items-center gap-1">
      <IconButton label="Hữu ích">
        <Icon>
          <path d="M7 10v11H3V10h4Z" />
          <path d="M7 10l4-8a3 3 0 0 1 3 3v4h5.5a2 2 0 0 1 2 2.3l-1.4 8A2 2 0 0 1 18.1 21H7" />
        </Icon>
      </IconButton>
      <IconButton label="Không hữu ích">
        <Icon>
          <path d="M17 14V3h4v11h-4Z" />
          <path d="M17 14l-4 8a3 3 0 0 1-3-3v-4H4.5a2 2 0 0 1-2-2.3l1.4-8A2 2 0 0 1 5.9 3H17" />
        </Icon>
      </IconButton>
      <IconButton label="Tạo lại">
        <Icon>
          <path d="M20 12a8 8 0 1 1-2.3-5.7" />
          <path d="M20 4v5h-5" />
        </Icon>
      </IconButton>
      <IconButton label={copied ? "Đã chép" : "Sao chép"} onClick={copy}>
        {copied ? (
          <Icon>
            <path d="M5 12l5 5L20 7" />
          </Icon>
        ) : (
          <Icon>
            <rect x="8" y="8" width="12" height="12" rx="2" />
            <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
          </Icon>
        )}
      </IconButton>
      <IconButton label="Thêm">
        <Icon>
          <circle cx="5" cy="12" r="1" fill="currentColor" />
          <circle cx="12" cy="12" r="1" fill="currentColor" />
          <circle cx="19" cy="12" r="1" fill="currentColor" />
        </Icon>
      </IconButton>
    </div>
  );
}

export default function ChatPanel({ onShowExperiment }: { onShowExperiment?: (kind: ExperimentKind) => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "ai",
      text: "Xin chào! Mình là trợ lý AI. Hãy hỏi mình về khối lượng riêng, tác dụng của dòng điện, sự dẫn nhiệt hoặc thí nghiệm bên cạnh nhé.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Tự cuộn xuống khi có tin nhắn mới
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  // Ô nhập tự cao lên theo nội dung
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, MAX_INPUT_HEIGHT) + "px";
  }, [input]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || isStreaming) return;

    const userMsg: Message = { id: Date.now(), role: "user", text };
    const aiId = Date.now() + 1;
    const history = [...messages, userMsg].map((m) => ({
      role: m.role === "ai" ? "assistant" : "user",
      content: m.text,
    }));

    // Thêm bong bóng AI rỗng, sẽ được lấp dần khi stream về
    setMessages((prev) => [...prev, userMsg, { id: aiId, role: "ai", text: "" }]);
    setInput("");
    setIsStreaming(true);

    const setAiText = (update: (prev: string) => string) =>
      setMessages((prev) => prev.map((m) => (m.id === aiId ? { ...m, text: update(m.text) } : m)));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `Lỗi ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let raw = "";
      let shown = false;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue;
        raw += chunk;

        // Marker có thể bị cắt giữa các chunk: chờ đủ rồi mới hiện chữ
        const head = raw.trimStart();
        if (Object.values(MARKERS).some((m) => m.startsWith(head))) continue;
        let display = raw;
        for (const [kind, marker] of Object.entries(MARKERS) as [ExperimentKind, string][]) {
          if (!display.includes(marker)) continue;
          if (!shown) {
            shown = true;
            onShowExperiment?.(kind);
          }
          display = display.replace(marker, "");
        }
        setAiText(() => display.trimStart());
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Không rõ lỗi";
      setAiText((prev) => (prev ? `${prev}\n\n⚠️ ${msg}` : `⚠️ ${msg}`));
    } finally {
      setIsStreaming(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    sendMessage();
  }

  // Enter để gửi, Shift+Enter để xuống dòng
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      sendMessage();
    }
  }

  const hasText = input.trim().length > 0;

  return (
    <div className="flex h-full flex-col">
      {/* KHUNG CHAT */}
      <div id="khungchat" className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-[#dde3ea] bg-white">
        <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
          {messages.map((msg) =>
            msg.role === "user" ? (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[80%] rounded-3xl rounded-tr-md bg-[#e9eef6] px-5 py-3 text-base whitespace-pre-wrap break-words text-[#1f1f1f]">
                  {msg.text}
                </div>
              </div>
            ) : (
              <div key={msg.id}>
                <MarkdownMessage text={msg.text} />
                <AiActions text={msg.text} />
              </div>
            ),
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* BOXCHAT: luôn sát đáy */}
      <div id="boxchat" className="mt-auto shrink-0">
        <div className="mx-auto w-full max-w-3xl px-4 pt-2">
          <p className="mb-2 text-center text-xs text-[#5f6368]">AI có thể mắc lỗi.</p>
        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-2 rounded-[28px] border border-black/5 bg-white py-2 pr-2 pl-3 shadow-[0_2px_12px_rgba(0,0,0,0.08)]"
        >
          <IconButton label="Thêm tệp">
            <Icon size={22}>
              <path d="M12 5v14M5 12h14" />
            </Icon>
          </IconButton>

          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Hỏi AI..."
            className="flex-1 resize-none bg-transparent py-1.5 text-base leading-6 text-[#1f1f1f] outline-none placeholder:text-[#5f6368]"
          />

          <span className="hidden h-9 shrink-0 items-center gap-1 px-2 text-[15px] text-[#1f1f1f] sm:flex">
            AI <span className="text-[#5f6368]">Tự động</span>
          </span>

          {hasText ? (
            <button
              type="submit"
              title="Gửi"
              aria-label="Gửi"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2980b9] text-white transition-colors hover:bg-[#1f6391]"
            >
              <Icon>
                <path d="M12 19V5M5 12l7-7 7 7" />
              </Icon>
            </button>
          ) : (
            <IconButton label="Nói">
              <Icon>
                <rect x="9" y="3" width="6" height="12" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
              </Icon>
            </IconButton>
          )}
        </form>
        </div>
      </div>
    </div>
  );
}
