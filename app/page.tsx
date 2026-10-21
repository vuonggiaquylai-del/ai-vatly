"use client";

import { useState } from "react";
import Image from "next/image";
import ChatPanel from "./components/ChatPanel";
import DensityExperiment from "./components/DensityExperiment";

export default function Home() {
  // Chỉ hiện thí nghiệm khi AI nhận ra người dùng muốn mô phỏng khối lượng riêng
  const [showExperiment, setShowExperiment] = useState(false);

  return (
    <main className="flex flex-1 flex-col bg-[#eef2f5] font-['Segoe_UI',Tahoma,Geneva,Verdana,sans-serif] lg:h-screen lg:flex-row">
      {/* Nửa trái: chat AI (trên mobile nằm dưới) */}
      <section className="order-2 h-screen px-2.5 pb-2.5 lg:order-1 lg:w-1/2 lg:px-[15px] lg:pb-[15px]">
        <ChatPanel onShowExperiment={() => setShowExperiment(true)} />
      </section>

      {/* Nửa phải: ảnh minh hoạ, hoặc thí nghiệm hộp trên cân */}
      <section className="order-1 lg:order-2 lg:h-full lg:w-1/2 lg:overflow-y-auto">
        {showExperiment ? (
          <DensityExperiment />
        ) : (
          <div className="flex h-full items-center justify-center p-6">
            <Image
              src="/intro.png"
              alt="Minh hoạ học tập"
              width={2500}
              height={2500}
              priority
              className="h-auto max-h-full w-full max-w-[560px] object-contain"
            />
          </div>
        )}
      </section>
    </main>
  );
}
