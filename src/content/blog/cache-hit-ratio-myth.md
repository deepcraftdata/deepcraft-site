---
title: "The Cache Hit Ratio Myth: Why 99% Is Not Always Good"
date: 2026-03-06
summary: "Everyone chases a 99% cache hit ratio. Here's why that number alone can be dangerously misleading — and what to look at instead."
tags: ["performance", "caching"]
---

Every PostgreSQL DBA knows the rule: keep your cache hit ratio above 99%. It's in every checklist, every monitoring dashboard, every blog post.

It's also incomplete advice.

## What the cache hit ratio actually measures

The cache hit ratio comes from `pg_stat_bgwriter` and `pg_statio_user_tables`. The formula looks roughly like this:

```sql
SELECT
  sum(heap_blks_hit) /
  nullif(sum(heap_blks_hit) + sum(heap_blks_read), 0) AS cache_hit_ratio
FROM pg_statio_user_tables;
```

This tells you: of all block reads, what fraction were served from `shared_buffers` rather than disk?

Sounds useful. And it is — but it hides two important failure modes.

## Problem 1: A small table skews everything

Imagine you have a `users` table with 10,000 rows (fits easily in memory) and a `events` table with 500 million rows (does not). If your application hits `users` constantly and scans `events` rarely, your aggregate cache hit ratio will look excellent — even though those rare `events` scans are killing your response time.

The ratio is an average. Averages lie.

**What to do instead:** Break it down per table:

```sql
SELECT
  schemaname,
  relname,
  heap_blks_hit,
  heap_blks_read,
  round(
    heap_blks_hit::numeric /
    nullif(heap_blks_hit + heap_blks_read, 0) * 100, 2
  ) AS hit_ratio
FROM pg_statio_user_tables
WHERE heap_blks_read > 0
ORDER BY heap_blks_read DESC
LIMIT 20;
```

Look at the tables with the most physical reads, not the overall average.

## Problem 2: The OS page cache is invisible

PostgreSQL's `shared_buffers` is not the only cache in play. Linux has its own page cache. When PostgreSQL reads a block that isn't in `shared_buffers`, it asks the OS — and if the OS has it in its page cache, the read is still fast (sub-millisecond).

`pg_statio` counts that as a "miss" even though no disk I/O actually happened.

This means:
- A 95% cache hit ratio on a system with 128GB RAM and a 40GB database might perform perfectly fine
- A 99% cache hit ratio on a system with 8GB RAM and a 60GB database might be suffering

**The real metric:** Watch `blk_read_time` from `pg_stat_database` (requires `track_io_timing = on`). That tells you how much time was actually spent waiting for I/O.

```sql
SELECT
  datname,
  blk_read_time,
  blk_write_time,
  blks_read,
  round(blk_read_time / nullif(blks_read, 0), 3) AS ms_per_read
FROM pg_stat_database
WHERE datname = current_database();
```

If `ms_per_read` is under 0.1ms, your effective cache (shared_buffers + OS) is doing its job regardless of what the ratio says.

## When cache hit ratio IS useful

The ratio is not useless — it's a trend indicator. If your cache hit ratio drops from 99.5% to 96% over a week without a corresponding increase in data volume, something changed: a new query pattern, a missing index causing seq scans, or a `shared_buffers` misconfiguration.

Use it as a canary, not an absolute measure.

## The dollar impact

On AWS RDS, the difference between a db.r6g.xlarge (32GB RAM) and db.r6g.2xlarge (64GB RAM) is roughly $300/month. Before you upsize, check whether your cache miss problem is actually an I/O problem or just a misleading metric.

DeepCraft Audit checks both the aggregate ratio and per-table breakdown, cross-referenced with actual I/O wait times. If the number looks bad but I/O is fast, we flag it as informational rather than critical.

## Summary

| Check | Tells you |
|---|---|
| Aggregate cache hit ratio | Rough trend — useful for alerts |
| Per-table hit ratio | Which tables are actually causing I/O |
| `blk_read_time` / `blks_read` | Whether I/O is actually slow |
| `track_io_timing = on` | Required for the above |

Don't optimize for a ratio. Optimize for response time.
