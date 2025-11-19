# Performance Review and Improvement Plan

## Executive Summary

A review of the application's functionality and speed was conducted. The application uses Next.js with Server Components, connecting to a Postgres database. 

**Status:** The application functionality is sound, but the data fetching strategy had significant overhead due to repetitive "schema discovery" queries (checking if columns exist) on every request, and sequential execution of independent database queries.

**Action Taken:** Immediate performance improvements have been applied to the codebase to increase "snappiness" without altering the UI.

## Implemented Improvements

The following changes have been applied to `src/data/crm.ts` and `src/data/db.ts`:

1.  **Persistent Schema Caching**: 
    -   Previously, the app checked `information_schema` on every request to see if columns like `lifecycle_stage` or `owner` existed. This was cached in-memory, which is cleared frequently in serverless environments.
    -   **Change:** Wrapped these checks (`tableHasColumn`, `tableExists`, `getClientColumns`, `getStageShape`) with Next.js `unstable_cache`. This persists the cache to the Data Cache (Redis/FileSystem), meaning these queries now run almost zero times after the first warm-up.

2.  **Parallelized Data Fetching**:
    -   Previously, the app would `await getStageShape()`, then `await getClientColumns()`, then run the main query.
    -   **Change:** These helper functions are now fetched in parallel using `Promise.all`, reducing the "Time to First Byte" (TTFB).

3.  **Optimized Connection Management**:
    -   Ensured the database pool is correctly reused, and the caching mechanism logic is robust against cold starts.

## Future Roadmap (Further Improvements)

To further increase speed and snappiness, the following steps are recommended:

### 1. Full Data Caching with Revalidation (High Impact)
Currently, the *results* of `fetchClients` and `fetchPipelineBoardData` are not cached (to ensure data freshness). 
-   **Plan:** Wrap these main data functions in `unstable_cache(['clients-list'], { tags: ['clients'] })`.
-   **Requirement:** Update all mutation actions (in `src/server/domain/*.ts`) to call `revalidateTag('clients')` after a successful write. This ensures users see instant loads (cache hits) but also fresh data after edits.

### 2. Database Indexing Optimization
The "Activity Feed" lookup uses a `LATERAL JOIN` which can be slow.
-   **Plan:** Add a composite index on the `activities` table:
    ```sql
    CREATE INDEX idx_activities_client_created_at ON activities(client_id, created_at DESC);
    ```
    This allows Postgres to instantly find the "last activity" without scanning multiple rows.

### 3. Optimistic UI Updates
To make the app feel "instant" during interactions (like moving a deal in the pipeline):
-   **Plan:** Use React's `useOptimistic` hook in the Client Components. This allows the UI to update immediately while the server action runs in the background.

### 4. Client Bundle Optimization
-   **Plan:** Audit `src/components` to ensure no heavy libraries (like full `lodash` or heavy charting libs) are included in the main bundle. Use `next/dynamic` to lazy load any heavy interactive components.

