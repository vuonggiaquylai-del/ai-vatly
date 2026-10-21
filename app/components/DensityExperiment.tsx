"use client";

import { useState, type CSSProperties } from "react";

// Tỉ lệ quy đổi từ cm sang px (7px để vừa màn hình điện thoại)
const SCALE_FACTOR = 7;

type SliderProps = {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  className?: string;
};

function Slider({ label, unit, value, min, max, step, onChange, className = "" }: SliderProps) {
  return (
    <div className={`mb-3 ${className}`}>
      <label className="mb-[5px] flex justify-between text-[15px] font-bold text-[#333]">
        {label}
        <span className="font-bold text-[#2980b9]">
          {value} {unit}
        </span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="m-0 h-6 w-full cursor-pointer"
      />
    </div>
  );
}

export default function DensityExperiment() {
  const [a, setA] = useState(10);
  const [b, setB] = useState(6);
  const [c, setC] = useState(4);
  const [m, setM] = useState(150);

  const V = a * b * c;
  const D = m / V;

  const boxSize = {
    "--w": `${a * SCALE_FACTOR}px`,
    "--h": `${b * SCALE_FACTOR}px`,
    "--d": `${c * SCALE_FACTOR}px`,
  } as CSSProperties;

  const faceBase = "wood-grain box-border border-[1.5px] border-[#5a3a22]";
  const dimLabel = "pointer-events-none absolute z-20 text-base font-bold italic text-[#2c3e50]";

  return (
    <div className="@container flex w-full items-start justify-center p-2.5 lg:p-[15px] font-['Segoe_UI',Tahoma,Geneva,Verdana,sans-serif] [-webkit-tap-highlight-color:transparent]">
      <div className="flex w-full max-w-[900px] flex-col gap-5 rounded-xl bg-white p-[15px] shadow-[0_10px_30px_rgba(0,0,0,0.1)] @3xl:flex-row @3xl:gap-[30px] @3xl:p-5">
        {/* BẢNG ĐIỀU KHIỂN */}
        <div className="flex-1 border-b-2 border-dashed border-[#ddd] pb-[15px] @3xl:border-r-2 @3xl:border-b-0 @3xl:pr-5 @3xl:pb-0">
          <h2 className="mt-0 mb-4 border-b-2 border-[#f39c12] pb-2 text-lg font-bold text-[#d35400]">
            Thay đổi thông số
          </h2>

          <Slider label="Chiều dài (a)" unit="cm" value={a} min={3} max={15} step={1} onChange={setA} />
          <Slider label="Chiều rộng (b)" unit="cm" value={b} min={3} max={10} step={1} onChange={setB} />
          <Slider label="Chiều cao/Độ sâu (c)" unit="cm" value={c} min={2} max={10} step={1} onChange={setC} />
          <Slider
            label="Khối lượng (m)"
            unit="g"
            value={m}
            min={10}
            max={500}
            step={5}
            onChange={setM}
            className="mt-5"
          />
        </div>

        {/* MÔ PHỎNG HÌNH ẢNH */}
        <div className="relative flex h-auto min-h-[380px] flex-[1.5] flex-col items-center justify-end overflow-hidden rounded-[10px] bg-[#fafafa] px-2.5 py-[15px] @3xl:h-[420px] @3xl:min-h-0 @3xl:p-[15px]">
          {/* Khối gỗ 3D */}
          <div className="relative z-10 mb-2" style={boxSize}>
            {/* Mặt trước */}
            <div
              className={`${faceBase} relative h-(--h) w-(--w) bg-[#c89f7a] shadow-[inset_0_0_10px_rgba(0,0,0,0.1)]`}
            />
            {/* Mặt trên */}
            <div
              className={`${faceBase} absolute bottom-full left-0 h-(--d) w-(--w) origin-bottom-left -skew-x-45 border-b-0 bg-[#e6c29f]`}
            />
            {/* Mặt bên */}
            <div
              className={`${faceBase} absolute top-0 left-full h-(--h) w-(--d) origin-top-left -skew-y-45 border-l-0 bg-[#a37655]`}
            />

            <div className={`${dimLabel} -bottom-7 left-[calc(var(--w)/2)] -translate-x-1/2`}>a</div>
            <div className={`${dimLabel} top-[calc(var(--h)/2)] -left-[25px] -translate-y-1/2`}>b</div>
            <div
              className={`${dimLabel} top-[calc(var(--d)*-0.5_-_15px)] left-[calc(var(--w)_+_var(--d)*0.5_+_10px)]`}
            >
              c
            </div>
          </div>

          {/* Cân điện tử */}
          <div className="z-[5] flex max-w-full flex-col items-center">
            <div className="relative z-[2] -mb-[5px] h-3 w-[180px] max-w-[90%] rounded-md bg-[#bdc3c7] shadow-[0_2px_4px_rgba(0,0,0,0.2)] @3xl:w-[200px]" />
            <div className="z-[1] flex h-[60px] w-[220px] max-w-full items-center justify-center rounded-t-lg bg-[#e74c3c] shadow-[0_4px_6px_rgba(0,0,0,0.2)] @3xl:h-[65px] @3xl:w-[240px]">
              <div className="w-[100px] rounded border-2 border-[#555] bg-[#222] px-3 py-1 text-right font-['Courier_New',Courier,monospace] text-[22px] tracking-[2px] text-[#00ff00] shadow-[inset_0_0_10px_rgba(0,255,0,0.4)] @3xl:w-[110px] @3xl:text-2xl">
                {m.toFixed(1)}
              </div>
              <span className="ml-2 text-xl font-bold text-white">g</span>
            </div>
          </div>

          {/* KẾT QUẢ */}
          <div className="mt-5 w-full rounded-lg border-l-[5px] border-[#2980b9] bg-[#e8f4f8] p-3 text-sm">
            <p className="my-1">
              Thể tích (V) = a × b × c = <span className="font-bold text-[#2980b9]">{V} cm³</span>
            </p>
            <p className="my-1">
              Khối lượng riêng (D) = m / V ={" "}
              <span className="text-lg font-bold text-[#c0392b]">{D.toFixed(2)} g/cm³</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
