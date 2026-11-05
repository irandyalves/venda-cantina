import React, { useState } from 'react';
import { 
  Smartphone, 
  Tablet, 
  ChefHat, 
  Tv, 
  ShieldCheck, 
  CheckCircle2, 
  UtensilsCrossed, 
  ArrowRight,
  X,
  Sparkles,
  Store
} from 'lucide-react';
import { authService } from '../services/auth';

export default function TerminalSetupModal({ isOpen, onSelectEnvironment, onClose }) {
  const [environments] = useState(() => authService.getEnvironments());
  const [selectedEnv, setSelectedEnv] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isOpen) return null;

  const handleChoose = (env) => {
    setSelectedEnv(env);
    setIsConfirming(true);

    // Salva perfil e seleciona o ambiente
    authService.setActiveProfile(env.id);

    setTimeout(() => {
      onSelectEnvironment(env);
    }, 1200);
  };

  const getEnvIcon = (env) => {
    if (env.type === 'display') return <Tv className="w-8 h-8 text-emerald-400" />;
    if (env.type === 'cashier') return <ShieldCheck className="w-8 h-8 text-amber-400" />;
    if (env.name.toLowerCase().includes('pizza')) return <ChefHat className="w-8 h-8 text-orange-400" />;
    if (env.name.toLowerCase().includes('pastel')) return <UtensilsCrossed className="w-8 h-8 text-yellow-400" />;
    if (env.name.toLowerCase().includes('açaí') || env.name.toLowerCase().includes('acai')) return <Sparkles className="w-8 h-8 text-purple-400" />;
    return <UtensilsCrossed className="w-8 h-8 text-rose-400" />;
  };

  const getCardStyle = (env) => {
    if (env.type === 'display') return 'hover:border-emerald-400 hover:bg-emerald-950/40 border-emerald-500/30';
    if (env.type === 'cashier') return 'hover:border-amber-400 hover:bg-amber-950/40 border-amber-500/30';
    return 'hover:border-orange-400 hover:bg-orange-950/40 border-slate-700/80';
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn select-none">
      <div className="bg-slate-900 border-2 border-emerald-500/60 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 text-slate-100 animate-scaleUp">
        
        {/* CABEÇALHO */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold tracking-wide">
            <Smartphone className="w-4 h-4" />
            <Tablet className="w-4 h-4" />
            <span>Configuração do Aparelho (Tablet / Celular)</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Onde este dispositivo ficará?
          </h2>

          <p className="text-sm sm:text-base text-slate-300 max-w-lg mx-auto">
            Toque abaixo no local de trabalho deste tablet ou celular para começar a receber os pedidos dos caixas em tempo real:
          </p>
        </div>

        {/* FEEDBACK DE CONFIRMAÇÃO */}
        {isConfirming && selectedEnv ? (
          <div className="p-8 bg-emerald-950/80 border-2 border-emerald-400 rounded-3xl text-center space-y-4 animate-scaleUp">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)]">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Dispositivo Conectado com Sucesso!
              </h3>
              <p className="text-emerald-300 font-bold text-base sm:text-lg mt-1">
                Local: {selectedEnv.name}
              </p>
            </div>
            <p className="text-xs text-slate-300">
              Pronto! Agora é só levar este aparelho e deixá-lo na bancada correspondente para operar.
            </p>
          </div>
        ) : (
          /* LISTA DE AMBIENTES DISPONÍVEIS */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {environments.map((env) => {
              const isKitchen = env.type === 'kitchen';
              const isDisplay = env.type === 'display';
              const isCashier = env.type === 'cashier';

              return (
                <button
                  key={env.id}
                  type="button"
                  onClick={() => handleChoose(env)}
                  className={`p-4 sm:p-5 rounded-2xl bg-slate-950/90 border-2 transition-all cursor-pointer flex items-center gap-4 text-left group active:scale-95 shadow-lg ${getCardStyle(env)}`}
                >
                  <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 shrink-0 group-hover:scale-110 transition-transform">
                    {getEnvIcon(env)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-black text-white group-hover:text-amber-300 transition-colors truncate">
                        {env.name}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {env.description || (isKitchen ? 'Preparo & Cozinha' : isDisplay ? 'Painel TV de Chamada' : 'Caixa & Vendas')}
                    </p>

                    <span className="inline-block text-[10px] font-bold text-emerald-400 mt-1">
                      Toque para conectar →
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* RODAPÉ INFORMATIVO */}
        {!isConfirming && (
          <div className="pt-3 border-t border-slate-800 text-center flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <span>
              💡 Dica: Você pode alterar o ambiente deste aparelho a qualquer momento pelo menu de perfis.
            </span>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-white underline cursor-pointer shrink-0"
              >
                Continuar sem selecionar
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
