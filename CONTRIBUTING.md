# Contributing to GratiFi

Thanks for your interest in contributing to **GratiFi** — a Polkadot-based, mobile-first dApp that helps hospitality workers receive dream-linked micro-tips powered by Web3 and AI. Whether you’re reporting a bug, proposing a feature, improving docs, or submitting code, we appreciate your help.

> Please read this document before opening issues or PRs — it speeds up review and helps keep the project healthy and welcoming.

---

## Code of Conduct

We follow the Contributor Covenant v2.0. Be respectful, inclusive, and professional. Harassment, hateful language, or discriminatory behaviour will not be tolerated. If you experience or witness unacceptable behaviour, please contact the maintainers privately at `maintainers@gratifi.example`.

## What you can contribute

* Bug reports and reproduction steps
* Feature requests and design proposals
* Documentation fixes and improvements (tutorials, READMEs)
* Smart contract / pallet code, frontend, and backend services
* Tests, CI configurations, and developer tooling
* Translations and accessibility improvements

### Special guideline for grants and public-facing proposals

GratiFi avoids mentioning patents in grant proposals or public funding materials. If you help draft grant text or Fast Grant submissions, **do not include patent claims or language**. (Internal R\&D notes may mention technical novelty — discuss with maintainers first.)

---

## Getting started (developer quickstart)

> Assumes repo contains `frontend/`, `contracts/` or `pallets/`, and `services/` folders. Adjust paths to your local tree.

1. Fork the repo and create a branch from `main` (`git checkout -b feat/short-description`).
2. Clone your fork and add upstream remote:

```bash
git clone git@github.com:<your-user>/gratifi.git
cd gratifi
git remote add upstream git@github.com:gratifi-org/gratifi.git
```

3. Install prerequisites (examples):

* Node.js (LTS) and `npm` or `yarn`
* Rust + Cargo (for ink!/substrate contracts) and `wasm32-unknown-unknown` target if building contracts
* Docker (recommended for running a local dev node)
* Python 3.9+ if working on AI services

4. Install frontend dependencies and start dev server (example):

```bash
cd frontend
npm install
npm run dev
```

5. Smart contracts / pallets (example using ink!):

```bash
cd contracts
cargo +nightly contract build
# or use the repo's Makefile: make build-contracts
```

6. AI / backend services (example):

```bash
cd services/ai
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

> See each package's README for exact commands — the repo may contain package-specific dev instructions.

---

## Branching & Commit conventions

* Branch naming: `feat/<short>`, `fix/<short>`, `chore/<short>`, `docs/<short>`, `test/<short>`
* Keep changes small and functional — one scope per PR.
* Use conventional commits or this style for commit messages:

```
type(scope): short description

Longer description (wrap at ~72 chars).

BREAKING CHANGE: explain.
```

Common `type` values: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`.

---

## Pull Request process

1. Open an issue first for bigger features or design changes; discuss with maintainers and label the issue `proposal`.
2. Branch from `main` and target `main` in your PR.
3. Include a clear title and description of what the PR does, why, and any trade-offs.
4. Link to the related issue (e.g. `Fixes #123`) and include screenshots or recordings for UI changes.
5. Ensure tests pass locally and in CI. Add tests for new behaviour.
6. Maintain semantic versioning for public contracts/interfaces; document any breaking changes.

Review timeline: maintainers aim to respond within a few business days — be patient and address feedback promptly.

---

## Tests & CI

* Run unit tests for the frontend:

```bash
cd frontend
npm test
```

* Smart contract tests (example):

```bash
cd contracts
cargo test
```

* For service tests (Python/Node): run `pytest` or `npm test` in the service folder.

CI runs on each PR; ensure your branch is up to date with `main` before requesting review.

---

## Linting & Formatting

* Frontend: ESLint + Prettier
* Contracts / Rust: `rustfmt` and `clippy`
* Python: `black` and `ruff`

Run the linters and formatters before committing. Example:

```bash
# frontend
npm run lint
npm run format

# rust
cargo fmt --all
cargo clippy --all-targets --all-features -- -D warnings

# python
black .
ruff . --fix
```

---

## Security & Responsible Disclosure

If you discover a security vulnerability (smart contract bug, critical data leak, secret in repo), do **not** open a public issue. Contact the maintainers privately at `security@gratifi.example` and provide steps to reproduce, affected components, and suggested mitigation. We will acknowledge within 48 hours.

For smart contract audits and high-risk code, coordinate with maintainers before publishing changes.

---

## Reporting bugs and requesting features

When opening an issue, please include:

* A clear title and short description
* Steps to reproduce (exact commands, environment)
* Expected behaviour vs actual behaviour
* Logs, stack traces, screenshots, and browser/OS versions if applicable

Label your issue appropriately (bug, enhancement, docs, question).

---

## Design docs & Architecture proposals

Longer changes should start with a design document in the `docs/` folder (e.g. `docs/architecture/<short>-proposal.md`) describing:

* Problem statement
* Proposed solution and alternatives
* Security and privacy considerations
* UX flows and mockups (if UI-related)
* Backwards compatibility and migration plan
* Testing plan

Link the design doc in the related GitHub issue / PR.

---

## Documentation

Docs live in `docs/` and in each package README. Small doc fixes can be made directly via a PR. Larger docs or guides should be discussed on an issue.

---

## Style guide and accessibility

* Frontend: use accessible HTML, semantic tags, and ARIA where appropriate.
* Write copy clearly and concisely; prefer user-centered language for onboarding flows.

---

## Localization & Translations

We welcome translations. Place translation files under `i18n/` or the relevant package folder. Please open an issue to coordinate major language rollouts.

---

## Licensing and DCO / CLA

We use the repository license in `LICENSE` (usually MIT/Apache-2.0 — check repo root). By submitting a PR you agree that your contribution is covered by the project license.

If a Contributor License Agreement (CLA) or Developer Certificate of Origin (DCO) is required, follow the repo instructions.

---

## Getting help and communication channels

* Preferred: open an issue on GitHub for anything project-related.
* For quick chats or community support, see `COMMUNITY.md` or join our chat (see repo README).

---

## Thank you

Thanks for helping build GratiFi. Your contributions make it possible for hospitality workers to receive meaningful support for their dreams. If you’re unsure where to start, look for issues labeled `good first issue` or `help wanted`.

---

*Last updated: August 8, 2025*
