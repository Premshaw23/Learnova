export type PackingItem = {
  length: number;
  width: number;
  height: number;
  weight: number;
  name?: string;
};

export type PackingBox = {
  length: number;
  width: number;
  height: number;
  maxWeight?: number;
};

export type PackingAnalysis = {
  totalItemVolume: number;
  boxVolume: number;
  fillPercentage: number;
  totalWeight: number;
  status: "Optimal Fit" | "Volumetric Overflow";
  fitErrors: string[];
};

const safeNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return 0;
};

const roundOneDecimal = (value: number): number => Math.round(value * 10) / 10;

export function validateSpatialPacking(
  items: PackingItem[],
  box: PackingBox,
): PackingAnalysis {
  const totalItemVolume = items.reduce((sum, item) => {
    const itemVolume = safeNumber(item.length) * safeNumber(item.width) * safeNumber(item.height);
    return sum + Math.max(0, itemVolume);
  }, 0);

  const totalWeight = items.reduce((sum, item) => sum + Math.max(0, safeNumber(item.weight)), 0);
  const boxVolume = Math.max(0, safeNumber(box.length) * safeNumber(box.width) * safeNumber(box.height));
  const rawFill = boxVolume > 0 ? (totalItemVolume / boxVolume) * 100 : 0;
  const fillPercentage = roundOneDecimal(rawFill);

  const fitErrors: string[] = [];

  if (boxVolume <= 0) {
    fitErrors.push("Invalid box dimensions.");
  }

  if (box.maxWeight !== undefined && totalWeight > box.maxWeight) {
    fitErrors.push("Total item weight exceeds box weight capacity.");
  }

  items.forEach((item, index) => {
    const length = safeNumber(item.length);
    const width = safeNumber(item.width);
    const height = safeNumber(item.height);

    if (length <= 0 || width <= 0 || height <= 0) {
      fitErrors.push(`Item ${index + 1} has invalid dimensions.`);
      return;
    }

    if (length > box.length || width > box.width || height > box.height) {
      fitErrors.push(`Item ${index + 1} does not physically fit inside the box.`);
    }
  });

  const status = fitErrors.length === 0 && fillPercentage <= 100 ? "Optimal Fit" : "Volumetric Overflow";

  return {
    totalItemVolume: roundOneDecimal(totalItemVolume),
    boxVolume: roundOneDecimal(boxVolume),
    fillPercentage,
    totalWeight: roundOneDecimal(totalWeight),
    status,
    fitErrors,
  };
}
