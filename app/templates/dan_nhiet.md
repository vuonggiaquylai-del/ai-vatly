<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mô phỏng Sự Dẫn Nhiệt</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f0f4f8;
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-top: 50px;
        }

        h2 {
            color: #2c3e50;
            margin-bottom: 5px;
        }

        p.desc {
            color: #555;
            margin-bottom: 30px;
            font-style: italic;
        }

        /* Khung thí nghiệm */
        .experiment-container {
            position: relative;
            width: 700px;
            height: 400px;
            background: linear-gradient(to bottom, #e0eaf5, #b8d4f1);
            border-radius: 10px;
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
            overflow: hidden;
        }

        /* Giá đỡ */
        .stand-vertical {
            position: absolute;
            bottom: 50px;
            left: 100px;
            width: 15px;
            height: 250px;
            background-color: #8a6d5c;
            border-radius: 5px;
        }

        .stand-base {
            position: absolute;
            bottom: 40px;
            left: 60px;
            width: 100px;
            height: 15px;
            background-color: #6d5345;
            border-radius: 5px;
        }

        /* Thanh đồng (Ban đầu màu xám) */
        .copper-bar {
            position: absolute;
            top: 150px;
            left: 100px;
            width: 500px;
            height: 20px;
            background-color: #95a5a6; /* Màu xám */
            border-radius: 3px;
            box-shadow: inset 0px -5px 10px rgba(0,0,0,0.2);
            z-index: 10;
            overflow: hidden; /* Giữ hiệu ứng nhiệt nằm gọn trong thanh */
        }

        /* Hiệu ứng dòng nhiệt (Màu đỏ chạy) */
        .heat-flow {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 0%; /* Ban đầu bằng 0 */
            background: linear-gradient(90deg, #c0392b, #ff4757);
            box-shadow: 0 0 10px #ff4757; /* Hiệu ứng phát sáng */
            /* Transition sẽ được JS điều khiển để chạy mượt mà */
        }

        /* Nhãn A và B ở 2 đầu thanh đồng */
        .label-ends {
            position: absolute;
            top: 145px;
            font-weight: bold;
            font-size: 20px;
            color: #2c3e50;
            z-index: 15;
        }
        .label-A { left: 75px; color: #c0392b; }
        .label-B { left: 615px; }

        /* Khung chứa các đinh */
        .nails-container {
            position: absolute;
            top: 110px;
            left: 120px; 
            width: 460px; 
            display: flex;
            justify-content: space-between;
            z-index: 20; /* Đảm bảo đinh nằm trên thanh đồng */
        }

        /* Từng cụm (Chữ + Sáp + Đinh) */
        .nail-group {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 20px;
        }

        .label-text {
            font-weight: bold;
            font-size: 18px;
            color: #2c3e50;
            margin-bottom: 10px;
            transition: color 0.3s;
        }

        .wax {
            width: 6px;
            height: 12px;
            background-color: #f1c40f; /* Màu vàng sáp */
            border-radius: 2px;
            transition: all 0.3s ease;
            z-index: 2;
        }

        .nail {
            width: 4px;
            height: 40px;
            background-color: #7f8c8d;
            position: relative;
            z-index: 1;
        }

        .nail::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 12px;
            height: 4px;
            background-color: #34495e;
            border-radius: 50%;
        }

        /* Hiệu ứng đinh rơi */
        .falling {
            animation: fallDown 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }

        @keyframes fallDown {
            0% { transform: translateY(0); opacity: 1; }
            100% { transform: translateY(250px); opacity: 0; }
        }

        /* Ngọn lửa đèn cồn */
        .fire {
            position: absolute;
            top: 175px;
            left: 90px;
            width: 40px;
            height: 60px;
            background: radial-gradient(circle, #ff9f43 20%, #ee5253 80%);
            border-radius: 50% 50% 20% 20%;
            opacity: 0;
            transition: opacity 0.5s ease;
            animation: flicker 0.2s infinite alternate;
            z-index: 12;
        }

        .fire.active {
            opacity: 1;
        }

        @keyframes flicker {
            0% { transform: scale(1) translateY(0); }
            100% { transform: scale(1.1) translateY(-5px); }
        }

        /* Nút điều khiển */
        .controls {
            margin-top: 30px;
        }

        button {
            padding: 12px 24px;
            font-size: 16px;
            background-color: #3498db;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: background-color 0.3s, transform 0.1s;
        }

        button:hover {
            background-color: #2980b9;
        }

        button:disabled {
            background-color: #bdc3c7;
            cursor: not-allowed;
        }
    </style>
</head>
<body>

    <h2>Thí nghiệm: Sự dẫn nhiệt</h2>
    <p class="desc">Dòng nhiệt lan truyền từ A đến B làm sáp tan chảy và đinh rơi</p>

    <div class="experiment-container">
        <div class="stand-base"></div>
        <div class="stand-vertical"></div>
        <div class="fire" id="fire"></div>

        <!-- Thanh đồng chứa hiệu ứng nhiệt -->
        <div class="copper-bar" id="copperBar">
            <div class="heat-flow" id="heatFlow"></div>
        </div>

        <div class="label-ends label-A">A</div>
        <div class="label-ends label-B">B</div>

        <div class="nails-container">
            <div class="nail-group" id="group-a">
                <div class="label-text" id="text-a">a</div>
                <div class="wax" id="wax-a"></div>
                <div class="nail" id="nail-a"></div>
            </div>
            <div class="nail-group" id="group-b">
                <div class="label-text" id="text-b">b</div>
                <div class="wax" id="wax-b"></div>
                <div class="nail" id="nail-b"></div>
            </div>
            <div class="nail-group" id="group-c">
                <div class="label-text" id="text-c">c</div>
                <div class="wax" id="wax-c"></div>
                <div class="nail" id="nail-c"></div>
            </div>
            <div class="nail-group" id="group-d">
                <div class="label-text" id="text-d">d</div>
                <div class="wax" id="wax-d"></div>
                <div class="nail" id="nail-d"></div>
            </div>
            <div class="nail-group" id="group-e">
                <div class="label-text" id="text-e">e</div>
                <div class="wax" id="wax-e"></div>
                <div class="nail" id="nail-e"></div>
            </div>
        </div>
    </div>

    <div class="controls">
        <button id="startBtn">Đốt nóng đầu A</button>
    </div>

    <script>
        const startBtn = document.getElementById('startBtn');
        const fire = document.getElementById('fire');
        const copperBar = document.getElementById('copperBar');
        const heatFlow = document.getElementById('heatFlow');
        const nails = ['a', 'b', 'c', 'd', 'e'];
        
        // Thời gian để dòng nhiệt chạy hết thanh đồng (mili-giây)
        const TOTAL_HEAT_TIME = 4000; 

        startBtn.addEventListener('click', () => {
            startBtn.disabled = true;
            startBtn.innerText = "Đang thí nghiệm...";
            
            // 1. Bật ngọn lửa
            fire.classList.add('active');

            // 2. Kích hoạt dòng nhiệt chạy dọc thanh đồng
            // Dùng setTimeout để lửa cháy một chút rồi mới bắt đầu truyền nhiệt vào thanh
            setTimeout(() => {
                heatFlow.style.transition = `width ${TOTAL_HEAT_TIME}ms linear`;
                heatFlow.style.width = '100%';
            }, 500);

            // 3. Tính toán thời điểm đinh rơi dựa trên vị trí thực tế
            // Lấy tọa độ của thanh đồng
            const barRect = copperBar.getBoundingClientRect();
            const barLeft = barRect.left;
            const barWidth = barRect.width;

            nails.forEach((nailId, index) => {
                const group = document.getElementById(`group-${nailId}`);
                const groupRect = group.getBoundingClientRect();
                
                // Tìm tâm của cụm đinh (tâm của chữ, sáp và đinh)
                const nailCenter = groupRect.left + (groupRect.width / 2);
                
                // Tính khoảng cách từ đầu thanh A đến tâm đinh (pixel)
                const distanceFromStart = nailCenter - barLeft;
                
                // Tính phần trăm quãng đường
                const percent = distanceFromStart / barWidth;
                
                // Tính thời gian dòng nhiệt chạy tới vị trí đinh
                const timeToReach = percent * TOTAL_HEAT_TIME;

                // Đặt hẹn giờ cho từng đinh rơi
                // Cộng thêm 500ms (thời gian chờ đốt lửa ban đầu) và một chút trễ (100ms) để sáp kịp chảy
                setTimeout(() => {
                    const wax = document.getElementById(`wax-${nailId}`);
                    const nail = document.getElementById(`nail-${nailId}`);
                    const text = document.getElementById(`text-${nailId}`);

                    // Hiệu ứng: Chữ đổi sang màu đỏ, sáp tan chảy
                    text.style.color = '#c0392b';
                    wax.style.backgroundColor = 'transparent';
                    wax.style.height = '0px';

                    // Đinh rơi sau khi sáp chảy
                    setTimeout(() => {
                        nail.classList.add('falling');
                    }, 150);

                    // Nếu là đinh cuối cùng, báo hoàn tất
                    if (index === nails.length - 1) {
                        setTimeout(() => {
                            startBtn.innerText = "Thí nghiệm hoàn tất";
                        }, 1500);
                    }

                }, timeToReach + 500); // +500 là thời gian chờ ngọn lửa bén
            });
        });
    </script>
</body>
</html>