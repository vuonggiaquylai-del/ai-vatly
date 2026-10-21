<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mô phỏng thí nghiệm Tác dụng nhiệt của dòng điện</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f7f6;
            display: flex;
            flex-direction: column;
            align-items: center;
            margin: 0;
            padding: 20px;
        }

        h2 { color: #333; text-align: center; margin-bottom: 5px; }
        p.subtitle { color: #666; margin-bottom: 20px; font-style: italic; }

        .experiment-container {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 8px 16px rgba(0,0,0,0.1);
            position: relative;
        }

        /* Khung vẽ mạch điện */
        .circuit-board {
            position: relative;
            width: 600px;
            height: 350px;
            margin: 0 auto;
        }

        /* Tọa độ chuẩn: Trục trái x=100, Trục phải x=450, Trục trên y=70, Trục dưới y=250 */

        .wire {
            position: absolute;
            background-color: #333;
            z-index: 1;
        }

        /* Các đường dây dẫn mạch chính */
        .wire-left { top: 70px; left: 100px; width: 4px; height: 180px; }
        .wire-right { top: 70px; left: 450px; width: 4px; height: 180px; }
        .wire-bottom { top: 250px; left: 100px; width: 354px; height: 4px; }

        .label {
            position: absolute;
            font-weight: bold;
            font-size: 16px;
            color: #222;
            z-index: 10;
        }

        /* Dây hợp kim Nicrom */
        .nicrom-wire {
            position: absolute;
            top: 67px;
            left: 100px;
            width: 354px;
            height: 10px;
            background-color: #777;
            border-radius: 5px;
            transition: all 0.5s ease;
            z-index: 2;
        }

        .nicrom-wire.hot {
            background-color: #ff4500;
            box-shadow: 0 0 15px #ff4500, 0 0 30px #ff0000;
        }

        /* Các mảnh giấy */
        .paper-piece {
            position: absolute;
            top: 45px;
            width: 30px;
            height: 40px;
            background-color: #fffde7;
            border: 1px solid #ccc;
            border-radius: 2px;
            box-shadow: 2px 2px 5px rgba(0,0,0,0.1);
            transition: all 0.6s cubic-bezier(0.25, 1, 0.5, 1);
            z-index: 3;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 10px;
            color: #999;
        }

        .paper-piece.burn {
            transform: translateY(50px) rotate(20deg);
            opacity: 0;
            background-color: #8b4513;
        }

        /* Điện trở R */
        .resistor {
            position: absolute;
            top: 130px;
            left: 90px;
            width: 20px;
            height: 60px;
            background-color: #fff;
            border: 3px solid #333;
            border-radius: 4px;
            z-index: 2;
        }

        /* Công tắc K */
        .switch-base {
            position: absolute;
            top: 245px;
            left: 200px;
            width: 60px;
            height: 10px;
            background-color: #555;
            border-radius: 5px;
            z-index: 2;
        }

        .switch-lever {
            position: absolute;
            top: 248px;
            left: 205px;
            width: 50px;
            height: 4px;
            background-color: #999;
            border-radius: 2px;
            transform-origin: left center;
            transform: rotate(-45deg); /* Mặc định mở */
            transition: transform 0.3s ease;
            cursor: pointer;
            z-index: 4;
        }

        .switch-lever.closed { transform: rotate(0deg); background-color: #ccc; }
        
        .switch-knob {
            position: absolute;
            width: 14px;
            height: 14px;
            background-color: #333;
            border-radius: 50%;
            top: 243px;
            cursor: pointer;
            z-index: 5;
        }

        /* Nguồn điện E */
        .battery-group {
            position: absolute;
            top: 230px; /* Căn giữa theo trục y=250 */
            left: 330px;
            display: flex;
            align-items: center;
            z-index: 2;
        }

        .battery-long {
            width: 4px;
            height: 40px;
            background-color: #333;
        }

        .battery-short {
            width: 8px;
            height: 20px;
            background-color: #333;
            margin-left: 2px;
            margin-right: 6px; /* Khoảng cách giữa 2 pin */
        }

        /* Dòng electron (hiệu ứng) */
        .electron {
            position: absolute;
            width: 8px;
            height: 8px;
            background-color: #00bfff;
            border-radius: 50%;
            box-shadow: 0 0 8px #00bfff;
            display: none;
            z-index: 6;
        }

        /* Nút điều khiển */
        .controls { margin-top: 30px; text-align: center; }
        button {
            padding: 12px 24px;
            font-size: 16px;
            font-weight: bold;
            color: white;
            background-color: #007bff;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: background-color 0.3s;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        button:hover { background-color: #0056b3; }
        button.active { background-color: #dc3545; }
        .explanation {
            margin-top: 15px;
            font-size: 15px;
            color: #d9534f;
            font-weight: bold;
            height: 20px;
            text-align: center;
        }
    </style>
</head>
<body>

    <h2>Mô phỏng Hình 23.1</h2>
    <p class="subtitle">Thí nghiệm tìm hiểu về tác dụng nhiệt của dòng điện</p>

    <div class="experiment-container">
        <div class="circuit-board">
            
            <!-- 1. Vẽ các đường dây dẫn (liền mạch) -->
            <div class="wire wire-left"></div>
            <div class="wire wire-right"></div>
            <div class="wire wire-bottom"></div>

            <!-- 2. Dòng Electron chuyển động -->
            <div class="electron" id="e1"></div>
            <div class="electron" id="e2"></div>
            <div class="electron" id="e3"></div>
            <div class="electron" id="e4"></div>
            <div class="electron" id="e5"></div>

            <!-- 3. Dây Nicrom và Nhãn A, B -->
            <div id="nicrom" class="nicrom-wire"></div>
            <div class="label" style="top: 50px; left: 90px;">A</div>
            <div class="label" style="top: 50px; left: 460px;">B</div>

            <!-- 4. Các mảnh giấy -->
            <div class="paper-piece" style="left: 160px;">Giấy</div>
            <div class="paper-piece" style="left: 250px;">Giấy</div>
            <div class="paper-piece" style="left: 340px;">Giấy</div>

            <!-- 5. Điện trở R -->
            <div class="resistor"></div>
            <div class="label" style="top: 145px; left: 120px;">R</div>

            <!-- 6. Công tắc K -->
            <div class="switch-base"></div>
            <div class="switch-knob" style="left: 196px;"></div> 
            <div class="switch-knob" style="left: 254px;"></div> 
            <div id="switchLever" class="switch-lever"></div>
            <div class="label" style="top: 260px; left: 220px;">K</div>

            <!-- 7. Nguồn điện E (Trái dài +, Phải ngắn -) -->
            <div class="battery-group">
                <!-- Pin 1: Trái dài, Phải ngắn -->
                <div class="battery-long"></div>
                <div class="battery-short"></div>
                <!-- Pin 2: Trái dài, Phải ngắn -->
                <div class="battery-long"></div>
                <div class="battery-short" style="margin-right: 0;"></div>
            </div>
            
            <!-- Các nhãn của nguồn điện -->
            <div class="label" style="top: 200px; left: 322px; font-size: 18px;">+</div>
            <!-- ĐÃ CHỈNH SỬA: Dời dấu trừ từ 385px về 372px để sát cạnh ngắn hơn -->
            <div class="label" style="top: 200px; left: 372px; font-size: 18px;">-</div>
            <div class="label" style="top: 265px; left: 365px;">E</div>
        </div>

        <div class="controls">
            <button id="toggleBtn">Đóng công tắc K</button>
            <div id="statusText" class="explanation"></div>
        </div>
    </div>

    <script>
        const toggleBtn = document.getElementById('toggleBtn');
        const switchLever = document.getElementById('switchLever');
        const nicrom = document.getElementById('nicrom');
        const papers = document.querySelectorAll('.paper-piece');
        const statusText = document.getElementById('statusText');
        const electrons = document.querySelectorAll('.electron');

        let isClosed = false;
        let animationFrameId;

        // Mảng các điểm mốc trên đường đi của Electron 
        // (Electron đi từ cực Âm (-) sang cực Dương (+))
        const pathPoints = [
            { x: 375, y: 252 }, // 0. Bắt đầu từ cực âm (-) bên phải của E
            { x: 450, y: 252 }, // 1. Đi ra góc phải dưới
            { x: 450, y: 70 },  // 2. Đi lên điểm B
            { x: 100, y: 70 },  // 3. Đi qua Nicrom sang A
            { x: 100, y: 252 }, // 4. Đi xuống qua R
            { x: 200, y: 252 }, // 5. Đi qua K
            { x: 326, y: 252 }  // 6. Đi vào cực dương (+) bên trái của E
        ];

        let progress = [0, 0.2, 0.4, 0.6, 0.8]; 
        const speed = 0.003;

        function getPosition(p) {
            let targetDist = p;
            let currentDist = 0;

            for (let i = 0; i < pathPoints.length - 1; i++) {
                let pt1 = pathPoints[i];
                let pt2 = pathPoints[i+1];
                let segDist = Math.hypot(pt2.x - pt1.x, pt2.y - pt1.y); 
                let totalDist = 75 + 180 + 350 + 182 + 100 + 126; 
                
                if (targetDist * totalDist <= currentDist + segDist) {
                    let ratio = (targetDist * totalDist - currentDist) / segDist;
                    return {
                        x: pt1.x + (pt2.x - pt1.x) * ratio,
                        y: pt1.y + (pt2.y - pt1.y) * ratio
                    };
                }
                currentDist += segDist;
            }
            return pathPoints[pathPoints.length - 1];
        }

        function animateElectrons() {
            if (!isClosed) return;

            electrons.forEach((e, index) => {
                progress[index] += speed;
                if (progress[index] > 1) progress[index] = 0;

                let pos = getPosition(progress[index]);
                
                e.style.left = `${pos.x - 4}px`;
                e.style.top = `${pos.y - 4}px`;
                e.style.display = 'block';
            });

            animationFrameId = requestAnimationFrame(animateElectrons);
        }

        toggleBtn.addEventListener('click', () => {
            isClosed = !isClosed;

            if (isClosed) {
                switchLever.classList.add('closed');
                toggleBtn.textContent = "Ngắt công tắc K";
                toggleBtn.classList.add('active');
                
                nicrom.classList.add('hot');
                
                setTimeout(() => {
                    if(isClosed) {
                        papers.forEach(paper => paper.classList.add('burn'));
                        statusText.textContent = "Dòng điện làm dây Nicrom nóng lên, các mảnh giấy bị cháy rơi xuống!";
                    }
                }, 1500);

                animateElectrons();

            } else {
                switchLever.classList.remove('closed');
                toggleBtn.textContent = "Đóng công tắc K";
                toggleBtn.classList.remove('active');
                
                nicrom.classList.remove('hot');
                papers.forEach(paper => paper.classList.remove('burn'));
                statusText.textContent = "";
                
                electrons.forEach(e => e.style.display = 'none');
                cancelAnimationFrame(animationFrameId);
            }
        });
    </script>
</body>
</html>