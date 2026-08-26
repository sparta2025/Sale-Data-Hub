---
name: OpenRouter free model fallbacks
description: Provider behavior and resilience guidance for the Sales BI AI agent.
---

Free OpenRouter models may be present in the catalog but temporarily rate-limited by their upstream provider. The AI agent should not assume one `:free` model is always available; it should try a short, current list of `:free` chat models and retry transient 429/5xx responses with a small backoff.

**Why:** A catalog-listed Google free model returned an upstream 429 while another free model completed the same request successfully.

**How to apply:** Keep the model list server-side, verify model IDs against the live OpenRouter catalog when changing it, and never expose the OpenRouter key to the browser.