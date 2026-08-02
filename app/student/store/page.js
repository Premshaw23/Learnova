"use client";

import React, { useState, useEffect } from "react";
import { STORE_ITEMS } from "@/lib/storeItems";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

export default function StorePage() {
  const { userProfile, token, refreshProfile } = useAuth();
  const [unlockedItems, setUnlockedItems] = useState([]);
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    if (userProfile?.unlockedStoreItems) {
      setUnlockedItems(userProfile.unlockedStoreItems);
    }
  }, [userProfile]);

  const handlePurchase = async (item) => {
    if (userProfile?.totalXp < item.price) {
      toast.error("Not enough XP!");
      return;
    }

    if (
      confirm(`Are you sure you want to buy ${item.name} for ${item.price} XP?`)
    ) {
      setIsPurchasing(true);
      try {
        const res = await fetch("/api/store/purchase", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ itemId: item.id }),
        });

        const data = await res.json();
        if (data.success) {
          toast.success(`Successfully purchased ${item.name}!`);
          setUnlockedItems([...unlockedItems, item.id]);
          // Re-fetch profile to update XP in context
          if (refreshProfile) await refreshProfile();
        } else {
          toast.error(data.error || "Purchase failed.");
        }
      } catch (err) {
        toast.error("Network error during purchase.");
      } finally {
        setIsPurchasing(false);
      }
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gamification Store</h1>
          <p className="text-muted-foreground">
            Spend your hard-earned XP on cosmetic profile upgrades!
          </p>
        </div>
        <div className="bg-primary/10 text-primary px-6 py-3 rounded-full font-bold text-xl border border-primary/20 shadow-sm flex items-center gap-2">
          <span>{userProfile?.totalXp || 0} XP</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {STORE_ITEMS.map((item) => {
          const isOwned = unlockedItems.includes(item.id);
          const canAfford = (userProfile?.totalXp || 0) >= item.price;

          return (
            <div
              key={item.id}
              className="bg-card border border-border rounded-xl overflow-hidden flex flex-col hover:shadow-md transition-shadow"
            >
              <div className="h-40 bg-muted/50 flex items-center justify-center p-4 border-b border-border">
                {/* Fallback visual if image fails/missing */}
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-2">
                    <span className="text-2xl">✨</span>
                  </div>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg">{item.name}</h3>
                  <span className="bg-secondary/10 text-secondary text-xs px-2 py-1 rounded font-semibold uppercase tracking-wider">
                    {item.type.replace("_", " ")}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-6 flex-1">
                  {item.description}
                </p>

                {isOwned ? (
                  <button
                    disabled
                    className="w-full py-2 bg-muted text-muted-foreground rounded-lg font-medium border border-border"
                  >
                    Owned
                  </button>
                ) : (
                  <button
                    onClick={() => handlePurchase(item)}
                    disabled={!canAfford || isPurchasing}
                    className={`w-full py-2 rounded-lg font-bold transition-colors flex justify-center items-center gap-2 ${
                      canAfford
                        ? "bg-primary text-primary-foreground hover:opacity-90 shadow-sm"
                        : "bg-muted text-muted-foreground cursor-not-allowed opacity-70 border border-border"
                    }`}
                  >
                    Buy for {item.price} XP
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
