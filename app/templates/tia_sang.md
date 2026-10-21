<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>Mô phỏng tia sáng - Kéo thả vật cản</title>
<style>
  body {
    margin: 0;
    background-color: #0f172a; /* Nền tối hiện đại */
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    color: #e2e8f0;
    overflow: hidden;
  }
  canvas {
    background: #1e293b;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 0 1px #334155;
    cursor: default;
  }
  .instructions {
    margin-top: 15px;
    font-size: 16px;
    color: #94a3b8;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .highlight { color: #fbbf24; font-weight: bold; }
</style>
</head>
<body>

<canvas id="simCanvas" width="900" height="550"></canvas>
<div class="instructions">
  <span>💡</span> Giữ chuột vào <span class="highlight">Vật cản</span> và kéo sang trái/phải để xem vùng tối thay đổi.
</div>

<script>
const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');

// Cấu hình tọa độ
const S = { x: 120, y: 275 }; // Nguồn sáng
const slit = { x: 260, y1: 100, y2: 450, gap: 60 }; // Khe hẹp
const screen = { x: 780, y: 50, w: 30, h: 450 }; // Màn chắn

// Vật cản (có thể kéo)
const obj = { 
    x: 480, 
    y: 275, 
    r: 55, 
    isDragging: false,
    minX: slit.x + 80, 
    maxX: screen.x - 80 
};

let mouseX = 0;
let mouseY = 0;

// Xử lý sự kiện kéo thả
canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Kiểm tra xem có click trúng vật cản không
    const dist = Math.hypot(clickX - obj.x, clickY - obj.y);
    if (dist <= obj.r) {
        obj.isDragging = true;
        canvas.style.cursor = 'grabbing';
    }
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    
    if (obj.isDragging) {
        // Giới hạn vật cản nằm giữa khe và màn chắn
        obj.x = Math.max(obj.minX, Math.min(mouseX, obj.maxX));
    } else {
        // Đổi con trỏ chuột khi hover
        const dist = Math.hypot(mouseX - obj.x, mouseY - obj.y);
        canvas.style.cursor = dist <= obj.r ? 'grab' : 'default';
    }
});

canvas.addEventListener('mouseup', () => {
    obj.isDragging = false;
    canvas.style.cursor = 'grab';
});

// Hàm vẽ chính
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Tính toán Vùng tối
    const slopeTop = (obj.y - obj.r - S.y) / (obj.x - S.x);
    const yTopScreen = S.y + slopeTop * (screen.x - S.x);

    const slopeBot = (obj.y + obj.r - S.y) / (obj.x - S.x);
    const yBotScreen = S.y + slopeBot * (screen.x - S.x);

    // 2. Vẽ Màn chắn
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.roundRect(screen.x, screen.y, screen.w, screen.h, 8);
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 3. Vẽ Vùng tối trên màn chắn
    ctx.fillStyle = '#0f172a'; // Màu đen bóng
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.ellipse(screen.x + screen.w/2, (yTopScreen + yBotScreen)/2, screen.w/2 + 2, (yBotScreen - yTopScreen)/2, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0; // Reset

    // Vẽ viền mờ cho vùng tối
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 4. Vẽ Chùm tia sáng (Volumetric light)
    ctx.save();
    ctx.globalCompositeOperation = 'screen'; // Hiệu ứng cộng sáng
    const grad = ctx.createLinearGradient(S.x, S.y, screen.x, S.y);
    grad.addColorStop(0, 'rgba(251, 191, 36, 0.4)'); // Vàng sáng ở nguồn
    grad.addColorStop(1, 'rgba(251, 191, 36, 0.05)'); // Mờ dần về màn chắn
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(S.x, S.y);
    ctx.lineTo(obj.x, obj.y - obj.r);
    ctx.lineTo(screen.x, yTopScreen);
    ctx.lineTo(screen.x, yBotScreen);
    ctx.lineTo(obj.x, obj.y + obj.r);
    ctx.fill();
    ctx.restore();

    // 5. Vẽ Tia sáng biên (Mũi tên)
    drawRayLine(S.x, S.y, obj.x, obj.y - obj.r, '#fbbf24');
    drawRayLine(obj.x, obj.y - obj.r, screen.x, yTopScreen, '#fbbf24');
    
    drawRayLine(S.x, S.y, obj.x, obj.y + obj.r, '#fbbf24');
    drawRayLine(obj.x, obj.y + obj.r, screen.x, yBotScreen, '#fbbf24');

    // Tia trung tâm (nét đứt)
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(S.x, S.y);
    ctx.lineTo(screen.x, S.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // 6. Vẽ Khe hẹp
    ctx.fillStyle = '#64748b';
    // Thanh trên
    ctx.fillRect(slit.x - 6, slit.y1, 12, (slit.y2 - slit.y1)/2 - slit.gap/2);
    // Thanh dưới
    ctx.fillRect(slit.x - 6, (slit.y2 + slit.y1)/2 + slit.gap/2, 12, (slit.y2 - slit.y1)/2 - slit.gap/2);
    
    // 7. Vẽ Nguồn sáng (Nến phát sáng)
    ctx.save();
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.ellipse(S.x, S.y - 35, 10, 18, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();

    // Thân nến
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(S.x - 12, S.y - 15, 24, 50, 4);
    ctx.fill();
    ctx.fillStyle = '#cbd5e1'; // Bóng đổ thân nến
    ctx.beginPath();
    ctx.roundRect(S.x, S.y - 15, 12, 50, [0, 4, 4, 0]);
    ctx.fill();

    // 8. Vẽ Vật cản (Quả cầu 3D)
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 10;
    ctx.shadowOffsetY = 15;
    
    const sphereGrad = ctx.createRadialGradient(
        obj.x - obj.r*0.4, obj.y - obj.r*0.4, obj.r*0.1,
        obj.x, obj.y, obj.r
    );
    sphereGrad.addColorStop(0, '#64748b'); // Điểm sáng
    sphereGrad.addColorStop(0.6, '#1e293b'); // Màu cơ bản
    sphereGrad.addColorStop(1, '#0f172a'); // Viền tối

    ctx.fillStyle = sphereGrad;
    ctx.beginPath();
    ctx.arc(obj.x, obj.y, obj.r, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();

    // Điểm sáng long lanh (Specular)
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.arc(obj.x - obj.r*0.4, obj.y - obj.r*0.4, obj.r*0.2, 0, Math.PI*2);
    ctx.fill();

    // 9. Vẽ Text nhãn
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 16px "Segoe UI"';
    ctx.fillText("S", S.x - 25, S.y - 60);
    ctx.fillText("Khe hẹp", slit.x - 75, slit.y1 - 20);
    ctx.fillText("Vật cản", obj.x - 30, obj.y + obj.r + 25);
    ctx.fillText("Màn chắn", screen.x - 30, screen.y + screen.h + 30);
    
    // Nhãn Vùng Tối (Động)
    ctx.fillStyle = '#fbbf24';
    ctx.fillText("Vùng tối", screen.x - 110, (yTopScreen + yBotScreen)/2);
    
    // Nhãn A' B'
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '14px "Segoe UI"';
    ctx.fillText("A'", screen.x - 25, yTopScreen - 5);
    ctx.fillText("B'", screen.x - 25, yBotScreen + 15);

    requestAnimationFrame(draw);
}

// Hàm tiện ích vẽ mũi tên
function drawRayLine(x1, y1, x2, y2, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Mũi tên
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLen = 10;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle - 0.4), y2 - headLen * Math.sin(angle - 0.4));
    ctx.lineTo(x2 - headLen * Math.cos(angle + 0.4), y2 - headLen * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}

// Vẽ khung bo góc cho Canvas (tùy chọn)
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.beginPath();
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        return this;
    };
}

// Bắt đầu vòng lặp vẽ
requestAnimationFrame(draw);
</script>
</body>
</html>