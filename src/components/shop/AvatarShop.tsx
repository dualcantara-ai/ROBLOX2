import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Crown, 
  Sparkles, 
  Coins, 
  Filter, 
  Check, 
  AlertCircle,
  Clock,
  ArrowUpDown
} from 'lucide-react';
import { ShopItem } from '../../types';
import { sounds } from '../../services/soundEffects';

interface AvatarShopProps {
  items: ShopItem[];
  userBloxbux: number;
  userInventory: string[];
  onPurchaseItem: (item: ShopItem) => void;
  onOpenEconomy: () => void;
}

export const AvatarShop: React.FC<AvatarShopProps> = ({
  items,
  userBloxbux,
  userInventory,
  onPurchaseItem,
  onOpenEconomy
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItemForPurchase, setSelectedItemForPurchase] = useState<ShopItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filteredItems = items.filter(item => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'limited') return item.isLimited;
    return item.category === selectedCategory;
  });

  const handleBuyClick = (item: ShopItem) => {
    sounds.playClick();
    setErrorMsg(null);
    setSelectedItemForPurchase(item);
  };

  const handleConfirmPurchase = () => {
    if (!selectedItemForPurchase) return;
    if (userBloxbux < selectedItemForPurchase.price) {
      setErrorMsg('Insufficient BloxBux balance! Top up in the currency store.');
      return;
    }

    sounds.playPurchase();
    onPurchaseItem(selectedItemForPurchase);
    setSelectedItemForPurchase(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 select-none">
      {/* Shop Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-950/60 via-purple-950/40 to-slate-900 border border-[#2d3142] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="bg-amber-500/20 text-amber-400 font-extrabold text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-lg border border-amber-500/30 flex items-center gap-1">
              <Crown className="w-3.5 h-3.5" />
              Official Marketplace
            </span>
            <span className="text-xs text-slate-400">Over 50+ Custom Accessories</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Avatar Shop & Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Upgrade your Bloxian drip! Discover rare mythical headpieces, glowing animated gears, and limited collectables.
          </p>
        </div>

        {/* User Balance Card in shop */}
        <div className="bg-[#14161e] border border-[#2b2f3f] rounded-2xl p-4 flex items-center gap-4 shrink-0 shadow-lg">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Your Balance</span>
            <div className="flex items-center gap-1.5 text-emerald-400 font-black text-xl font-mono">
              <Coins className="w-5 h-5" />
              <span>{userBloxbux.toLocaleString()} B$</span>
            </div>
          </div>
          <button
            onClick={() => { sounds.playClick(); onOpenEconomy(); }}
            className="bg-[#00a2ff] hover:bg-[#0090e0] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer"
          >
            Get More
          </button>
        </div>
      </div>

      {/* Category Navigation Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: 'All Items' },
          { id: 'limited', label: '💎 Limiteds' },
          { id: 'hat', label: '👑 Hats' },
          { id: 'face', label: '😄 Faces' },
          { id: 'gear', label: '⚔️ Gears' },
          { id: 'shirt', label: '👔 Shirts' },
          { id: 'pants', label: '👖 Pants' }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => { sounds.playClick(); setSelectedCategory(cat.id); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-[#00a2ff] text-white shadow-md shadow-blue-500/25'
                : 'bg-[#181a24] text-slate-400 hover:text-white hover:bg-[#20232e] border border-[#272b3a]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Catalog Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredItems.map(item => {
          const isOwned = userInventory.includes(item.id);

          return (
            <div
              key={item.id}
              onClick={() => handleBuyClick(item)}
              className="bg-[#181a24] hover:bg-[#1f2230] rounded-2xl border border-[#272a39] hover:border-[#00a2ff]/60 p-4 flex flex-col justify-between transition-all duration-300 cursor-pointer group shadow-lg"
            >
              <div>
                {/* Item Thumbnail */}
                <div className="aspect-square rounded-xl bg-[#111218] border border-white/5 flex items-center justify-center text-5xl mb-3 relative overflow-hidden group-hover:scale-105 transition-transform">
                  <span>{item.thumbnail}</span>
                  {item.isLimited && (
                    <div className="absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-yellow-300 text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                      LIMITED
                    </div>
                  )}
                  {isOwned && (
                    <div className="absolute bottom-2 right-2 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" /> OWNED
                    </div>
                  )}
                </div>

                {/* Name & Rarity */}
                <h3 className="font-extrabold text-xs sm:text-sm text-white group-hover:text-[#00a2ff] transition-colors line-clamp-1">
                  {item.name}
                </h3>
                <span className={`text-[10px] font-bold uppercase tracking-wider block mt-0.5 ${
                  item.rarity === 'Legendary' ? 'text-amber-400' :
                  item.rarity === 'Epic' ? 'text-purple-400' :
                  item.rarity === 'Rare' ? 'text-blue-400' : 'text-slate-400'
                }`}>
                  {item.rarity} {item.category}
                </span>
              </div>

              {/* Price & Action */}
              <div className="mt-4 pt-2 border-t border-[#252837] flex items-center justify-between">
                <div className="flex items-center gap-1 text-emerald-400 font-extrabold text-xs font-mono">
                  <span>B$</span>
                  <span>{item.price.toLocaleString()}</span>
                </div>

                <button
                  disabled={isOwned}
                  className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg transition-all ${
                    isOwned
                      ? 'bg-slate-800 text-slate-500 cursor-default'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white group-hover:scale-105 shadow-sm'
                  }`}
                >
                  {isOwned ? 'Owned' : 'Buy'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Purchase Confirmation Modal */}
      {selectedItemForPurchase && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181a24] border border-[#2b2f3f] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#00a2ff] uppercase tracking-wider">
                  Item Inspection
                </span>
                <h3 className="text-xl font-black text-white">{selectedItemForPurchase.name}</h3>
              </div>
              <button
                onClick={() => setSelectedItemForPurchase(null)}
                className="w-8 h-8 rounded-full bg-[#242735] text-slate-400 hover:text-white flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="aspect-square max-w-[200px] mx-auto rounded-2xl bg-[#111218] border border-white/5 flex items-center justify-center text-7xl shadow-inner">
              {selectedItemForPurchase.thumbnail}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-[#121319] p-3.5 rounded-xl border border-[#252836]">
              {selectedItemForPurchase.description}
            </p>

            {selectedItemForPurchase.isLimited && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl flex items-center justify-between text-xs">
                <span className="text-amber-400 font-bold">Limited Edition Stock:</span>
                <span className="font-mono text-white font-black">
                  {selectedItemForPurchase.remainingStock} / {selectedItemForPurchase.originalStock} remaining
                </span>
              </div>
            )}

            {errorMsg && (
              <div className="bg-rose-950/40 border border-rose-800/60 p-3 rounded-xl flex items-center gap-2 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Price Breakdown */}
            <div className="flex items-center justify-between pt-2 border-t border-[#252837] text-sm">
              <span className="text-slate-400">Total Price:</span>
              <div className="flex items-center gap-1.5 font-black text-emerald-400 font-mono text-base">
                <span>B$</span>
                <span>{selectedItemForPurchase.price.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedItemForPurchase(null)}
                className="flex-1 bg-[#252836] hover:bg-[#2c3040] text-slate-300 hover:text-white py-3 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPurchase}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white py-3 rounded-xl text-xs font-black shadow-lg shadow-emerald-500/25 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ShoppingBag className="w-4 h-4" />
                Confirm Purchase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
