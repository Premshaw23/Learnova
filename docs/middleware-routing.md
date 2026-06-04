# Next.js Middleware Routing Guide

Understanding public routes, private route guards, and authentication validation in Learnova Next.js middleware.

## Rules
1. Public endpoints (like `/login`, `/signup`) bypass session validations.
2. Secure dashboards redirect to authorization prompts if session token is absent.