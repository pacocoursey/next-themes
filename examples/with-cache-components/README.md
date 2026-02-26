# next-themes with Cache Components

Demonstrates next-themes working with Next.js [Cache Components](https://nextjs.org/docs/app/guides/cache-components) (`cacheComponents: true`).

When Cache Components keeps multiple routes mounted in the DOM, theme providers that store state in React can go stale. The `useSyncExternalStore` approach in next-themes ensures all mounted routes share the same theme.

## Running

```bash
pnpm dev
```
