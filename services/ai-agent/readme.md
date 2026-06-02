# Learnova Agent Tool Registry & Intent Subsystem

This subdirectory contains the decoupled architectural framework handling fallback action bindings and native database hooks when live LLM context interfaces are offloaded or unavailable.

## Architecture Mapping
* `tools.js` - Dedicated execution schemas (`ToolRegistry`) declaring runtime actions that query MongoDB and fire core system notifications.
* `intentparser.js` - Regex engine evaluating inputs to match user targets and run parameter-extraction mapping loops.

## How to Scale: Registering a Brand-New Tool

To expand this modular orchestration interface layer:

1. **Add to the Array Schema inside `tools.js`**: Open the array and inject a structural execution node map:
```javascript
{
  name: "your_system_action_string",
  description: "Clear explanatory context used for downstream LLM prompt injection pools.",
  execute: async function({ targetParameter }) {
     // 1. Await database connect variables
     // 2. Perform localized driver queries
     // 3. Return stringified JSON payload templates containing { status, tool, message, data }
  }
}