# Analytics Dashboard Performance benchmarks

Best practices for optimizing rendering pipelines and API queries inside analytics charts.

## Guidelines
1. Enable queries cache in Redis.
2. Defer rendering charts until dashboard tabs become visible in viewports.