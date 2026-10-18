import React, { useEffect } from 'react';
import { Check, AlertCircle, Sparkles } from 'lucide-react';

export default function AutoToast({ toast, onClose, duration = 1500 }) {
  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [toast, onClose, duration]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success' || !toast.type;
  const isError = toast.type === 'error';

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center p-4">
      {/* Backdrop escurecido e desfocado */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto"
        onClick={onClose}
      />

      {/* CÍRCULO / BOLA COM EFEITO BONITO GIRANDO E PULSANDO (1.5 SEG) */}
      <div className="pointer-events-auto relative flex flex-col items-center justify-center animate-order-circle-pop select-none">
        
        {/* A BOLA / CÍRCULO CENTRAL */}
        <div className="relative w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center">
          
          {/* Anel Externo Girando em Órbita Fluída */}
          <div className="absolute inset-0 rounded-full animate-order-ring-spin pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="47"
                fill="none"
                stroke={isSuccess ? 'rgba(52, 211, 153, 0.3)' : isError ? 'rgba(244, 63, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)'}
                strokeWidth="2.5"
                strokeDasharray="12 8 24 8"
                strokeLinecap="round"
              />
              <circle
                cx="50"
                cy="50"
                r="47"
                fill="none"
                stroke={isSuccess ? '#34d399' : isError ? '#f43f5e' : '#fbbf24'}
                strokeWidth="4"
                strokeDasharray="36 170"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Halo / Pulso de fundo */}
          <div className={`absolute inset-4 rounded-full animate-ping opacity-20 ${
            isSuccess ? 'bg-emerald-500' : isError ? 'bg-rose-500' : 'bg-amber-500'
          }`} />

          {/* A Esfera / Bola Central com Vidro, Borda Neon e Brilho Pulsante */}
          <div className={`relative w-44 h-44 sm:w-52 sm:h-52 rounded-full flex flex-col items-center justify-center p-3 text-center border-2 shadow-2xl backdrop-blur-xl animate-order-circle-glow ${
            isSuccess
              ? 'bg-gradient-to-b from-slate-900/95 via-emerald-950/85 to-slate-950/95 text-white'
              : isError
                ? 'bg-gradient-to-b from-slate-900/95 via-rose-950/85 to-slate-950/95 text-white'
                : 'bg-gradient-to-b from-slate-900/95 via-amber-950/85 to-slate-950/95 text-white'
          }`}>
            
            {/* Ícone de Sucesso / Erro */}
            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-1 shadow-lg ${
              isSuccess 
                ? 'bg-emerald-500/25 text-emerald-400 border border-emerald-400/60 shadow-emerald-500/40' 
                : isError
                  ? 'bg-rose-500/25 text-rose-400 border border-rose-400/60 shadow-rose-500/40'
                  : 'bg-amber-500/25 text-amber-400 border border-amber-400/60 shadow-amber-500/40'
            }`}>
              {isSuccess ? (
                <Check className="w-8 h-8 sm:w-9 sm:h-9 stroke-[3.5] drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              ) : isError ? (
                <AlertCircle className="w-8 h-8 sm:w-9 sm:h-9 stroke-[3]" />
              ) : (
                <Sparkles className="w-8 h-8 sm:w-9 sm:h-9" />
              )}
            </div>

            {/* Título Principal no centro da Bola */}
            <span className={`text-[10px] sm:text-xs font-black uppercase tracking-widest ${
              isSuccess ? 'text-emerald-400' : isError ? 'text-rose-400' : 'text-amber-400'
            }`}>
              {isSuccess ? 'PEDIDO ENVIADO!' : (toast.title || 'ATENÇÃO')}
            </span>

            {/* Número da Comanda / Senha com destaque */}
            {toast.orderNumber && (
              <span className="text-lg sm:text-xl font-black font-mono text-amber-400 tracking-tight mt-0.5 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]">
                {toast.orderNumber}
              </span>
            )}

            {/* Nome do Cliente */}
            {toast.customerName && (
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-200 uppercase truncate max-w-[130px] sm:max-w-[160px]">
                {toast.customerName}
              </span>
            )}

            {/* Mensagem genérica se não tiver orderNumber */}
            {!toast.orderNumber && (toast.message || toast.text) && (
              <span className="text-[10px] sm:text-xs font-bold text-slate-200 line-clamp-2 px-1">
                {toast.message || toast.text}
              </span>
            )}

          </div>
        </div>

        {/* Destino da Cozinha embaixo do Círculo com cápsula estilizada */}
        {toast.destination && (
          <div className="mt-3 px-3.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-[11px] font-bold text-slate-300 shadow-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Enviado para: <strong className="text-white">{toast.destination}</strong></span>
          </div>
        )}

      </div>
    </div>
  );
}
