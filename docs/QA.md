# Verification record

Date: October 23, 2026. Browser tests used the deployed public application, independently of the source workspace. This is an engineering prototype verification record, not a security certification or field validation.

## Automated checks

- `npm run check`: JavaScript syntax checks passed for the shared model, app and worker.
- `npm test`: 13 tests passed, including hand-calculated discharge, inverter/reserve limits, efficiency/loss accounting, energy conservation, zero inventory, infeasible floors, exact-DP comparison with exhaustive search, per-hub floor enforcement, bounds/IDs, weather units and horizon, CSV formula neutralization, monotonic objective values and counterfactual explanation consistency.
- `npm audit --omit=dev --offline`: zero vulnerabilities; there are no third-party package dependencies in the lockfile. This is a dependency-surface result, not a claim that all application vulnerabilities are absent.
- Targeted source search found no API-key/token/private-key patterns in deliverable code, tests and documentation. No application secrets are required.

## Deployed browser checks

| Journey | Observed result |
| --- | --- |
| Initial load | Worker calculation completed; default allocation and numerical results matched the shared model. |
| Recalculate duration | 12-hour scenario recalculated with different energy totals and score. |
| Stale results | Export disabled after input changes; previous plan explicitly labeled until recalculation. |
| Infeasible floor | A 60% minimum with insufficient batteries produced a clear error and disabled export. |
| Edit a hub | Communications load changes affected unmet energy. Angle brackets in a hub name displayed literally. Defaults were restored afterward. |
| Scenario save/restore | A named QA scenario saved locally, appeared in the list, and restored its 24-hour inputs after another preset was selected. |
| Stress lab | All three scenarios rendered coverage, baseline comparisons, unmet energy and per-hub service-hours. |
| Live weather | A real Open-Meteo forecast loaded in the deployed browser, showing forecast day and retrieval time. Reset returned to synthetic training weather. |
| Clipboard round trip | Scenario JSON copied through the product, read back, pasted into the import form, validated and recalculated to the same default results. |
| Invalid pasted import | Missing scenario fields were rejected with a validation message; current results remained intact. |
| Explanation | Actual allocated counts, minimum required packs, one-pack score losses and floor violations rendered from shared-model values. |
| Keyboard | Escape closed the hub editor. Inputs have associated labels; dialogs use native modal semantics. |
| Responsive | Desktop layout visually reviewed. At a 390 × 844 viewport, planner controls and stress cards reflowed; the document had no horizontal overflow. Wide data tables scroll within their containers. |
| Console | No warning or error messages were captured in the tested application flows. |

## Boundaries of verification

The CSV download button was invoked, but the connected browser's download event did not return a receipt within its timeout. File-save completion is not certified by that test. Clipboard export and pasted JSON import were then implemented and verified end to end as an alternative. JSON/CSV serializers are covered by model tests; native file-picker import and the print-to-PDF flow have not been fully verified through browser automation.

Actual weather loading and input validation were tested. Provider failure/timeout recovery is implemented, but an artificial network outage was not induced in the browser. No authentication/database/row-level-security path exists in this stateless local-data architecture. No paid external penetration test, broad accessibility audit, screen-reader session, field load measurement, or animation frame-rate benchmark was performed. Reduced-motion CSS and accessible tabular alternatives exist, but that does not establish full WCAG conformance.

The training case's approximately 8.37% score improvement is reproducible within the synthetic model. Its aggregate energy coverage can be lower than round-robin because the optimized objective weights service continuity by occupancy and priority. No claim of real-world benefit, people reached, lives protected, emissions avoided or certified electrical performance is made.
