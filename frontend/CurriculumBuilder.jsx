// Accessible drag keyboard handlers
export function handleBuilderKeyboard(event, item, moveCallback) {
  if (event.key === 'ArrowUp') {
    moveCallback(item, -1);
  } else if (event.key === 'ArrowDown') {
    moveCallback(item, 1);
  }
}
