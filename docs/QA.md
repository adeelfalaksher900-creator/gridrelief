# Verification record

Date: October 23, 2026. Browser tests used the deployed public application, independently of the source workspace. This is an engineering prototype verification record, not a security certification or field validation.

## Automated checks

- `npm run check`: JavaScript syntax checks passed for the shared model, app and worker.
- `npm test`: 13 tests passed, including hand-calculated discharge, inverter/reserve limits, efficiency/loss accounting, energy conservation, zero inventory, infeasible floors, exact-DP comparison with exhaustive search, per-hub floor enforcement, bounds/IDs, weather units and horizon, CSV formula neutralization, including whitespace/control prefixes, monotonic objective values and counterfactual explanation consistency.
- `npm audit --omit=dev --offline`: zero vulnerabilities; there are no third-party package dependencies in the lockfile. This is a dependency-surface result, not a claim that all application vulnerabilities are absent.
- Targeted source search found no API-key/token/private-key patterns in deliverable code, tests and documentation. No application secrets are required.

## Deployed browser checks

| Journey                       | Observed result                                                                                                                                                                                           |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Initial load                  | Worker calculation completed; default allocation and numerical results matched the shared model.                                                                                                          |
| Recalculate duration          | 12-hour scenario recalculated with different energy totals and score.                                                                                                                                     |
| Stale results                 | Export disabled after input changes; previous plan explicitly labeled until recalculation.                                                                                                                |
| Infeasible floor              | A 60% minimum with insufficient batteries produced a clear error and disabled export.                                                                                                                     |
| Edit a hub                    | Communications load changes affected unmet energy. Angle brackets in a hub name displayed literally. Defaults were restored afterward.                                                                    |
| Scenario save/restore/removal | A named QA scenario saved locally, appeared in the list, and restored its 24-hour inputs after another preset was selected. The disposable QA copy was then removed and the saved count returned to zero. |
| Stress lab                    | All three scenarios rendered coverage, baseline comparisons, unmet energy and per-hub service-hours.                                                                                                      |
| Live weather                  | A real Open-Meteo forecast loaded in the deployed browser, showing forecast day and retrieval time. Reset returned to synthetic training weather.                                                         |
| Clipboard round trip          | Scenario JSON copied through the product, read back, pasted into the import form, validated and recalculated to the same default results.                                                                 |
| Invalid pasted import         | Missing scenario fields were rejected with a validation message; current results remained intact.                                                                                                         |
| Explanation                   | Actual allocated counts, minimum required packs, one-pack score losses and floor violations rendered from shared-model values.                                                                            |
| Keyboard                      | Escape closed the hub editor. Inputs have associated labels; dialogs use native modal semantics.                                                                                                          |
| Responsive                    | Desktop layout visually reviewed. At a 390 × 844 viewport, planner controls and stress cards reflowed; the document had no horizontal overflow. Wide data tables scroll within their containers.          |
| Console                       | No warning or error messages were captured in the tested application flows.                                                                                                                               |

## Boundaries of verification

The CSV download button was invoked, but the connected browser's download event did not return a receipt within its timeout. File-save completion is not certified by that test. Clipboard export and pasted JSON import were then implemented and verified end to end as an alternative. JSON/CSV serializers are covered by model tests; native file-picker import and the print-to-PDF flow have not been fully verified through browser automation.

Actual weather loading and input validation were tested. Provider failure/timeout recovery is implemented, but an artificial network outage was not induced in the browser. No authentication/database/row-level-security path exists in this stateless local-data architecture. No paid external penetration test, broad accessibility audit, screen-reader session, field load measurement, or animation frame-rate benchmark was performed. Reduced-motion CSS and accessible tabular alternatives exist, but that does not establish full WCAG conformance.

The training case's approximately 8.37% score improvement is reproducible within the synthetic model. Its aggregate energy coverage can be lower than round-robin because the optimized objective weights service continuity by occupancy and priority. No claim of real-world benefit, people reached, lives protected, emissions avoided or certified electrical performance is made.

The attempted 768px viewport override retained desktop dimensions in this browser, so a tablet-specific visual check is not claimed. A short-desktop-height sidebar overflow observed during review was addressed by hiding the optional sidebar note below 760px height. The final CSV checks also include leading whitespace and control-character formula prefixes.

## Hubmorrow 1.1 design review

Rebranded the interface and README. Raised small labels to readable type sizes, replaced prototype marketing with a clear sample-plan notice, and simplified the task instructions. Source was formatted with Prettier. No new runtime packages were added.

Observed on the public version 5 in Chrome: 390 × 844 viewport, no document horizontal overflow; mobile text navigation and links to results/settings; duration change to 12 hours disabled export until recalculation; calculated subtitle updated to 12 hours; a 60% floor produced the infeasibility message; default 24-hour and 10% floor restored. The initial mobile network diagram was too small, so the following version replaces it with readable editable hub rows at phone widths.

Model checks: all 13 tests passed after changes. Syntax checks passed. Offline production dependency audit: zero vulnerabilities; no third-party runtime packages.

Version 6 phone check: six readable hub rows rendered at 390 × 844. Opened the Northside editor from a row, changed the phone/internet load to 0.5 kW, saved and recalculated successfully. The final CSS disables global smooth anchor scrolling to keep focus and navigation immediate.
