import { jsonSuccess } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  // Mock data for Weekly Leagues Leaderboard
  const mockLeaderboard = {
    gold: [
      { id: '1', name: 'Alex Johnson', xp: 12500, avatar: '🏆' },
      { id: '2', name: 'Maria Garcia', xp: 11200, avatar: '🌟' },
      { id: '3', name: 'James Smith', xp: 10850, avatar: '🔥' },
    ],
    silver: [
      { id: '4', name: 'David Lee', xp: 8400, avatar: '🚀' },
      { id: '5', name: 'Sarah Connor', xp: 8100, avatar: '⚡' },
      { id: '6', name: 'Michael Chang', xp: 7900, avatar: '🧠' },
    ],
    bronze: [
      { id: '7', name: 'Emma Wilson', xp: 5200, avatar: '📚' },
      { id: '8', name: 'Lucas Brown', xp: 4800, avatar: '✏️' },
      { id: '9', name: 'Olivia Taylor', xp: 4100, avatar: '🎯' },
    ]
  };

  return jsonSuccess(mockLeaderboard);
}
