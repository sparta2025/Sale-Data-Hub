---
name: Codegen naming conventions
description: Orval-generated hook and Zod schema names in this project differ from OpenAPI component schema names.
---

Hook names use operation-based naming, not component schema naming:
- `useListUsers` not `useGetUsers`
- `useListDatasets` not `useGetDatasets`
- `useListDashboards` not `useGetDashboards`

Zod schema Body names also differ from OpenAPI component names:
- `CreateDashboardBody` not `DashboardInput`
- `UpdateDashboardBody` not `DashboardUpdate`
- `UpdateUserBody` not `AdminUserUpdate`
- `ExportExcelBody` / `ExportCsvBody` / `ExportJsonBody` not `ExportInput`

**Why:** Orval generates names from operationId, not from the `$ref` schema name. The operationId is derived from path + method.

**How to apply:** Before importing any hook or Zod schema, grep `lib/api-client-react/src/generated/api.ts` and `lib/api-zod/src/generated/api.ts` to confirm the exact export name.

For endpoints that combine path parameters with query parameters, this Orval setup can generate the same `*Params` name for a Zod path schema and a generated TypeScript query type. Prefer a query-only resource route when practical, then rerun codegen and the library typecheck.

**Why:** A dataset preview endpoint with both a path id and query controls caused a duplicate export in `@workspace/api-zod`.

**How to apply:** If codegen reports a duplicate `*Params` export, inspect whether the operation has both path and query params before changing generated files.
