# Release Checklists

This folder stores one operational checklist per release.

## Naming Convention

Use this file name format:
- RLS-YYYY-MM-DD-NN.md

Example:
- RLS-2026-05-19-01.md

Where:
- YYYY-MM-DD = planned release date
- NN = sequence for the same day (01, 02, ...)

## Workflow

1. Copy RELEASE_CHECKLIST_TEMPLATE.md to a new release file.
2. Fill metadata, owners, and planned timeline.
3. Execute gates and mark PASS/FAIL with evidence links.
4. Run deployment + smoke test and complete sign-off block.
5. Store final decision in GO_LIVE_SIGNOFF.md and LAUNCH_READINESS.md.

## Required References

- GO_LIVE_SIGNOFF.md
- PRODUCTION_TESTING.md
- LAUNCH_READINESS.md
