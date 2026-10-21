// Trả về trang mô phỏng sự dẫn nhiệt (file .md thực chất chứa HTML) để hiện trong iframe
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function GET() {
  try {
    const html = await readFile(join(process.cwd(), "app/templates/dan_nhiet.md"), "utf8");
    return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  } catch {
    return new Response("Không đọc được file template dan_nhiet.md.", { status: 500 });
  }
}
