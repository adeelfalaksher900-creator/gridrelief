# Hubmorrow submission draft

Name: Hubmorrow
Tagline: Backup power, planned.
Live app: https://hubmorrow.sturdynova2049.chatgpt.site
GitHub: https://github.com/adeelfalaksher900-creator/hubmorrow
Status: Draft; never final-submit without participant authorization.

---

**Primary challenge track:** Power & Energy: Engineering a Sustainable Future

## Inspiration
A community can have several hubs that support residents during a power outage, but only a few portable batteries. Giving every hub the same number of batteries ignores its power needs, available solar and local priorities.

Research from NREL/DOE on solar-plus-storage resilience hubs helped frame the problem. **Hubmorrow asks a practical question: where should these batteries go, and where will power still run short?**

## What it does
Hubmorrow is a working backup-power planning application for community coordinators.

1. **Set the needs.** Edit each hub's phones/internet, refrigeration, cooling and lighting loads. Add solar capacity, expected occupancy and a priority.
2. **Share the batteries.** Set the available pack count, storage, output limit and outage duration. Choose a minimum share of energy for every hub, then calculate the plan.
3. **Test the plan.** Keep the same batteries in place and check less sunlight or a longer, higher-demand outage. Compare the result with a round-robin plan that follows the same minimum.

The app shows whole battery assignments, hourly supply and demand, unmet energy, and the reason behind each hub's allocation. Users can save plans in their browser, export JSON or CSV, copy plan data, import it again, and print a report.

**The six starting hubs and their load values are sample data.** An optional Open-Meteo integration loads real hourly forecast model output for fixed Charlotte coordinates. Each snapshot records its date and retrieval time. Built-in sample weather keeps the core planner usable without a forecast request.

## How we built it
The interface uses HTML, CSS, SVG and browser-native JavaScript. A module Web Worker runs the calculations away from the interface. There are no third-party runtime packages, required API keys or paid services.

The model first simulates every possible battery count at each hub, hour by hour. Solar serves loads first. Batteries charge or discharge within their storage, power, reserve and efficiency limits. Every unmet kWh is recorded.

An integer dynamic program then searches the bounded allocation choices. It assigns the available whole packs while enforcing the selected minimum. With tougher-condition planning enabled, each hub is scored using its worst service fraction across the three defined cases. Expected occupancy and the user's priority weight scale that score. The solver maximizes the sum of these per-hub scores.

This search is exact for this discrete model. It does not claim to find the best field plan for every possible outage. The repository explains the equations, schema, architecture and data flow.

No account is needed to try the app. Saved inputs stay in the visitor's browser. Forecast calls use a fixed city location and do not request the visitor's location.

## Challenges
**Energy and power are different.** A battery may store enough kWh but still lack the kW output needed at a hub. The model checks both and tests that energy balances close.

**A better score is not automatically more total energy.** Giving more weight to one hub can improve the priority score while reducing aggregate energy supplied. Hubmorrow shows both measures and a baseline so users can review the trade-off.

**Plans need to travel.** Clipboard export and pasted JSON import provide a way to move the exact inputs even when browser file downloads are unavailable. Imported results are recalculated from validated inputs.

**Small labels made the first interface harder to use.** The design review raised type sizes, simplified instructions and replaced the phone-size network diagram with readable, editable hub rows.

## Accomplishments
- A public app with a complete edit, calculate, test, save and export journey.
- Thirteen passing automated tests covering hand calculations, energy conservation, power/reserve limits, infeasible minimums, validation, CSV formula injection protection and agreement with exhaustive small-case search.
- Tested deployed-browser flows for recalculation, hub editing, save/restore, stress comparisons, forecast loading/reset and clipboard export/import.
- Desktop and phone layouts checked, including six editable mobile hub rows.
- A reproducible sample allocation of **[1, 4, 1, 0, 1, 1]**. Its priority score is about **8.37% above the same-floor round-robin baseline in this sample case**. This is modeled evidence, not measured community impact. Total energy coverage can be lower.

The production dependency audit reported zero vulnerabilities with no third-party runtime packages. That is an audit result, not a security certification.

## What we learned
The objective must be visible. A plan can raise a weighted service score while supplying less energy overall. A useful planning tool lets people see that choice, change its assumptions and reproduce its result.

Clear error messages matter too. If there are too few batteries to meet every hub's minimum, the app explains the conflict instead of presenting an impossible plan.

## Practical use and limits
Hubmorrow supports planning and human review. It does not predict outages, control equipment or certify a facility's safety. The model leaves out travel and installation time, surge currents, detailed solar geometry, battery aging, equipment failures and electrical-network topology. Essential loads are served proportionally as a bundle.

Expected occupancy is an assumption, not a count of people helped. Priorities need agreement with the affected community. Real use needs measured loads, compatible certified equipment, an electrical professional and approved operating procedures. Browser storage is not encrypted; sensitive household or medical details should not be entered.

## What's next
Review the workflow with a community hub coordinator and an electrical professional. Add measured load profiles, equipment compatibility, transport constraints and field validation before operational use.

## Sources and disclosure
- [NREL/DOE: Ensuring Resilient Operations of Solar-Plus-Storage Community Resilience Hubs (2024)](https://www.nlr.gov/docs/fy24osti/89601.pdf).
- [REopt user manual](https://reopt.nlr.gov/tool/reopt-user-manual.pdf), a reference for established site-level energy optimization; it is not an integrated service or dependency.
- [Open-Meteo](https://open-meteo.com/) forecast data under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Raw snapshots are retained; derived outputs apply configured solar and stress adjustments.
- Original sample hub fixtures and interface assets. Original code is MIT licensed.

Research, coding, design, testing and submission preparation used substantial ChatGPT/Codex assistance. Core calculations are deterministic and run without a language model. Individual teammate roles have not been invented.
