import React, { useState, useEffect } from 'react';

/**
 * Relógio Analógico Minimalista em SVG com mostrador branco, traços pretos,
 * ponteiros de hora/minuto pretos e ponteiro de segundo vermelho.
 * Sem fundo retangular ao redor (transparente), destacando o círculo analógico.
 */
export default function AnalogClock({ size = 32, className = '' }) {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const sec = time.getSeconds();
  const min = time.getMinutes();
  const hr = time.getHours() % 12;

  // Ângulos dos ponteiros em graus
  const secAngle = sec * 6; // 360 / 60
  const minAngle = (min + sec / 60) * 6;
  const hrAngle = (hr + min / 60) * 30; // 360 / 12

  // 12 traços das horas no perímetro interno
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const angleRad = (i * 30 * Math.PI) / 180;
    const isMajor = i % 3 === 0; // 12, 3, 6, 9
    const rOuter = 13.5;
    const rInner = isMajor ? 10.5 : 11.5;
    const x1 = 16 + rOuter * Math.sin(angleRad);
    const y1 = 16 - rOuter * Math.cos(angleRad);
    const x2 = 16 + rInner * Math.sin(angleRad);
    const y2 = 16 - rInner * Math.cos(angleRad);
    return {
      id: i,
      x1,
      y1,
      x2,
      y2,
      strokeWidth: isMajor ? 1.4 : 0.8,
    };
  });

  return (
    <div 
      className={`inline-flex items-center justify-center shrink-0 ${className}`} 
      style={{ width: `${size}px`, height: `${size}px` }}
      aria-label="Relógio analógico"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className="overflow-visible drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
      >
        {/* Mostrador circular com fundo branco e aro fino preto */}
        <circle
          cx="16"
          cy="16"
          r="14.8"
          fill="#ffffff"
          stroke="#0f172a"
          strokeWidth="1.2"
        />

        {/* 12 Traços pretos das horas */}
        {ticks.map((t) => (
          <line
            key={t.id}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke="#000000"
            strokeWidth={t.strokeWidth}
            strokeLinecap="round"
          />
        ))}

        {/* Ponteiro das Horas (Preto, curto e robusto) */}
        <line
          x1="16"
          y1="16"
          x2="16"
          y2="8.2"
          stroke="#000000"
          strokeWidth="2.2"
          strokeLinecap="round"
          transform={`rotate(${hrAngle} 16 16)`}
        />

        {/* Ponteiro dos Minutos (Preto, mais fino e comprido) */}
        <line
          x1="16"
          y1="16"
          x2="16"
          y2="5"
          stroke="#000000"
          strokeWidth="1.6"
          strokeLinecap="round"
          transform={`rotate(${minAngle} 16 16)`}
        />

        {/* Ponteiro dos Segundos (Vermelho vivo com cauda de contrapeso) */}
        <line
          x1="16"
          y1="19"
          x2="16"
          y2="3.8"
          stroke="#ef4444"
          strokeWidth="1"
          strokeLinecap="round"
          transform={`rotate(${secAngle} 16 16)`}
        />

        {/* Pino central vermelho */}
        <circle cx="16" cy="16" r="1.5" fill="#ef4444" />
      </svg>
    </div>
  );
}
