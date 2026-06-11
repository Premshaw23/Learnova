"use client";
import React, { useState } from "react";

export default function VolumetricPlanner() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

  // Standard box constraints (e.g., 30x30x30 cm, max 20 kg limit)
  const STANDARD_BOX = { length: 30, width: 30, height: 30, maxWeight: 20 };
  const BOX_VOLUME =
    STANDARD_BOX.length * STANDARD_BOX.width * STANDARD_BOX.height;
  const EFFECTIVE_VOLUME_CAPACITY = BOX_VOLUME * 0.8; // 80% realistic packing threshold

  // Calculate cumulative totals
  const totalVolume = items.reduce(
    (sum, item) => sum + item.l * item.w * item.h,
    0
  );
  const totalWeight = items.reduce((sum, item) => sum + item.wg, 0);
  const percentageUsed = (totalVolume / BOX_VOLUME) * 100;

  // Determine packing status
  let status = "Optimal Fit";
  let statusReason = "All items fit cleanly within standard box limits.";
  let isOverflow = false;

  if (totalWeight > STANDARD_BOX.maxWeight) {
    status = "Volumetric Overflow";
    statusReason = `Weight limit exceeded (${totalWeight.toFixed(1)}kg / ${STANDARD_BOX.maxWeight}kg max).`;
    isOverflow = true;
  } else if (totalVolume > EFFECTIVE_VOLUME_CAPACITY) {
    status = "Volumetric Overflow";
    statusReason = `Spatial volume capacity exceeded due to non-reducible gaps.`;
    isOverflow = true;
  } else {
    for (let item of items) {
      if (
        item.l > STANDARD_BOX.length ||
        item.w > STANDARD_BOX.width ||
        item.h > STANDARD_BOX.height
      ) {
        status = "Volumetric Overflow";
        statusReason = `Item "${item.name}" dimensions exceed single box boundaries.`;
        isOverflow = true;
        break;
      }
    }
  }

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!name || !length || !width || !height || !weight) return;

    setItems([
      ...items,
      {
        id: Date.now(),
        name,
        l: parseFloat(length),
        w: parseFloat(width),
        h: parseFloat(height),
        wg: parseFloat(weight),
      },
    ]);

    // Clear inputs
    setName("");
    setLength("");
    setWidth("");
    setHeight("");
    setWeight("");
  };

  const removeItem = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  return (
    <div className="p-6 bg-white shadow rounded-lg max-w-4xl mx-auto my-6 border border-gray-200 text-gray-800">
      <h2 className="text-2xl font-bold mb-2">Volumetric Packing Planner</h2>
      <p className="text-sm text-gray-500 mb-6">
        Verify monthly inventory distribution layouts prior to warehouse
        procurement.
      </p>

      {/* Status Banner */}
      <div
        className={`p-4 rounded-md mb-6 font-semibold border ${isOverflow ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700"}`}
      >
        <span className="text-lg font-bold">Status: {status}</span>
        <p className="text-sm font-normal mt-1">{statusReason}</p>
      </div>

      {/* Progress Bar Display */}
      <div className="mb-6">
        <div className="flex justify-between text-xs font-semibold mb-1">
          <span>Spatial Capacity Usage</span>
          <span>{percentageUsed.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 h-6 rounded-full overflow-hidden shadow-inner">
          <div
            style={{ width: `${Math.min(percentageUsed, 100)}%` }}
            className={`h-full text-center text-white text-xs flex items-center justify-center transition-all duration-500 ${percentageUsed > 80 ? "bg-red-500" : "bg-green-500"}`}
          >
            {percentageUsed > 10 ? `${percentageUsed.toFixed(0)}%` : ""}
          </div>
        </div>
      </div>

      {/* Input Matrix Form */}
      <form
        onSubmit={handleAddItem}
        className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end bg-gray-50 p-4 rounded-md mb-6 border border-gray-100"
      >
        <div className="col-span-2 md:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Item Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded bg-white"
            placeholder="e.g. Science Kit v2"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Length (cm)
          </label>
          <input
            type="number"
            value={length}
            onChange={(e) => setLength(e.target.value)}
            className="w-full p-2 border rounded bg-white"
            placeholder="L"
            min="0.1"
            step="any"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Width (cm)
          </label>
          <input
            type="number"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            className="w-full p-2 border rounded bg-white"
            placeholder="W"
            min="0.1"
            step="any"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Height (cm)
          </label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            className="w-full p-2 border rounded bg-white"
            placeholder="H"
            min="0.1"
            step="any"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Weight (kg)
          </label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full p-2 border rounded bg-white"
            placeholder="kg"
            min="0.1"
            step="any"
          />
        </div>
        <button
          type="submit"
          className="col-span-2 md:col-span-6 bg-blue-600 text-white p-2 rounded hover:bg-blue-700 font-medium transition-colors"
         aria-label="Action button">
          Add Item to Layout
        </button>
      </form>

      {/* Plotted Items Manifest Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200 text-gray-600 text-xs tracking-wider uppercase">
              <th className="p-3">Item Name</th>
              <th className="p-3">Dimensions (L×W×H)</th>
              <th className="p-3">Volume</th>
              <th className="p-3">Weight</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="p-4 text-center text-gray-400 italic"
                >
                  No cargo manifest inputs registered for this evaluation
                  period.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="p-3 font-medium">{item.name}</td>
                  <td className="p-3 text-gray-600">
                    {item.l} × {item.w} × {item.h} cm
                  </td>
                  <td className="p-3 text-gray-600">
                    {(item.l * item.w * item.h).toFixed(0)} cm³
                  </td>
                  <td className="p-3 text-gray-600">{item.wg.toFixed(2)} kg</td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-700 font-medium"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
