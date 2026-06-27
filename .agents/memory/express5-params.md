---
name: Express 5 req.params type casting
description: In Express 5, route params destructured from req.params have type string | string[], causing Drizzle eq() overload errors.
---

When using `req.params` with Drizzle ORM's `eq()` function, always cast to string:

```ts
// Wrong — TypeScript error: string | string[] not assignable to string
const { userId } = req.params;
eq(usersTable.id, userId)  // error

// Correct
const userId = req.params.userId as string;
eq(usersTable.id, userId)  // ok
```

**Why:** Express 5 types `ParamsDictionary` as `{ [key: string]: string | string[] }` even though at runtime params are always strings. Drizzle's `eq()` overloads don't accept `string[]`.

**How to apply:** In every route handler that uses `req.params.*` with Drizzle queries, use `req.params.paramName as string` instead of destructuring.
