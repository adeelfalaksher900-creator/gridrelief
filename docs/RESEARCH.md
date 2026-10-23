# Research and verified hackathon requirements

Checked on October 23, 2026. The selected source is the official [IEEE Hack for Humanity Devpost](https://ieee-ai-hack-for-humanity.devpost.com/).

## Requirements and contradictions

| Item                | Verified finding                                                                                                                                                                                     | Project response                                                                                                |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Submission window   | The live schedule ends Oct 23 at 11:45 p.m. EDT / Oct 24 at 8:45 a.m. Asia/Karachi. The Oct 22 update grants late submissions. The old rules table still says Oct 21.                                | Use live schedule and extension; preserve the discrepancy.                                                      |
| Eligibility         | Overview says US only, students only, team required. Detailed rules allow students/professionals and individual/team entries, maximum 5, without an explicit geography clause.                       | Eligibility is not certified; organizer clarification remains necessary. No false attestation.                  |
| Finalist attendance | In-person final at Freeman Hall, UUCC, Charlotte on Oct 24, 9 a.m.–6 p.m. Latest update preserves it; written rules require availability or organizer notification.                                  | No invented availability or remote exception.                                                                   |
| Primary track       | Six tracks now appear; some older text/prize descriptions still says five. A new generic track was announced separately.                                                                             | Select Power & Energy, a consistently named original track.                                                     |
| Prototype           | A working prototype is encouraged; tangible proof of concept may be accepted.                                                                                                                        | Deliver an end-to-end functional simulation.                                                                    |
| Source              | Team GitHub repository link is required.                                                                                                                                                             | Public repository with code, tests, setup, design and limitations.                                              |
| Video               | Rules explicitly require an online video walkthrough. No exact video duration is published in the pages read. Finalist presentation is roughly 10 min + 5 min Q&A; that is not a video length limit. | Deferred until project approval under the user's instruction. It is still a final-submission requirement.       |
| Evidence            | Overview asks screenshots and/or short demo evidence, architecture, impact, constraints, trust, scalability, adoption and contributions.                                                             | Actual implementation evidence; no fabricated history or measured impact. Final gallery deferred.               |
| AI                  | Major generative AI, AI coding or agent tools must be disclosed.                                                                                                                                     | Concise ChatGPT/Codex disclosure. No AI requirement for Power & Energy.                                         |
| Attribution         | Pre-existing/open-source components are permitted subject to license and clear attribution.                                                                                                          | Original code; cite scientific and API references separately.                                                   |
| Sponsor tech        | No required commercial SDK, API or paid sponsor stack was found.                                                                                                                                     | No paid dependency.                                                                                             |
| Community           | Resources explicitly require joining the official Discord and request name + team name. Two official page links point to different invite codes.                                                     | Account/team naming and joining are not fabricated. Discord membership remains unverified if sign-in blocks it. |
| Prizes              | Noncash recognition/certificates/people's choice. Prize prose is inconsistent about track count and winners.                                                                                         | No monetary-prize claim.                                                                                        |

Official pages reviewed: [rules](https://ieee-ai-hack-for-humanity.devpost.com/rules), [resources](https://ieee-ai-hack-for-humanity.devpost.com/resources), [schedule](https://ieee-ai-hack-for-humanity.devpost.com/details/dates), [updates](https://ieee-ai-hack-for-humanity.devpost.com/updates), [late-submission announcement](https://ieee-ai-hack-for-humanity.devpost.com/updates/47195-late-submissions-granted), discussions and project gallery. The gallery is unpublished and the discussion board has no topics; no previous winners or judge feedback specific to this event were available in those pages.

## Judging rubric

Impact/problem relevance 25; innovation 20; technical feasibility/quality 20; trust/ethics/risks 15; scalability 10; adoption 10. The product focuses on a concrete decision, inspectable engineering evidence, explicit assumptions, and a simple path to community validation.

## Five substantially different ideas considered

Scores below are design judgments, not measured validation. Each uses a 1–5 scale (higher is better) for distinctiveness, impact, feasibility, demonstrability and rubric fit.

| Idea and industry                                                       | Problem evidence                                                         | D / I / F / Demo / Fit | Decision                                                                                                    |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| Hubmorrow: whole-pack backup power allocation across hubs               | NREL/DOE resilience hub research and existing REopt site-level tooling   | 4 / 5 / 5 / 5 / 5      | Selected: meaningful exact optimization, no private data or paid API needed, strong bounded demonstration.  |
| ClearSteps: cognitive-accessible civic form traversal                   | WHO identifies unmet assistive technology needs, including digital tools | 3 / 5 / 3 / 4 / 4      | Requires disability-led input and domain-specific form validation to make responsible benefit claims.       |
| LeakLedger: small-utility leak intervention prioritization              | EPA resources discuss water audits and water-loss controls               | 4 / 5 / 2 / 3 / 4      | Lacks reliable local asset condition and pressure measurements in the available window.                     |
| ColdChain Relay: food pantry outage transfer scheduler                  | USDA explains power-loss refrigeration constraints                       | 3 / 4 / 3 / 4 / 4      | Reliable temperature history, actual transport capacity and safe food-handling validation are essential.    |
| SignalProof: impersonation scam evidence and verified contact retrieval | FTC documents large reported impersonation losses                        | 2 / 5 / 3 / 4 / 4      | Crowded category; classifier false reassurance and verified-identity data are difficult to address quickly. |

Problem sources: [WHO assistive technology](https://www.who.int/news-room/fact-sheets/detail/assistive-technology), [EPA small drinking-water systems](https://www.epa.gov/dwcapacity/water-efficiency-and-conservation-resources-small-drinking-water-systems), [USDA power failures](https://ask.fsis.usda.gov/article/How-do-you-keep-food-safe-during-a-power-failure), [FTC impersonation findings](https://www.ftc.gov/news-events/news/press-releases/2026/06/ftc-data-show-people-reported-losing-3-point-5-billion-imposter-scams-2025).

## Competition and originality

- [REopt user manual](https://reopt.nlr.gov/tool/reopt-user-manual.pdf): established, much broader site-level energy design/economic/resilience optimization. Hubmorrow does not claim to replace or outperform it. The smaller decision is allocating a fixed whole-pack inventory across hubs with an explicit floor and conservative score.
- [GridBalance AI](https://devpost.com/software/gridbalance-ai): neighborhood EV/home battery scheduling and peak demand. Hubmorrow focuses on outage service continuity and inter-hub pack placement.
- [EnerFlux](https://devpost.com/software/enerflux): renewable microgrid dispatch with weather and stress events. Hubmorrow's decision variable is pack allocation among separate hubs and is accompanied by an exact discrete objective and model-level proof tests.
- [Idaho National Laboratory ResDEEDS](https://github.com/idaholab/ResDEEDS): broader energy-delivery resilience planning; demonstrates that resilience planning is an established field.
- [SPS-L/pyeplan](https://github.com/SPS-L/pyeplan): resilient microgrid planning and operation; a different, broader modeling workflow.
- [Resilient, GeeseHacks winner](https://devpost.com/software/resilient-ra6mpg): the page lists 3rd Place Overall and sponsor awards. Its story ties community wildfire information, a weighting algorithm and a live voice interaction into a concrete journey. Transferable lesson: demonstrate the actual decision chain, explain implementation and scope honestly. This is an inference, not private judge feedback.

No claim that this idea is the first or unique worldwide is justified. The contribution is the focused, inspectable combination and usable workflow. No competitor code or assets were copied.

## Design research

Apple HIG layout, accessibility and chart guidance informed hierarchy, labels, non-color evidence, readable summaries and equivalent data tables. The interface uses a restrained engineering workspace: fixed navigation, a clear input/output hierarchy, compact system schematic, explicit provenance and reduced motion. It uses original HTML/CSS/SVG, system fonts and no scraped or protected product assets.

## Adoption and validation next

The next real-world stage is participatory validation with a community hub coordinator and electrical professional: collect measured load curves, verify islandable PV and compatible batteries, agree priority/floor policy, model deployment logistics, and compare decisions with an established planning tool. The prototype does not replace those steps. There are no claimed interviews, field deployments, certified forecasts, emissions reductions or lives saved.
