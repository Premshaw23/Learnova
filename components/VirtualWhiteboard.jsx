"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Dynamically import Excalidraw with SSR disabled because it relies on window/document
const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  .catch(err => console.error(err))