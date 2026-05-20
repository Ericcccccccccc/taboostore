# TODO

Forward-looking items worth remembering across sessions: lingering workarounds,
deferred hardening, verification steps not yet run. Tick off or delete entries
that no longer apply — this is not a changelog.

## Production hardening

- [ ] Tighten backend CORS (`backend/main.py:13`). Today: `allow_credentials=True`
      combined with `"*"` origin — browsers treat credentialed `*` as effectively
      no-credentials. Replace `"*"` with an explicit allow-list including
      `https://itaboo.store` once the prod domain set is final. Drop the legacy
      `bpjmaqhstn.us-east-2.awsapprunner.com` and `*.awsapprunner.com` entries.
- [ ] Add cache-control to `frontend/nginx.conf`. Today: nginx ships defaults,
      so `index.html` and the hashed JS bundle can both be cached for an
      indefinite amount of time by intermediaries. Set `index.html` →
      `Cache-Control: no-cache` and `/assets/*` (Vite's hashed output) →
      `Cache-Control: public, max-age=31536000, immutable`. Eliminates the
      "hard-refresh after deploy" manual step.
