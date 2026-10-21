// Trả về trang mô phỏng tác dụng của dòng điện (file .md thực chất chứa HTML) để hiện trong iframe
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function GET() {
  try {
    const html = await readFile(join(process.cwd(), "app/templates/dong_dien.md"), "utf8");
    return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  } catch {
    return new Response("Không đọc được file template dong_dien.md.", { status: 500 });
  }
}
