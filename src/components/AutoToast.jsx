import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X, Sparkles } from 'lucide-react';

export default function AutoToast({ toast, onClose, duration = 2000 }) {
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
    <div className="fixed inset-0 z-[9999] pointer-events-none flex items-start sm:items-center justify-center p-4 pt-16 sm:pt-4">
      {/* Backdrop suave */}
      <div 
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 pointer-events-auto"
        onClick={onClose}
      />

      {/* Cartão do Modal Bonito (2 segundos) */}
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

        {/* Barra de progresso animada de 2 segundos que consome e fecha */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
          <div 
            className={`h-full rounded-full animate-toast-progress ${
              isSuccess ? 'bg-emerald-400' : isError ? 'bg-rose-400' : 'bg-amber-400'
            }`} 
          />
        </div>
      </div>
    </div>
  );
}
