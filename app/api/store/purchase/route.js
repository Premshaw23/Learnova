import { connectDb } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { STORE_ITEMS } from "@/lib/storeItems";
import { withLock } from "@/lib/lockManager";

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(async (req) => {
  const decodedToken = await requireAuth(req, ["student"]);
  const userId = decodedToken.uid;

  const body = await req.json();
  const { itemId } = body;

  if (!itemId) {
    return jsonError("Item ID is required.", 400);
  }

  const storeItem = STORE_ITEMS.find((item) => item.id === itemId);
  if (!storeItem) {
    return jsonError("Item not found.", 404);
  }

  const db = await connectDb();

  return withLock(`lock:store_purchase:${userId}`, async () => {
    const user = await db.collection("users").findOne({ firebaseUid: userId });

    if (!user) {
      return jsonError("User not found.", 404);
    }

    const currentXp = user.totalXp || 0;
    const unlockedItems = user.unlockedStoreItems || [];

    if (unlockedItems.includes(itemId)) {
      return jsonError("You already own this item.", 400);
    }

    if (currentXp < storeItem.price) {
      return jsonError("Not enough XP to purchase this item.", 400);
    }

    // Deduct XP and add to unlocked items
    await db.collection("users").updateOne(
      { firebaseUid: userId },
      {
        $set: { totalXp: currentXp - storeItem.price },
        $push: { unlockedStoreItems: itemId },
      }
    );

    // Also log the purchase in a transactions collection for analytics
    await db.collection("store_transactions").insertOne({
      userId,
      itemId,
      price: storeItem.price,
      purchasedAt: new Date(),
    });

    return jsonSuccess({
      message: "Purchase successful!",
      remainingXp: currentXp - storeItem.price,
      unlockedItem: storeItem,
    });
  });
});
