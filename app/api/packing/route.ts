import { jsonError, jsonSuccess } from "@/lib/api-response";
import { parseJSON, withErrorHandler } from "@/lib/error-handler";
// 1. IMPORT the missing service function (adjust the path if your service folder is located elsewhere)
import { validateSpatialPacking } from "@/services/volumetricService";

// Define an interface for the incoming request structure
interface PackingRequestBody {
  items: Array<{
    length: number;
    width: number;
    height: number;
    weight: number;
  }>;
  box: {
    length: number;
    width: number;
    height: number;
    maxWeight?: number;
    maxWeightCapacity?: number;
  };
}

export const POST = withErrorHandler(async (request: Request) => {
  const body = (await parseJSON(request, 1024 * 20)) as PackingRequestBody;
  const { items, box } = body;

  if (!Array.isArray(items) || items.length === 0 || typeof box !== "object") {
    return jsonError("Bad Request: Missing or invalid packing payload.", 400);
  }

  const normalizedBox = {
    ...box,
    maxWeight: box.maxWeight ?? box.maxWeightCapacity,
  };

  const packingAnalysis = validateSpatialPacking(items, normalizedBox);
  return jsonSuccess({ packingAnalysis });
});
