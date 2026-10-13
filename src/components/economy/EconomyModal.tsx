import React, { useState } from 'react';
import { 
  Coins, 
  Gift, 
  TrendingUp, 
  CheckCircle2, 
  Crown, 
  Sparkles, 
  ArrowRight, 
  DollarSign,
  Calendar,
  Zap,
  CreditCard
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, GameMetadata } from '../../types';
import { sounds } from '../../services/soundEffects';

interface EconomyModalProps {
  user: UserProfile;
  userGames: GameMetadata[];
  isOpen: boolean;
  onClose: () => void;
  onAddBloxbux: (amount: number) => void;
  onClaimDaily: (amount: number) => void;
  canClaimDaily: boolean;
}

const BLOXBUX_TIERS = [
  { amount: 400, price: '$4.99', popular: false, bonus: 'Starter Pack', icon: '🪙' },
  { amount: 800, price: '$9.99', popular: false, bonus: '+50 Extra B$', icon: '💰' },
  { amount: 2000, price: '$19.99', popular: true, bonus: '+250 Extra B$', icon: '💎' },
  { amount: 10000, price: '$99.99', popular: false, bonus: '+2,000 Extra B$', icon: '👑' },
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
  const [activeTab, setActiveTab] = useState<'buy' | 'daily' | 'devex' | 'premium'>('buy');
  const [devexSuccess, setDevexSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalGameVisits = userGames.reduce((acc, g) => acc + (g.visits || 0), 0);
  const estimatedEarnings = Math.round(totalGameVisits * 0.15) + 350;

  const handlePurchaseTier = (amount: number) => {
    sounds.playPurchase();
    confetti({ particleCount: 60, spread: 60 });
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
      setDevexSuccess('Minimum 1,000 BloxBux required to process DevEx payout.');
      return;
    }
    sounds.playVictory();
    confetti({ particleCount: 120, spread: 90 });
    setDevexSuccess('DevEx Payout Request Approved! $50.00 USD simulated transfer completed to your creator account.');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#181a24] border border-[#2c3042] rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2b2f3f]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-lg border border-emerald-500/30">
              B$
            </div>
            <div>
              <h2 className="text-xl font-black text-white">BloxVerse Economy & Bank</h2>
              <p className="text-xs text-slate-400">Manage virtual currency, daily rewards, and DevEx payouts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#242735] text-slate-400 hover:text-white flex items-center justify-center font-bold"
          >
            ✕
          </button>
        </div>

        {/* Current Balance Banner */}
        <div className="bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold block">Current BloxBux Balance</span>
            <div className="text-3xl font-black text-emerald-300 font-mono flex items-center gap-2">
              <Coins className="w-7 h-7 text-emerald-400" />
              <span>{user.bloxbux.toLocaleString()} B$</span>
            </div>
          </div>
          {user.isPremium && (
            <span className="bg-gradient-to-r from-amber-500 to-yellow-300 text-black text-xs font-black px-2.5 py-1 rounded-lg">
              PREMIUM 10% BOOST
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-[#2b2f3f] pb-3 overflow-x-auto">
          {[
            { id: 'buy', label: 'Buy BloxBux', icon: <Coins className="w-4 h-4" /> },
            { id: 'daily', label: 'Daily Streak', icon: <Gift className="w-4 h-4" /> },
            { id: 'devex', label: 'DevEx Simulator', icon: <TrendingUp className="w-4 h-4" /> },
            { id: 'premium', label: 'Blox Premium', icon: <Crown className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { sounds.playClick(); setActiveTab(tab.id as any); }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#00a2ff] text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-[#20232e]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: BUY BLOXBUX PACKAGES */}
        {activeTab === 'buy' && (
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Choose Currency Package
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {BLOXBUX_TIERS.map(tier => (
                <div
                  key={tier.amount}
                  className={`bg-[#13141b] rounded-2xl p-4 border transition-all flex items-center justify-between gap-3 relative ${
                    tier.popular ? 'border-[#00a2ff] shadow-lg shadow-blue-500/10' : 'border-[#262936]'
                  }`}
                >
                  {tier.popular && (
                    <span className="absolute -top-2.5 right-4 bg-[#00a2ff] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow">
                      MOST POPULAR
                    </span>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{tier.icon}</span>
                    <div>
                      <div className="text-base font-black text-white font-mono flex items-center gap-1">
                        <span>{tier.amount.toLocaleString()}</span>
                        <span className="text-emerald-400 text-xs">B$</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold block">{tier.bonus}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handlePurchaseTier(tier.amount)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    {tier.price}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: DAILY LOGIN REWARD */}
        {activeTab === 'daily' && (
          <div className="space-y-5 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30 text-3xl">
              🎁
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Daily Login Bonus Streak</h3>
              <p className="text-xs text-slate-400">Log in every 24 hours to multiply your free BloxBux stipend!</p>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {[
                { day: 'D1', reward: '50', done: true },
                { day: 'D2', reward: '100', done: true },
                { day: 'D3', reward: '150', done: true },
                { day: 'D4', reward: '250', current: true },
                { day: 'D5', reward: '350', done: false },
                { day: 'D6', reward: '500', done: false },
                { day: 'D7', reward: '1000', done: false, mega: true }
              ].map(d => (
                <div
                  key={d.day}
                  className={`p-2.5 rounded-xl border text-center space-y-1 ${
                    d.current
                      ? 'bg-[#00a2ff]/20 border-[#00a2ff] text-white shadow-lg'
                      : d.done
                      ? 'bg-[#1e2230] border-emerald-500/40 text-slate-300'
                      : 'bg-[#121319] border-[#252836] text-slate-500'
                  }`}
                >
                  <span className="text-[10px] font-bold block">{d.day}</span>
                  <span className="text-xs font-black font-mono block">+{d.reward}</span>
                  {d.done && <CheckCircle2 className="w-3 h-3 text-emerald-400 mx-auto" />}
                </div>
              ))}
            </div>

            <button
              disabled={!canClaimDaily}
              onClick={handleClaim}
              className={`w-full py-3.5 rounded-2xl font-black text-sm transition-all cursor-pointer ${
                canClaimDaily
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-900 shadow-xl shadow-amber-500/25 animate-pulse'
                  : 'bg-[#222533] text-slate-500 cursor-not-allowed'
              }`}
            >
              {canClaimDaily ? 'CLAIM +250 BLOXBUX TODAY' : 'Already Claimed for Today (Resets at midnight)'}
            </button>
          </div>
        )}

        {/* TAB 3: DEVEX (DEVELOPER EXCHANGE) SIMULATOR */}
        {activeTab === 'devex' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Developer Exchange (DevEx)
              </h3>
              <p className="text-xs text-slate-400">
                Turn your published experiences into real creator income. Earn BloxBux from game visits and passes.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#121319] border border-[#252836] p-3 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Visits</span>
                <span className="text-base font-black text-white font-mono">{totalGameVisits.toLocaleString()}</span>
              </div>
              <div className="bg-[#121319] border border-[#252836] p-3 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Pass Sales</span>
                <span className="text-base font-black text-white font-mono">18</span>
              </div>
              <div className="bg-[#121319] border border-[#252836] p-3 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Estimated Dev Share</span>
                <span className="text-base font-black text-emerald-400 font-mono">+{estimatedEarnings} B$</span>
              </div>
            </div>

            {devexSuccess && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 font-medium">
                {devexSuccess}
              </div>
            )}

            <button
              onClick={handleDevExCashOut}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-3 rounded-xl shadow-lg shadow-emerald-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <DollarSign className="w-4 h-4" />
              Request DevEx Cash Out (1,000 B$ → $50 USD)
            </button>
          </div>
        )}

        {/* TAB 4: BLOX PREMIUM */}
        {activeTab === 'premium' && (
          <div className="bg-gradient-to-r from-amber-950/40 to-slate-900 border border-amber-500/30 rounded-2xl p-6 text-center space-y-4">
            <Crown className="w-12 h-12 text-amber-400 mx-auto" />
            <h3 className="text-xl font-black text-white">BloxVerse Premium Membership</h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              Get an exclusive monthly allowance of 2,200 BloxBux, access to the Limited trading economy, and 10% more B$ on all purchases.
            </p>
            <div className="bg-[#121319] p-3 rounded-xl text-xs text-amber-400 font-bold border border-amber-500/20">
              Active Status: Blox Premium Tier 2 ($19.99/mo)
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
