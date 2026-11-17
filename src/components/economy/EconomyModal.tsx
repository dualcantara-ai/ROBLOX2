import React, { useState } from 'react';
import { 
  Gift, 
  TrendingUp, 
  CheckCircle2, 
  Crown, 
  Sparkles, 
  CreditCard,
  Zap,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, GameMetadata } from '../../types';
import { sounds } from '../../services/soundEffects';
import { RobuxIcon, RobloxPremiumIcon } from '../common/RobloxIcons';

interface EconomyModalProps {
  user: UserProfile;
  userGames: GameMetadata[];
  isOpen: boolean;
  onClose: () => void;
  onAddBloxbux: (amount: number) => void;
  onClaimDaily: (amount: number) => void;
  canClaimDaily: boolean;
}

const ROBUX_PACKAGES = [
  { amount: 400, price: 'R$ 4,99', popular: false, bonus: 'Pacote Inicial' },
  { amount: 800, price: 'R$ 9,99', popular: false, bonus: 'Padrão' },
  { amount: 1700, price: 'R$ 19,99', popular: true, bonus: '+100 Robux Bônus' },
  { amount: 4500, price: 'R$ 49,99', popular: false, bonus: '+500 Robux Bônus' },
  { amount: 10000, price: 'R$ 99,99', popular: false, bonus: '+2.000 Robux Bônus' }
];

export const EconomyModal: React.FC<EconomyModalProps> = ({
  user,
  userGames,
  isOpen,
  onClose,
  onAddBloxbux,
  onClaimDaily,
  canClaimDaily
}) => {
  const [activeTab, setActiveTab] = useState<'buy' | 'premium' | 'daily' | 'devex'>('buy');
  const [devexSuccess, setDevexSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalGameVisits = userGames.reduce((acc, g) => acc + (g.visits || 0), 0);
  const estimatedEarnings = Math.round(totalGameVisits * 0.15) + 350;

  const handlePurchaseTier = (amount: number) => {
    sounds.playPurchase();
    confetti({ particleCount: 70, spread: 70 });
    onAddBloxbux(amount);
  };

  const handleClaim = () => {
    if (!canClaimDaily) return;
    sounds.playPurchase();
    confetti({ particleCount: 100, spread: 80 });
    onClaimDaily(250);
  };

  const handleDevExCashOut = () => {
    if (user.bloxbux < 1000) {
      setDevexSuccess('Necessário pelo menos 1.000 Robux para solicitar o DevEx.');
      return;
    }
    sounds.playVictory();
    confetti({ particleCount: 120, spread: 90 });
    setDevexSuccess('Solicitação DevEx aprovada! Transferência simulada para sua conta de desenvolvedor concluída.');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-in fade-in zoom-in-95 duration-150">
      <div className="bg-[#191b1d] border border-white/20 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <RobuxIcon size={22} color="#00e676" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Comprar Robux & Premium</h2>
              <p className="text-xs text-slate-400">Adquira Robux para itens, acessórios, passes de experiência e benefícios</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 text-slate-300 hover:text-white flex items-center justify-center font-bold cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Current Balance Card */}
        <div className="bg-[#111216] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Saldo Atual de Robux</span>
            <div className="flex items-center gap-2 mt-0.5">
              <RobuxIcon size={20} color="#00e676" />
              <span className="text-2xl font-black text-white font-mono">
                {user.bloxbux.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400">Robux</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                canClaimDaily 
                  ? 'bg-amber-500 text-black hover:bg-amber-400 font-black animate-pulse'
                  : 'bg-white/10 text-slate-400'
              }`}
            >
              <Gift className="w-3.5 h-3.5" />
              <span>{canClaimDaily ? 'Coletar 250' : 'Coletado'}</span>
            </button>
          </div>
        </div>

        {/* 2022 Tabs: Comprar Robux | Premium | DevEx */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('buy')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'buy' ? 'bg-white/15 text-white font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            Comprar Robux
          </button>
          <button
            onClick={() => setActiveTab('premium')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'premium' ? 'bg-white/15 text-white font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            <RobloxPremiumIcon size={14} />
            <span>Roblox Premium</span>
          </button>
          <button
            onClick={() => setActiveTab('devex')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'devex' ? 'bg-white/15 text-white font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            DevEx (Criadores)
          </button>
        </div>

        {/* Tab 1: Comprar Robux */}
        {activeTab === 'buy' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ROBUX_PACKAGES.map((pkg) => (
                <div
                  key={pkg.amount}
                  className={`p-4 rounded-2xl border transition-all relative flex items-center justify-between ${
                    pkg.popular
                      ? 'bg-gradient-to-r from-[#1e2330] to-[#141824] border-[#00a2ff]/60 shadow-lg shadow-blue-500/10'
                      : 'bg-[#111216] border-white/10 hover:border-white/25'
                  }`}
                >
                  {pkg.popular && (
                    <span className="absolute -top-2.5 right-4 bg-[#00a2ff] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow">
                      Mais Popular
                    </span>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                      <RobuxIcon size={24} color="#00e676" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1 font-black text-base text-white">
                        <span>{pkg.amount.toLocaleString()}</span>
                        <span className="text-xs text-slate-400 font-semibold">Robux</span>
                      </div>
                      <span className="text-[11px] text-emerald-400 font-semibold">{pkg.bonus}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handlePurchaseTier(pkg.amount)}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-slate-200 text-slate-900 font-black text-xs transition-transform active:scale-95 cursor-pointer shadow"
                  >
                    {pkg.price}
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 text-center">
              Ao comprar Robux, você aceita os Termos de Uso do Roblox. A compra é instantânea na sua conta.
            </p>
          </div>
        )}

        {/* Tab 2: Roblox Premium */}
        {activeTab === 'premium' && (
          <div className="p-5 rounded-2xl bg-[#111216] border border-amber-500/30 space-y-4">
            <div className="flex items-center gap-3">
              <RobloxPremiumIcon size={28} />
              <div>
                <h3 className="font-extrabold text-base text-white">Assinatura Roblox Premium</h3>
                <p className="text-xs text-slate-400">Desbloqueie benefícios VIP em todo o ecossistema</p>
              </div>
            </div>

            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>+1.000 Robux creditados a cada mês na sua conta</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Troca de itens colecionáveis e limitados no Mercado</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Ícone Premium exclusivo ao lado do seu nome</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>+10% de Robux a mais em todas as compras de pacotes</span>
              </li>
            </ul>

            <button
              onClick={() => handlePurchaseTier(1000)}
              className="w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black py-3 rounded-xl font-black text-xs transition-transform active:scale-95 cursor-pointer shadow-lg shadow-amber-500/20"
            >
              Assinar Roblox Premium - R$ 27,90 / mês
            </button>
          </div>
        )}

        {/* Tab 3: DevEx */}
        {activeTab === 'devex' && (
          <div className="space-y-4 text-xs text-slate-300">
            <div className="p-4 bg-[#111216] border border-white/10 rounded-2xl space-y-2">
              <h4 className="font-bold text-white text-sm">Roblox Developer Exchange (DevEx)</h4>
              <p className="text-slate-400 leading-relaxed">
                Desenvolvedores que criam experiências no Roblox Studio e acumulam Robux através de passes e compras podem converter seus ganhos virtuais em dinheiro real.
              </p>
              <div className="flex items-center justify-between pt-2 text-slate-200">
                <span>Ganhos Estimados das Experiências:</span>
                <strong className="text-emerald-400 font-mono text-sm">{estimatedEarnings} Robux</strong>
              </div>
            </div>

            {devexSuccess && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 font-bold">
                {devexSuccess}
              </div>
            )}

            <button
              onClick={handleDevExCashOut}
              className="w-full bg-[#00b06f] hover:bg-[#00945e] text-white py-3 rounded-xl font-black transition-colors cursor-pointer shadow-lg"
            >
              Solicitar Resgate DevEx (Mínimo 1.000 Robux)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
