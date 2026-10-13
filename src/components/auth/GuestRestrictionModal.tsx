import React from 'react';
import { Lock, Mail, ArrowRight, X, ShieldAlert, Sparkles, Wrench, Palette, MessageSquare } from 'lucide-react';
import { sounds } from '../../services/soundEffects';

export type GuestRestrictionType = 'studio' | 'avatar' | 'chat';

interface GuestRestrictionModalProps {
  isOpen: boolean;
  type: GuestRestrictionType;
  onClose: () => void;
  onOpenEmailAuth: () => void;
}

export const GuestRestrictionModal: React.FC<GuestRestrictionModalProps> = ({
  isOpen,
  type,
  onClose,
  onOpenEmailAuth
}) => {
  if (!isOpen) return null;

  const contentMap = {
    studio: {
      title: 'Criação de Jogos Bloqueada para Visitantes',
      description: 'Como visitante, você só pode explorar e jogar experiências. Para construir seus próprios mundos 3D, programar scripts Luau e usar a IA Copilot no Blox Studio, faça login com seu email!',
      icon: <Wrench className="w-8 h-8 text-amber-400" />,
      badge: 'Blox Studio Exclusivo'
    },
    avatar: {
      title: 'Avatar Bloqueado no Modo Noob',
      description: 'Visitantes usam o visual oficial do Noob (amarelo, azul e verde). Para personalizar todas as cores do corpo, equipar chapéus, faces, camisas, calças e animações, cadastre seu email!',
      icon: <Palette className="w-8 h-8 text-[#00a2ff]" />,
      badge: 'Editor de Avatar Exclusivo'
    },
    chat: {
      title: 'Chat Bloqueado para Visitantes',
      description: 'O chat nas experiências é restrito para jogadores com conta verificada por email para manter o ambiente seguro. Faça login para bater papo em tempo real com todos!',
      icon: <MessageSquare className="w-8 h-8 text-purple-400" />,
      badge: 'Chat de Voz/Texto Exclusivo'
    }
  };

  const current = contentMap[type] || contentMap.studio;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
      <div className="relative w-full max-w-md bg-[#181a24] border-2 border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <Lock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                {current.badge}
              </span>
              <h3 className="text-base font-extrabold text-white leading-tight">
                {current.title}
              </h3>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-[#12141c] border border-white/10 rounded-2xl p-4 flex items-start gap-3.5">
          <div className="shrink-0 mt-0.5">{current.icon}</div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {current.description}
          </p>
        </div>

        <div className="p-3 bg-gradient-to-r from-[#00a2ff]/10 to-purple-500/10 border border-[#00a2ff]/30 rounded-2xl text-xs text-slate-200 flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-[#00a2ff] shrink-0" />
          <span>Cadastre seu email gratuitamente em 10 segundos e ganhe 1.500 BloxBux!</span>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Continuar Visitante
          </button>

          <button
            onClick={() => {
              sounds.playPurchase();
              onClose();
              onOpenEmailAuth();
            }}
            className="flex-1 bg-gradient-to-r from-[#00a2ff] to-[#0070f3] hover:from-[#38bdf8] hover:to-[#00a2ff] text-white py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 cursor-pointer"
          >
            <Mail className="w-4 h-4" />
            <span>Entrar com Email</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
