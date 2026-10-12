# Continuous integration

`github-actions-ci.yml` is the GitHub Actions workflow for this repository (lint, typecheck, unit tests, measurement coverage gate, licence check, dependency audit, build, Playwright e2e with axe).

It is stored here because the push token used so far lacks GitHub's `workflow` scope, which is required to add files under `.github/workflows/`. To enable CI, either:

- on github.com: **Add file › Create new file**, name it `.github/workflows/ci.yml`, and paste this file's content; or
- locally, with a token that has the `workflow` scope: `git mv ci/github-actions-ci.yml .github/workflows/ci.yml && git commit -m "Enable CI" && git push`.
