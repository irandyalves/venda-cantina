import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X, Sparkles, Check } from 'lucide-react';

export default function AutoToast({ toast, onClose, duration = 1000, variant = 'modal' }) {
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

  // VARIANTE SPINNER (RODA BONITA COM GIRO FLUÍDO PARA CONFIGURAÇÕES):
  if (variant === 'spinner' || toast.variant === 'spinner') {
    return (
      <div className="fixed top-6 right-6 z-[9999] pointer-events-none animate-toast-in">
        <div className={`pointer-events-auto flex items-center gap-3.5 px-4 py-3 rounded-2xl shadow-2xl border-2 backdrop-blur-md ${
          isSuccess 
            ? 'bg-slate-900/95 border-emerald-500/80 shadow-emerald-500/20 text-white' 
            : isError 
              ? 'bg-slate-900/95 border-rose-500/80 shadow-rose-500/20 text-white'
              : 'bg-slate-900/95 border-amber-500/80 shadow-amber-500/20 text-white'
        }`}>
          {/* RODA BONITA COM GIRO FLUÍDO */}
          <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
            <svg className="w-8 h-8 animate-spin" viewBox="0 0 36 36">
              <circle
                className="opacity-20 text-slate-600"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                r="15"
                cx="18"
                cy="18"
              />
              <circle
                className={isSuccess ? 'text-emerald-400' : isError ? 'text-rose-400' : 'text-amber-400'}
                strokeWidth="3.5"
                strokeDasharray="42 58"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                r="15"
                cx="18"
                cy="18"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {isSuccess ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
              ) : isError ? (
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              )}
            </div>
          </div>

          <div className="min-w-0 pr-2">
            <div className={`text-[11px] font-black uppercase tracking-wider ${
              isSuccess ? 'text-emerald-400' : isError ? 'text-rose-400' : 'text-amber-400'
            }`}>
              {toast.title || (isSuccess ? 'Configurações Salvas' : 'Aviso')}
            </div>
            <div className="text-xs font-bold text-slate-100 truncate max-w-xs mt-0.5">
              {toast.message || toast.text}
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors ml-1"
            title="Fechar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none flex items-start sm:items-center justify-center p-4 pt-16 sm:pt-4">
      {/* Backdrop suave */}
      <div 
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 pointer-events-auto"
        onClick={onClose}
      />

      {/* Cartão do Modal Bonito (Rápido - 1 segundo) */}
      <div 
        className={`pointer-events-auto relative w-full max-w-md mx-auto rounded-2xl p-4 sm:p-5 shadow-2xl border-2 transition-all transform animate-toast-in ${
          isSuccess 
            ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-emerald-500/80 shadow-emerald-500/20 text-white' 
            : isError 
              ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-rose-500/80 shadow-rose-500/20 text-white'
              : 'bg-gradient-to-b from-slate-900 to-slate-950 border-amber-500/80 shadow-amber-500/20 text-white'
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Ícone */}
          <div className={`p-2.5 rounded-xl shrink-0 shadow-lg ${
            isSuccess 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
              : isError 
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
          }`}>
            {isSuccess ? (
              <CheckCircle2 className="w-6 h-6 animate-pulse" />
            ) : isError ? (
              <AlertCircle className="w-6 h-6 animate-bounce" />
            ) : (
              <Sparkles className="w-6 h-6" />
            )}
          </div>

          {/* Texto e detalhes */}
          <div className="flex-1 pr-6">
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              {toast.title || (isSuccess ? 'Sucesso!' : isError ? 'Atenção' : 'Aviso')}
            </h4>
            <p className="text-sm sm:text-base font-bold text-white mt-1 leading-snug">
              {toast.message || toast.text}
            </p>
            {toast.subtext && (
              <p className="text-xs text-slate-400 mt-1">{toast.subtext}</p>
            )}
          </div>

          {/* Botão de Fechar rápido */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Barra de progresso animada rápida que consome e fecha */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
          <div 
            style={{ animationDuration: `${duration}ms` }}
            className={`h-full rounded-full animate-toast-progress ${
              isSuccess ? 'bg-emerald-400' : isError ? 'bg-rose-400' : 'bg-amber-400'
            }`} 
          />
        </div>
      </div>
    </div>
  );
}
