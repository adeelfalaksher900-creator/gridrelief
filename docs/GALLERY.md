# Hubmorrow image gallery

15 genuine views of the redesigned application, prepared for the Devpost image gallery. Each JPEG is 1905 × 1270 (3:2). Image 15 arranges unchanged phone and tablet captures on a labeled canvas.

## 01. Power planner

![Power planner](gallery/01-power-planner.jpg)

Plan backup power for a community. This sample shares eight batteries across six hubs and shows supplied energy, priority-score gain and remaining gaps.

## 02. Hub power needs

![Hub power needs](gallery/02-hub-needs.jpg)

Set each hub's power needs. Edit phones and internet, refrigeration, cooling, lighting, solar capacity, expected occupancy and priority before calculating.

## 03. Battery assumptions

![Battery assumptions](gallery/03-battery-assumptions.jpg)

Make the assumptions visible. Adjust initial battery charge, reserve, efficiency, solar availability and load levels before calculating.

## 04. Recalculate an outage

![Recalculate an outage](gallery/04-recalculate.jpg)

Explore a shorter outage. Changing the duration to 12 hours recalculates battery assignments, energy coverage and the hourly power balance.

## 05. Clear infeasibility

![Clear infeasibility](gallery/05-infeasible-minimum.jpg)

Get a clear answer when a request is impossible. A 60% minimum at every hub cannot be met with eight packs, so the app asks for more batteries, lower loads or a lower minimum.

## 06. Test three conditions

![Test three conditions](gallery/06-stress-tests.jpg)

Test the same battery plan in three conditions: the planned outage, 40% less solar, and a 12-hour longer outage with 15% more demand. The round-robin comparison uses the same resources and minimum.

## 07. Allocation reasons

![Allocation reasons](gallery/07-allocation-reasons.jpg)

See the reason for each assignment. The explanation shows the minimum packs needed and the priority-score loss from removing one pack, while keeping other assignments fixed.

## 08. Hourly energy table

![Hourly energy table](gallery/08-hourly-data.jpg)

Inspect the hourly values behind the chart. The accessible table reports demand, supplied power, solar output and stored energy for each modeled hour.

## 09. Optional weather

![Optional weather](gallery/09-real-forecast.jpg)

Load optional Open-Meteo forecast data for the reference location. The source, forecast day and retrieval time remain visible. Hub inputs are sample values that you can edit.

## 10. Save a plan

![Save a plan](gallery/10-save-plan.jpg)

Keep a named plan in this browser. Save its inputs so you can open it later, change the assumptions and calculate again.

## 11. Reopen saved plans

![Reopen saved plans](gallery/11-saved-plans.jpg)

Open named plans saved in this browser. Community backup plan was created through the real save flow, then reopened before export and import verification.

## 12. Export and inspect

![Export and inspect](gallery/12-export-plan.jpg)

Take the plan with you. Export calculated inputs and results as JSON, create a CSV allocation table, copy plan data or print a report. The JSON preview makes the inputs inspectable.

## 13. Import and recalculate

![Import and recalculate](gallery/13-import-plan.jpg)

Reopen the same plan from JSON. Inputs are checked, imported results are discarded and the app calculates fresh results. Clipboard export and pasted import were verified end to end.

## 14. Method and data

![Method and data](gallery/14-method-and-data.jpg)

Know how the result works. Read the energy-balance rules, exact allocation method, data sources, privacy choices and practical limits before real use.

## 15. Phone and tablet

![Phone and tablet](gallery/15-responsive.jpg)

Use the planner on different screens. These unretouched browser captures show editable hub rows at 390 px and the plan tests at 768 px. The layout adapts without hiding the key decisions.
