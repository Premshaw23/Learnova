"use client";
import React, { useState } from "react";
import { Store, UserCircle, Star, Sparkles, Check, Lock } from "lucide-react";
import toast from "react-hot-toast";

const ITEMS = [
  { id: 1, name: "Neon Glasses", type: "accessory", cost: 500, emoji: "👓", rarity: "common" },
  { id: 2, name: "Golden Crown", type: "headwear", cost: 2500, emoji: "👑", rarity: "legendary" },
  { id: 3, name: "Ninja Mask", type: "accessory", cost: 800, emoji: "🥷", rarity: "rare" },
  { id: 4, name: "Astronaut Helmet", type: "headwear", cost: 1500, emoji: "🧑‍🚀", rarity: "epic" },
];

export default function AvatarShop({ userXp = 3200 }) {
  const [inventory, setInventory] = useState([]);
  const [equipped, setEquipped] = useState(null);

  const handlePurchase = (item) => {
    if (userXp < item.cost) {
      return toast.error("Not enough XP to purchase this item!");
    }
    setInventory([...inventory, item.id]);
    toast.success(`Successfully purchased ${item.name}!`, { icon: item.emoji });
  };

  const toggleEquip = (item) => {
    if (equipped === item.id) {
      setEquipped(null);
    } else {
      setEquipped(item.id);
    }
  };

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 h-full flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
      
      <div className="flex justify-between items-center mb-6 relative z-10">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Store className="w-5 h-5 text-amber-400" />
          Avatar Shop
        </h2>
        <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-400 font-bold rounded-xl border border-amber-500/30">
          <Star className="w-4 h-4 fill-current" />
          {userXp.toLocaleString()} XP
        </div>
      </div>

      <div className="flex flex-col items-center mb-8 relative z-10">
        <div className="relative w-24 h-24 bg-zinc-800 rounded-full border-4 border-zinc-700 flex items-center justify-center text-4xl shadow-xl">
          <UserCircle className="w-16 h-16 text-zinc-500" />
          {equipped && (
            <div className="absolute -top-3 -right-3 text-3xl animate-bounce">
              {ITEMS.find(i => i.id === equipped)?.emoji}
            </div>
          )}
        </div>
        <p className="mt-3 text-sm text-zinc-400 font-medium tracking-wide uppercase">Your Avatar</p>
      </div>

      <div className="grid grid-cols-2 gap-3 relative z-10 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {ITEMS.map((item) => {
          const isOwned = inventory.includes(item.id);
          const isEquipped = equipped === item.id;
          
          return (
            <div 
              key={item.id} 
              className={`p-3 rounded-2xl border transition-all flex flex-col items-center text-center ${
                isEquipped 
                  ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                  : isOwned
                    ? 'bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800'
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="text-3xl mb-2">{item.emoji}</div>
              <h3 className="text-xs font-bold text-zinc-200 mb-1 leading-tight">{item.name}</h3>
              
              {!isOwned ? (
                <button 
                  onClick={() => handlePurchase(item)}
                  className="mt-auto w-full py-1.5 bg-zinc-800 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 text-xs font-bold rounded-lg border border-zinc-700 hover:border-amber-500/50 transition-colors flex items-center justify-center gap-1"
                >
                  <Lock className="w-3 h-3" /> {item.cost} XP
                </button>
              ) : (
                <button 
                  onClick={() => toggleEquip(item)}
                  className={`mt-auto w-full py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${
                    isEquipped
                      ? 'bg-amber-500 text-zinc-900 shadow-md'
                      : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                  }`}
                >
                  {isEquipped ? <><Check className="w-3 h-3" /> Equipped</> : 'Equip'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  );
}
