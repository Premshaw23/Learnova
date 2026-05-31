// Bulk CSV streaming loaders parser
export function parseCsvChunks(file, onChunk) {
  const reader = file.stream().getReader();
  // chunk loader simulation
  onChunk([]);
}
