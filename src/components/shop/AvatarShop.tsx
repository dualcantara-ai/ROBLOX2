import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Crown, 
  Sparkles, 
  Filter, 
  Check, 
  AlertCircle,
  Clock,
  ArrowUpDown,
  Search,
  Eye,
  Tag,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { ShopItem } from '../../types';
import { sounds } from '../../services/soundEffects';
import { RobuxIcon, RobloxVerifiedBadge } from '../common/RobloxIcons';

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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItemForPurchase, setSelectedItemForPurchase] = useState<ShopItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isTryOnActive, setIsTryOnActive] = useState<boolean>(false);

  const categories = [
    { id: 'all', label: 'Destaques' },
    { id: 'limited', label: 'Colecionáveis (Limited)' },
    { id: 'hat', label: 'Chapéus' },
    { id: 'face', label: 'Rostos' },
    { id: 'gear', label: 'Equipamentos' },
    { id: 'shirt', label: 'Camisas' },
    { id: 'pants', label: 'Calças' }
  ];

  const filteredItems = items.filter(item => {
    const matchesCategory = 
      selectedCategory === 'all' ? true :
      selectedCategory === 'limited' ? item.isLimited :
      item.category === selectedCategory;

    const matchesSearch = searchQuery.trim() === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const handleBuyClick = (item: ShopItem) => {
    sounds.playClick();
    setErrorMsg(null);
    setIsTryOnActive(false);
    setSelectedItemForPurchase(item);
  };

  const handleConfirmPurchase = () => {
    if (!selectedItemForPurchase) return;
    if (userBloxbux < selectedItemForPurchase.price) {
      setErrorMsg('Saldo insuficiente de Robux! Adquira mais Robux na loja oficial.');
      return;
    }

    sounds.playPurchase();
    onPurchaseItem(selectedItemForPurchase);
    setSelectedItemForPurchase(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 select-none bg-[#111216] min-h-screen text-white">
      {/* 2022 Roblox Loja do Avatar Header */}
      <div className="bg-[#191b1d] border border-[#232527] rounded-xl p-6 sm:p-7 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="bg-[#00e676]/10 text-[#00e676] font-bold text-[11px] uppercase tracking-wider px-2.5 py-1 rounded border border-[#00e676]/30 flex items-center gap-1.5">
              <RobuxIcon className="w-3.5 h-3.5" color="#00e676" />
              Catálogo Oficial Roblox 2022
            </span>
            <span className="text-xs text-[#999999]">• Mais de 50+ Acessórios UGC</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Loja do Avatar
          </h1>
          <p className="text-xs sm:text-sm text-[#bbbbbb] max-w-xl">
            Personalize seu avatar com os itens oficiais da comunidade Roblox. Chapéus lendários, rostos clássicos, equipamentos interativos e itens colecionáveis limitados.
          </p>
        </div>

        {/* User Robux Balance Card */}
        <div className="bg-[#111216] border border-[#232527] rounded-xl p-4 flex items-center gap-5 shrink-0 shadow-lg">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#888888] tracking-wider block">Seu Saldo</span>
            <div className="flex items-center gap-1.5 text-white font-black text-2xl font-mono mt-0.5">
              <RobuxIcon className="w-5 h-5 text-[#00e676]" color="#00e676" />
              <span>{userBloxbux.toLocaleString()}</span>
            </div>
          </div>
          <button
            onClick={() => { sounds.playClick(); onOpenEconomy(); }}
            className="bg-[#00b06f] hover:bg-[#00c87d] text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-all shadow-md shadow-emerald-900/30 cursor-pointer flex items-center gap-1.5"
          >
            <RobuxIcon className="w-3.5 h-3.5 text-white" color="#ffffff" />
            Comprar Robux
          </button>
        </div>
      </div>

      {/* Search & Categories Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Category Navigation Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 w-full sm:w-auto scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => { sounds.playClick(); setSelectedCategory(cat.id); }}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-white text-black font-black shadow-md'
                  : 'bg-[#191b1d] text-[#aaaaaa] hover:text-white hover:bg-[#232527] border border-[#232527]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72 shrink-0">
          <Search className="w-4 h-4 text-[#777777] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar no catálogo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#191b1d] border border-[#232527] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-[#777777] focus:outline-none focus:border-[#00a2ff]"
          />
        </div>
      </div>

      {/* Catalog Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filteredItems.map(item => {
          const isOwned = userInventory.includes(item.id);

          return (
            <div
              key={item.id}
              onClick={() => handleBuyClick(item)}
              className="bg-[#191b1d] hover:bg-[#232527] rounded-xl border border-[#232527] hover:border-white/30 p-3.5 flex flex-col justify-between transition-all duration-200 cursor-pointer group shadow-md"
            >
              <div>
                {/* Item Thumbnail */}
                <div className="aspect-square rounded-lg bg-[#111216] border border-[#232527] flex items-center justify-center text-5xl mb-3 relative overflow-hidden group-hover:scale-105 transition-transform">
                  <span>{item.thumbnail}</span>
                  {item.isLimited && (
                    <div className="absolute top-1.5 left-1.5 bg-[#00a2ff] text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow tracking-wider uppercase">
                      LIMITED
                    </div>
                  )}
                  {isOwned && (
                    <div className="absolute bottom-1.5 right-1.5 bg-[#00b06f] text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" /> OBTIDO
                    </div>
                  )}
                </div>

                {/* Name & Creator */}
                <h3 className="font-bold text-xs sm:text-sm text-white group-hover:text-[#00a2ff] transition-colors line-clamp-1">
                  {item.name}
                </h3>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[11px] text-[#888888] truncate">De Roblox</span>
                  <RobloxVerifiedBadge size={12} />
                </div>
              </div>

              {/* Price & Action */}
              <div className="mt-3 pt-2.5 border-t border-[#232527] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-white font-extrabold text-xs font-mono">
                  <RobuxIcon className="w-3.5 h-3.5 text-[#00e676]" color="#00e676" />
                  <span>{item.price === 0 ? 'Grátis' : item.price.toLocaleString()}</span>
                </div>

                <button
                  disabled={isOwned}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded transition-all ${
                    isOwned
                      ? 'bg-[#232527] text-[#666666] cursor-default'
                      : 'bg-[#00b06f] hover:bg-[#00c87d] text-white group-hover:scale-105 shadow-sm'
                  }`}
                >
                  {isOwned ? 'Obtido' : 'Comprar'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-16 text-[#777777] bg-[#191b1d] rounded-xl border border-[#232527]">
          <p className="text-sm font-semibold">Nenhum item encontrado nesta categoria ou pesquisa.</p>
        </div>
      )}

      {/* 2022 Roblox Item Details / Purchase Confirmation Modal */}
      {selectedItemForPurchase && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#191b1d] border border-[#2d3035] rounded-2xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in duration-150">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#232527] pb-3">
              <div>
                <span className="text-[11px] font-bold text-[#00a2ff] uppercase tracking-wider">
                  Detalhes do Item
                </span>
                <h3 className="text-xl font-black text-white mt-0.5">{selectedItemForPurchase.name}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs text-[#888888]">Criador:</span>
                  <span className="text-xs text-white font-bold">Roblox</span>
                  <RobloxVerifiedBadge size={13} />
                </div>
              </div>
              <button
                onClick={() => setSelectedItemForPurchase(null)}
                className="w-8 h-8 rounded-lg bg-[#232527] hover:bg-[#2d3035] text-[#888888] hover:text-white flex items-center justify-center font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Thumbnail preview */}
            <div className="aspect-square max-w-[200px] mx-auto rounded-xl bg-[#111216] border border-[#232527] flex items-center justify-center text-7xl shadow-inner relative">
              <span>{selectedItemForPurchase.thumbnail}</span>
              {selectedItemForPurchase.isLimited && (
                <div className="absolute top-2 left-2 bg-[#00a2ff] text-white text-[10px] font-black px-2 py-0.5 rounded shadow uppercase">
                  LIMITED
                </div>
              )}
            </div>

            {/* Item description */}
            <p className="text-xs text-[#bbbbbb] leading-relaxed bg-[#111216] p-3.5 rounded-xl border border-[#232527]">
              {selectedItemForPurchase.description}
            </p>

            {selectedItemForPurchase.isLimited && (
              <div className="bg-[#00a2ff]/10 border border-[#00a2ff]/30 p-3 rounded-xl flex items-center justify-between text-xs">
                <span className="text-[#00a2ff] font-bold">Estoque Limitado:</span>
                <span className="font-mono text-white font-black">
                  {selectedItemForPurchase.remainingStock} / {selectedItemForPurchase.originalStock} restantes
                </span>
              </div>
            )}

            {errorMsg && (
              <div className="bg-rose-950/40 border border-rose-800/60 p-3 rounded-xl flex items-center gap-2 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Authentic 2022 Roblox Purchase Prompt Breakdown */}
            <div className="bg-[#111216] border border-[#232527] rounded-xl p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#888888]">Preço do Item:</span>
                <div className="flex items-center gap-1.5 font-bold text-white font-mono">
                  <RobuxIcon className="w-4 h-4 text-[#00e676]" color="#00e676" />
                  <span>R$ {selectedItemForPurchase.price.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#888888]">Seu Saldo Atual:</span>
                <div className="flex items-center gap-1.5 font-bold text-[#aaaaaa] font-mono">
                  <RobuxIcon className="w-4 h-4 text-[#00e676]" color="#00e676" />
                  <span>R$ {userBloxbux.toLocaleString()}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-[#232527] flex items-center justify-between">
                <span className="text-[#888888]">Saldo após esta transação:</span>
                <div className="flex items-center gap-1.5 font-black text-white font-mono">
                  <RobuxIcon className="w-4 h-4 text-[#00e676]" color="#00e676" />
                  <span className={userBloxbux - selectedItemForPurchase.price < 0 ? 'text-rose-400' : 'text-[#00e676]'}>
                    R$ {(userBloxbux - selectedItemForPurchase.price).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setSelectedItemForPurchase(null)}
                className="flex-1 bg-[#232527] hover:bg-[#2d3035] text-white py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmPurchase}
                className="flex-1 bg-[#00b06f] hover:bg-[#00c87d] text-white py-3 rounded-xl text-xs font-black shadow-lg shadow-emerald-900/30 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                Comprar Agora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

