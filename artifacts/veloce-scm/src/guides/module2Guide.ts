export const module2Guide = `# Module 2 Student Guide — Operations Planning & Manufacturing
## Veloce Wear SCM Simulation · 55 Points · Porto Manufacturing Campus

---

📧 **Briefing from Sofia Costa — CSCO, Porto HQ**

*From: Sofia Costa, Chief Supply Chain Officer | Subject: Year 31 Production Sprint — Module 2*

The materials are confirmed. Your Module 1 sourcing decisions have locked our inbound supply lines — some of you chose nearshore suppliers with short lead times and high reliability; others chose offshore at lower cost but with more variability. Whatever you locked in Module 1 is now your reality for the next 8 weeks.

Your job now is to translate an 8-week demand plan into an executable production system for the Porto campus. You must decide what to make and when, which work center is holding you back, whether to invest in capacity or quality improvements, and how to organize the factory floor. This is not a spreadsheet exercise — it is a manufacturing leadership decision.

One warning: I have seen too many teams overproduce in Weeks 6–8 to protect service, then watch their profit evaporate from markdown losses. Fast fashion punishes overstock as severely as it punishes stockouts. Your plan must be disciplined throughout the horizon, not just at peak. Porto is counting on you. — *Sofia*

---

⚠️ **Practice Runs vs. Final Submission**

You may run the simulation as many times as you like — only your Final Submission is graded. Run at least 3 practice scenarios. Compare KPIs across runs. Use the feedback panel after each run to understand what changed and why.

---

## STEP 1 — The Cascade: What Your Module 1 Decisions Created

Module 2 does not start from scratch. Every M1 sourcing decision created a real operational constraint.

🔍 **Open the Module 2 Context Panel in the Simulation**

Find your average supplier reliability % — this directly determines how often the factory experiences material disruption days.

| Your M1 Decision | What It Created for M2 |
|---|---|
| High reliability (≥96%) | Fewer disruption days — production runs close to plan |
| Low reliability (<93%) | More disruption days — factory output cut ~50% on those days; larger buffer needed |
| Short average lead time (<8 days) | Materials arrive quickly — less Week 1 startup risk |
| Long average lead time (>15 days) | Materials may not arrive before Week 2–3 needs |
| High quality/sustainability scores | Lower incoming defect rates — fewer production quality losses |

💡 **Think About This**
- What was your M1 reliability %? How many disruption days would you expect in 56 days at that reliability level?
- Which of your M1 decisions creates the most risk for your production plan, and how will you compensate?

---

## STEP 2 — The 8-Week Demand Plan: What Porto Must Produce

Study this demand schedule before entering a single number into the S&OP plan.

| Week | SKU A (Trend Tee) | SKU B (Core Jogger) | Total | Cumulative |
|---|---|---|---|---|
| 1 | 4,800 | 2,400 | 7,200 | 7,200 |
| 2 | 5,200 | 2,550 | 7,750 | 14,950 |
| 3 | 5,600 | 2,700 | 8,300 | 23,250 |
| 4 | 6,000 | 2,800 | 8,800 | 32,050 |
| 5 | 6,200 | 2,750 | 8,950 | 41,000 |
| 6 | 5,800 | 2,650 | 8,450 | 49,450 |
| 7 | 5,300 | 2,550 | 7,850 | 57,300 |
| 8 | 4,900 | 2,450 | 7,350 | 64,650 |

**Demand Characteristics:**
- SKU A (Trend Tee): Rises from Week 1 through Week 5, then falls. Fashion-sensitive — overproduction in Weeks 6–8 risks markdown losses.
- SKU B (Core Jogger): Relatively stable across all 8 weeks. Easier to plan but competes for the same capacity.
- **Weeks 3–5 are the pressure zone** — peak demand of 8,300–8,950 units/week. Underplanning here causes service failures.

💡 **Think About This**
- Total 8-week demand: SKU A = 43,800 | SKU B = 20,850 | Combined = 64,650 units
- If you level-produce at a constant weekly rate and demand drops in Week 8, how much excess inventory will you have? At €12.00/unit markdown, what does that cost?

---

## STEP 3 — Build Your 8-Week S&OP Plan

Your S&OP plan is your most important decision — it drives capacity loading, MRP timing, and inventory throughout the simulation.

### Capacity Mode — Choose Before Planning

| Mode | Daily Capacity | Weekly Capacity (×7) | Daily Cost | Context |
|---|---|---|---|---|
| **Standard** | 800 units | 5,600/week | €480/day | Below average weekly demand — rationing likely in Weeks 3–5 |
| **Overtime** | 1,050 units | 7,350/week | €680/day | Near average demand — comfortable but not limitless |
| **Two-Shift** | 1,500 units | 10,500/week | €990/day | Generous headroom — at highest cost; justify carefully |

### Lot Sizing Policy

| Lot Size | Changeovers/Week | Yield Loss | Setup Cost (8 wks) | Implication |
|---|---|---|---|---|
| **Small** | 14/week | 8% loss | €89,600 total | Maximum flexibility, highest waste and setup cost |
| **Medium** | 7/week | 4% loss | €44,800 total | Balanced — typical for multi-SKU apparel |
| **Large** | 3/week | 2% loss | €19,200 total | Low waste, low setup cost — less flexibility |

**Yield Loss Adjustment Formula:**

\`\`\`
Planned Production = Demand Target ÷ (1 − Yield Loss %)
Example: Week 4 demand = 8,800 units, Medium lot (4% loss):
  8,800 ÷ 0.96 ≈ 9,167 planned units
\`\`\`

### S&OP Strategy Options

| Strategy | What It Means | Risk Profile |
|---|---|---|
| **Chase** | Produce exactly to demand each week | Any disruption day causes stockouts; no buffer |
| **Level** | Constant amount every week | Inventory builds in low-demand weeks; overstock risk in Weeks 7–8 |
| **Hybrid** | Above demand early, taper in final weeks | Most common in fast fashion — balances service and markdown risk |

✍️ **Enter Your S&OP Plan in the Simulation**

After entering, check the Visual S&OP Dashboard — does inventory stay above zero? Does it spike too high in Week 8?

---

## STEP 4 — Interpret the Master Production Schedule (MPS)

After you enter your S&OP plan, the simulation generates a Master Production Schedule. You do not calculate this manually — you read and interpret it. The MPS is the bridge between your aggregate plan and the material/capacity planning that follows.

| MPS Concept | What It Tells You | Question to Ask |
|---|---|---|
| Planned Build — SKU A | How many Trend Tees the factory plans to complete each week | Does this match your S&OP target, or did capacity constraints reduce it? |
| Planned Build — SKU B | How many Core Joggers the factory plans to complete each week | Which week has the largest gap between S&OP target and MPS output? |
| Total Weekly Build | Combined output of both SKUs | Does total build meet total demand in each week? |
| Cumulative Build | Running total of planned production | Is cumulative production tracking ahead of cumulative demand? |

💡 **If the MPS shows lower production than your S&OP plan in Weeks 3–5**, what is causing the reduction — capacity, disruption probability, or yield loss? The MPS is deterministic; actual simulation will vary randomly around this plan.

---

## STEP 5 — Read the MRP Material Outputs

The simulation generates MRP planning outputs for all key materials. Interpret whether timing works and which materials are at risk.

| Material | Lead Time | Planning Risk | What to Watch For |
|---|---|---|---|
| Cotton knit fabric | 21 days | HIGH | If Week 1 production is before Day 21, material may not be on hand |
| Nylon-spandex fabric | 18 days | MEDIUM-HIGH | Verify scheduled receipts cover Week 1–2 needs |
| Trim / label kit | 7 days | LOW | Flexible; local supplier |
| Packaging kit | 5 days | LOW | Most responsive material |
| Waistband / accessory kit | 10 days | MEDIUM | Watch for SKU B-heavy weeks |

### The 'Need → Release' Logic (Required in Your Justification)

For two MRP examples (one SKU A, one SKU B), show this reasoning:

1. Identify the week when material is **NEEDED** (the production week)
2. Apply the lead time: Release Week = Need Week − lead time in weeks (round up)
3. Check: does that Release Week fall within the simulation horizon?
4. State: *"Week 4 needs cotton for 6,000 SKU A units. Cotton lead time = 21 days = 3 weeks. Order must be released by Week 1 at the latest."*

---

## STEP 6 — Capacity Load Report: Identify the Bottleneck

The simulation generates a Capacity Load Report showing required standard minutes vs available capacity for each work center. Your job: **identify the bottleneck and decide whether to address it** (Decision 3 in the simulation).

### Work Center Reference Data (SAM Table)

| Work Center | Available (std min/day) | Available/Week (×7) | SKU A SAM (min/unit) | SKU B SAM (min/unit) |
|---|---|---|---|---|
| **Cutting** | 1,500 | 10,500 | 0.8 min | 1.1 min |
| **Dyeing/Finishing** | 1,400 | 9,800 | 0.7 min | 1.0 min |
| **Sewing** | 3,100 | 21,700 | 3.2 min | 4.8 min |
| **Packaging** | 1,100 | 7,700 | 0.5 min | 0.7 min |

### How to Calculate Required Minutes

\`\`\`
Required Minutes = (SKU A units × SAM_A) + (SKU B units × SAM_B)

Example — Week 4, Sewing, if you plan 6,000 SKU A and 2,800 SKU B:
  Required = (6,000 × 3.2) + (2,800 × 4.8) = 19,200 + 13,440 = 32,640 minutes
  Available = 21,700 minutes/week
  Utilization = 32,640 ÷ 21,700 × 100 = 150.4% — CRITICAL OVERLOAD
\`\`\`

💡 **Think About This**
- After completing the worksheet: which work center has the highest utilization in Week 4?
- SKU B requires 4.8 min/unit of sewing vs SKU A's 3.2 min/unit. If you shift more volume toward SKU B, what happens to sewing load?
- If no work center exceeds 100%, choosing "No improvement" is the **correct** decision — spending on unnecessary capacity improvement is penalized.

**Bottleneck Worksheet (fill in for your peak week):**

| Work Center | Required Min | Available Min/Week | Utilization % | Bottleneck? |
|---|---|---|---|---|
| Cutting | _________ | 10,500 | _________ | _________ |
| Dyeing/Finishing | _________ | 9,800 | _________ | _________ |
| Sewing | _________ | 21,700 | _________ | _________ |
| Packaging | _________ | 7,700 | _________ | _________ |

---

## STEP 7 — Improvement Decisions: Capacity, Training, Layout & Lean

### 7A — Capacity Improvement: Modify or Buy?

If your bottleneck is critical (utilization consistently above 95–100%), you can choose to improve it. Only ONE work center can be improved.

| Work Center | Option A: Modify (+20%) | Cost | Option B: New Equipment (+45–50%) | Cost |
|---|---|---|---|---|
| **Cutting** | Auto-spreader / blade optimization | €18,000 | Additional cutting table | €42,000 |
| **Dyeing/Finishing** | Batch controller / process upgrade | €26,000 | Additional dye vessel / line | €65,000 |
| **Sewing** | Line balancing aids + attachments | €22,000 | New sewing module | €95,000 |
| **Packaging** | Conveyor / scanner improvement | €14,000 | Additional packing line | €30,000 |

💡 **Calculate: how many additional minutes per week do you need to close the gap?**
- Does +20% close it, or do you need +45–50%?
- Modification: cheaper and faster. New line: major investment. Consider ROI within 8 weeks.

### 7B — Workforce Training: Green Belt or Black Belt?

Current scrap/rework rates: **SKU A = 4.5%**, **SKU B = 5.5%**. Training reduces these losses.

| Training Option | Investment | Scrap Reduction | Rework Reduction | Setup Loss Reduction |
|---|---|---|---|---|
| No formal training | €0 | None | None | None |
| Six Sigma Green Belt (team training) | €7,500 | ↓ 20% | ↓ 15% | ↓ 5% |
| Six Sigma Black Belt (improvement project) | €16,000 | ↓ 35% | ↓ 25% | ↓ 8% |

**Effect in simulation:** Training reduces both the intrinsic scrap/rework cost KPI and the effective yield loss during production. Check your **Scrap/Rework Cost** KPI after a practice run.

### 7C — Layout & Flow Decision

| Choice | Option 1 | Option 2 | Key Factor |
|---|---|---|---|
| **Factory Layout** | Functional layout (shared equipment by function) | Product layout (dedicated lines per SKU) | Two SKUs + volatile demand + shared resources |
| **Flow Model** | Cellular manufacturing (mini-lines per family) | Traditional batch production | Changeover frequency + WIP reduction goals |

**Changeover effects by layout/flow combination:**

| Layout + Flow | Effective Changeover Cost |
|---|---|
| Functional + Cellular | 20% fewer effective changeovers (best for multi-SKU flexibility) |
| Functional + Batch | Baseline |
| Product + Cellular | 10% fewer changeovers |
| Product + Batch | 10% more changeovers (less flexible) |

### 7D — Lean & Quality-at-Source Initiatives

| Lean Initiative | Investment | Primary Effect | Best Used When... |
|---|---|---|---|
| No lean initiative | €0 | None | Baseline costs apply |
| 5S + Visual Management | €3,000 | Motion/search losses ↓5% (holding factor 0.97) | Factory organization is poor |
| Poka-Yoke devices | €6,500 | Sewing/packing defects ↓25% | Defect rate is the main quality problem |
| Andon lights | €4,500 | Downtime ↓8%; faster disruption recovery | Machine downtime is frequent |
| Poka-Yoke + Andon bundle | €10,000 | Best combined quality-at-source improvement | Both defects AND downtime are significant |
| Lean Flow Package (Kanban + Standard Work + Visual Control) | €12,000 | WIP ↓25%, Cycle time ↓10% (holding factor 0.75) | WIP is high between work centers |

**Andon note:** On disruption days, Andon lights improve recovery — production drops less than the baseline 50% reduction.

---

## STEP 8 — Practice Runs & KPI Interpretation

Run at least three practice scenarios with different decision combinations. Study every KPI before changing anything.

| KPI | Investigation Question | Lever to Pull |
|---|---|---|
| Service Level < 92% | Is capacity the constraint, or did disruption days hit hard? | Increase safety stock DOS or capacity mode; front-load more production |
| Cost well above target | Which cost category is largest? Capacity, holding, or penalties? | Reduce capacity mode if utilization is low; reduce SS if holding cost dominates |
| High Markdown Cost | How much excess inventory remains at Day 56? Which SKU? | Reduce Week 7–8 production targets; use hybrid S&OP strategy |
| High Changeover Cost | How many changeovers occurred? Is lot size too small? | Switch from Small to Medium or Large lot sizing |
| Low Utilization (<70%) | Are you over-investing in capacity? | Consider dropping to a lower capacity mode |
| Bottleneck still limiting | Did your capacity improvement actually solve the constraint? | Check: was the right work center improved? Did a second bottleneck emerge? |

### Cost Targets — What the Engine Compares Against

| Capacity Mode | Target Total Cost (8 weeks) |
|---|---|
| Standard | ≈ €65,000 |
| Overtime | ≈ €80,000 |
| Two-Shift | ≈ €100,000 |

**Note:** In v3, total cost includes your investment costs (training + lean + capacity improvement). This is added to operating costs. Use the "Cost vs Target %" KPI to track your position.

⚠️ **The Core Trade-off:** Service level and cost efficiency are equally weighted (10 pts each). Maximizing service at all costs by using Two-Shift + 9 DOS + every improvement will push total cost far above the target, collapsing your cost score even if service is 99%. The engine rewards balance.

---

## STEP 9 — Final Submission: Checklist & Justification

✅ All 8 weeks of S&OP production targets entered for SKU A and SKU B
✅ Capacity mode selected (Standard / Overtime / Two-Shift)
✅ Lot sizing policy selected (Small / Medium / Large)
✅ Priority rule selected (Priority A / Priority B / Balanced)
✅ Safety stock selected (3 DOS / 6 DOS / 9 DOS)
✅ **Bottleneck improvement selected** (No improvement / Modify / Buy new — specify work center)
✅ **Training choice selected** (None / Green Belt / Black Belt)
✅ **Layout choice selected** (Functional / Product)
✅ **Flow choice selected** (Cellular / Batch)
✅ **Lean initiative selected** (one of the six options)
✅ Justification written — minimum 500 characters — covers all areas below
✅ At least 3 practice runs completed before final submission

---

## Grading Rubric (55 Points — v3)

### Category 1 — Performance Outcomes (20 pts)

**Service Level (10 pts):**

| Service Level | Points |
|---|---|
| ≥ 98% | 10 |
| ≥ 95% | 8 |
| ≥ 92% | 7 |
| < 92% | 5 |

**Cost Efficiency (10 pts):** Scored vs target cost for your chosen capacity mode.

| Cost vs Target | Points |
|---|---|
| Within 5% | 10 |
| Within 10% | 8 |
| Within 15% | 7 |
| Over 15% | 5 |

### Category 2 — S&OP / MPS Plan Quality (10 pts)

Compares your total planned production to expected baseline demand over 56 days. Scored on planning quality, not random demand outcomes.

| Plan vs Expected Demand | Points |
|---|---|
| Within ±5% | 10 |
| Within ±10% | 8 |
| Outside ±10% | 6 |

### Category 3 — Bottleneck & Capacity Decision (10 pts)

Scored on whether you correctly identified the true bottleneck work center and chose an appropriate improvement response.

| Decision | Points |
|---|---|
| No improvement chosen + all WC utilization ≤ 90% (correct — no critical bottleneck) | 10 |
| Correct bottleneck identified, proportionate improvement chosen | 10 |
| Correct bottleneck identified, over-invested (bought new when modification sufficed) | 7 |
| Close miss — within 10% of true bottleneck | 6 |
| No improvement chosen + bottleneck utilization 90–100% (debatable) | 6 |
| Wrong work center improved | 3 |
| No improvement chosen + critical bottleneck (>100% util) missed | 2 |

🔍 **How to ensure a good score:** Complete the bottleneck worksheet in Step 6 before selecting your improvement option. The simulation shows work-center utilization in the KPI dashboard after practice runs.

### Category 4 — Lean · Quality · Layout Decision Quality (10 pts)

Scored on whether your combination of training, layout, flow, and lean choices makes logical sense for a fast-fashion, multi-SKU, shared-equipment environment.

| Decision Area | Full Points Criteria |
|---|---|
| Layout choice (2 pts) | Choice is consistent with the demand mix, SKU variety, and equipment-sharing context |
| Flow model (2 pts) | Choice supports changeover flexibility and WIP reduction goals |
| Training choice (3 pts) | Investment level is proportional to the severity of scrap/rework losses shown in KPIs |
| Lean initiative (3 pts) | Lean option targets the specific operational problem revealed in KPIs |

### Category 5 — Justification & Completeness (5 pts)

| Justification Length | Points |
|---|---|
| ≥ 500 characters (~70–80 words) | 5 |
| ≥ 300 characters | 4 |
| < 300 characters | 2 |

Your justification should cover: S&OP strategy choice, bottleneck analysis and improvement rationale, training/lean investment reasoning, M1 context integration, and two MRP "need → release" examples.

### Letter Grade Mapping

| Grade | Points | Profile |
|---|---|---|
| **A** | ≥ 50 / 55 | Strong service + cost control + correct bottleneck + sensible improvements + well-justified |
| **B** | ≥ 44 / 55 | Good performance with minor weakness in one category |
| **C** | ≥ 38 / 55 | Acceptable outcomes but bottleneck misidentified or improvements unjustified |
| **D** | < 38 / 55 | Significant failures in service, cost, or decision logic |

---

## How Module 2 Connects to Module 3

| Your M2 Decision | Impact on Module 3 |
|---|---|
| Service level achieved | Low M2 service = wider lead time range in M3 |
| High markdown from overproduction | Reduces your starting margin for Module 3 distribution investment decisions |
| Training/lean investments | Signals your quality posture — used in M3 distribution reliability assumptions |
| Capacity mode + bottleneck response | Sets production reliability context that M3 inventory policy must buffer against |

---

*"Fast fashion does not forgive waste — not wasted fabric, not wasted capacity, not wasted inventory. If your operation is disciplined here at Porto, everything downstream runs cleanly. If it isn't, Module 3 will show you exactly where the pain travels."*
— **Sofia Costa, CSCO**

---

*Module 2 Student Guidebook — Veloce Wear SCM Simulation (v3)*
`;
