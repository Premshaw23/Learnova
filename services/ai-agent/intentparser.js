import { matchUserIntent } from "./intentMatcher.js";

// Alias the function name to satisfy imports expecting parseUserIntent
export const parseUserIntent = matchUserIntent;

// Satisfy both named and default import formats
export default parseUserIntent;
