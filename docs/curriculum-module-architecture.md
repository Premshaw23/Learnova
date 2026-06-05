# Curriculum Planning Architecture

Details on how the academic curriculum planning, scheduling, and database states are modeled in Learnova.

## Data Flow
1. Admin triggers course configurations in the scheduler module.
2. State is persisted across PostgreSQL structures.
3. Middleware validates overlapping classes and resource constraints.