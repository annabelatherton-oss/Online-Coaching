-- Default a client's sex to female unless explicitly set to male, so the calorie-target
-- calculation always has a definite value to work from instead of falling back to a generic
-- midpoint estimate.
alter table clients alter column sex set default 'female';

-- Backfill existing clients who don't have a sex recorded yet, so they benefit immediately too
-- rather than only new clients going forward.
update clients set sex = 'female' where sex is null;
