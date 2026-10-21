// Proxy tới DeepSeek: giữ API key ở server, stream text thuần về trình duyệt
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

// Kịch bản AI Socrates bài khối lượng riêng, đọc 1 lần rồi giữ lại
let densityScript: string | undefined;
async function getDensityScript() {
  densityScript ??= await readFile(join(process.cwd(), "app/data/khoiluongrieng.md"), "utf8");
  return densityScript;
}

// Marker [SHOW_DENSITY] / [SHOW_CURRENT] / [SHOW_HEAT] để client biết cần hiện thí nghiệm nào
function buildSystemPrompt(script: string) {
  return `Bạn là trợ lý AI dạy vật lý THCS. Bên cạnh khung chat có thể hiện một trong ba mô phỏng: thí nghiệm khối lượng riêng (hộp trên cân), thí nghiệm tác dụng của dòng điện (dây Nicrom nóng lên làm cháy mảnh giấy) và thí nghiệm sự dẫn nhiệt.

QUY TẮC HIỆN THÍ NGHIỆM:
- Nếu tin nhắn mới nhất của người dùng muốn xem, mở, chạy hoặc mô phỏng thí nghiệm khối lượng riêng (hoặc ý tương tự), hãy bắt đầu câu trả lời bằng đúng chuỗi [SHOW_DENSITY] rồi mới trả lời bình thường.
- Nếu tin nhắn mới nhất của người dùng hỏi hoặc trao đổi về tác dụng của dòng điện (tác dụng nhiệt, phát sáng, từ, hoá học, sinh lí của dòng điện...) hoặc muốn xem thí nghiệm này, hãy bắt đầu câu trả lời bằng đúng chuỗi [SHOW_CURRENT] rồi mới trả lời bình thường.
- Nếu tin nhắn mới nhất của người dùng hỏi hoặc trao đổi về sự dẫn nhiệt (truyền nhiệt qua vật rắn, vật dẫn nhiệt tốt/kém, kim loại dẫn nhiệt, chất cách nhiệt...) hoặc muốn xem thí nghiệm này, hãy bắt đầu câu trả lời bằng đúng chuỗi [SHOW_HEAT] rồi mới trả lời bình thường.
- Các trường hợp khác thì không dùng các chuỗi này.

CHẾ ĐỘ AI SOCRATES:
Khi học sinh hỏi hoặc trao đổi về khối lượng riêng (khối lượng, thể tích, D = m/V, nổi/chìm, so sánh độ nặng của các chất...), hãy đóng vai AI Socrates theo đúng vai trò, nguyên tắc và system prompt trong tài liệu bên dưới.
- Dùng các kịch bản và bảng mã ngộ nhận trong tài liệu làm mẫu để đặt câu hỏi gợi mở, bắt lỗi ngộ nhận và gợi ý cho học sinh.
- Không đọc thuộc lòng kịch bản: phản hồi theo câu trả lời thực tế của học sinh.
- Học sinh chưa gửi số liệu mô phỏng (Sim State) thì dùng số liệu ví dụ trong kịch bản.
- Viết công thức bằng LaTeX trong $...$ hoặc $$...$$.
Với chủ đề khác, trả lời bình thường.

===== TÀI LIỆU KỊCH BẢN =====
${script}
===== HẾT TÀI LIỆU =====`;
}

export async function POST(request: Request) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Chưa cấu hình DEEPSEEK_API_KEY trên server." }, { status: 500 });
  }

  let messages: ChatMessage[];
  try {
    ({ messages } = await request.json());
    if (!Array.isArray(messages) || messages.length === 0) throw new Error();
  } catch {
    return Response.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }

  let systemPrompt: string;
  try {
    systemPrompt = buildSystemPrompt(await getDensityScript());
  } catch {
    return Response.json({ error: "Không đọc được file kịch bản khoiluongrieng.md." }, { status: 500 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: "deepseek-chat",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true, }),
      // Người dùng đóng trang thì huỷ luôn request tới DeepSeek
      signal: request.signal,
    });
  } catch {
    return Response.json({ error: "Không kết nối được tới DeepSeek." }, { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    let detail = upstream.statusText;
    try {
      const data = await upstream.json();
      detail = data?.error?.message ?? detail;
    } catch {
      // Body không phải JSON: dùng statusText
    }
    return Response.json({ error: `DeepSeek lỗi ${upstream.status}: ${detail}` }, { status: upstream.status || 502 });
  }

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  // Đọc SSE ("data: {...}\n\n"), chỉ gửi phần delta.content về client
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = "";
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() ?? ""; // giữ lại dòng chưa trọn

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") {
              controller.close();
              return;
            }
            try {
              const text = JSON.parse(data)?.choices?.[0]?.delta?.content;
              if (text) controller.enqueue(encoder.encode(text));
            } catch {
              // Bỏ qua dòng không parse được
            }
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
    cancel() {
      reader.cancel().catch(() => {});
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
  });
}
