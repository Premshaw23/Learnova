import React from "react";

export default function Block({ title, description, onButton1Click, onButton2Click ,buttion1title,buttion2title}) {
  return (
    <div className="bg-white shadow-md rounded-xl p-6 flex flex-col justify-between">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-gray-600 mt-2">{description}</p>
      </div>
      <div className="flex gap-3 mt-6">
        <button
          onClick={onButton1Click}
          className=" bg-accent text-white px-4 py-2 rounded-md shadow hover:bg-blue-500 cursor-pointer"
        >
          {buttion1title}
        </button>
        <button
          onClick={onButton2Click}
          className="border border-accent text-accent px-4 py-2 rounded-md hover:bg-purple-50"
        >
          {buttion2title}
        </button>
      </div>
    </div>
  );
}
