"use client";

import React, { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";

export default function StudyDeck() {
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [showOrigin, setShowOrigin] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCards();
  }, []);

  async function fetchCards() {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/flashcards`);
      if (!res.ok) throw new Error("Failed to load flashcards");
      const data = await res.json();
      setCards(data || []);
      setIndex(0);
      setShowBack(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function nextCard() {
    setShowBack(false);
    setIndex((i) => (cards.length ? (i + 1) % cards.length : 0));
  }

  if (loading) return <div>Loading flashcards…</div>;
  if (!cards.length) return <div>No flashcards found. Create one below.</div>;

  const card = cards[index];

  return (
    <div className="p-4 max-w-2xl">
      <div className="border rounded-xl p-6 mb-4 bg-white/5">
        <div className="text-sm text-zinc-400 mb-1">
          Card {index + 1} / {cards.length}
        </div>
        <h3 className="text-xl font-semibold mb-3">{card.front}</h3>
        {showBack ? (
          <p className="text-zinc-200">{card.back}</p>
        ) : (
          <button onClick={() => setShowBack(true)} className="btn">
            Show answer
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={nextCard}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl"
        >
          Next
        </button>
        <button
          onClick={() => {
            setShowBack(true);
          }}
          className="px-4 py-2 bg-zinc-700 text-white rounded-xl"
        >
          Reveal
        </button>
        <button
          onClick={() => setShowOrigin((prev) => !prev)}
          className="px-4 py-2 bg-slate-700 text-white rounded-xl"
        >
          View Origin
        </button>
      </div>

      {showOrigin && (
        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
          <div className="font-semibold text-zinc-100 mb-2">Origin</div>
          {card.origin ? (
            <p className="whitespace-pre-line">{card.origin}</p>
          ) : (
            <p className="text-zinc-500">
              Origin data is not available for this flashcard.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
