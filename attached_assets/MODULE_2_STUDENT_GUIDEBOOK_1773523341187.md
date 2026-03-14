# Ultimate Student Guide — Module 2 (55 pts)
## Veloce Wear Simulation: Operations Planning (S&OP + MRP + Factory Flow)

---

## 0) Scenario (Your Role)

You are the **Operations Planning Manager** at **Veloce Wear's Porto Manufacturing Campus (Portugal)**. Veloce Wear competes like a Zara-style brand: **fast product refresh, high perceived quality, short cycles, and tight inventory discipline**.

Your job in Module 2 is to take what you did in **Module 1** (forecast + inbound reliability context) and create an **8-week production plan** that balances:

- **Service** (avoid stockouts / missed demand)
- **Cost** (capacity + holding + setups + penalties)
- **Markdown risk** (don't finish the horizon with excess inventory)

You will run practice simulations, learn from dashboards, then submit one final plan (which locks the module).

---

## 1) What Module 2 Automatically Imports From Module 1

The simulation pulls key Module 1 KPIs (from your final submission), including:

- **Forecast A (monthly units)** and **Forecast B (monthly units)**
- **Average reliability (%)** — used to trigger "material disruption days" during the simulation
- **Average lead time** — shown to you for planning context

If anything is missing, the system uses safe defaults so the simulation can still run. You'll see an alert at the top of the Module 2 page showing your M1 data.

---

## 2) What You Decide in Module 2 (Your Inputs)

You will submit decisions for an **8-week planning horizon** (56 days total).

### A) 8-Week S&OP Plan (Weekly Production Targets)

For each week (1–8), you enter:
- **SKU A weekly production (units)**
- **SKU B weekly production (units)**

The engine converts your weekly totals into daily targets automatically (divides by 7).

### B) Capacity Mode (Choose 1)

These are the actual engine capacity levels. Your weekly production plan must fit within these limits.

| Mode | Daily Capacity (units/day) | Weekly Capacity (units/week) | Daily Cost (€) |
|------|---------------------------|------------------------------|----------------|
| **Standard** | 800 | 5,600 | €480 |
| **Overtime** | 1,050 | 7,350 | €680 |
| **Two-Shift** | 1,500 | 10,500 | €990 |

**How to think about capacity choice:** If your total weekly production plan (A + B combined) regularly exceeds the weekly capacity, the engine **rations production** according to your priority rule. This means some demand goes unmet → stockouts → service level drops.

### C) Lot Sizing Policy (Choose 1)

Lot sizing affects **yield loss** (scrap during production) and **changeover frequency**:

| Lot Size | Changeovers/Week | Yield Loss Rate | Changeover Cost |
|----------|------------------|-----------------|-----------------|
| **Small** | 14 | 8% | 14 × €800 = €11,200/week |
| **Medium** | 7 | 4% | 7 × €800 = €5,600/week |
| **Large** | 3 | 2% | 3 × €800 = €2,400/week |

**The trade-off:** Small lots give flexibility (many product switches) but lose 8% of planned output and cost more in changeovers. Large lots are efficient (only 2% loss) but less flexible.

### D) Priority Rule (Choose 1)

When capacity binds (total planned > daily capacity), which SKU gets produced first?

- **Priority A** — SKU A gets produced up to plan; B gets whatever capacity remains
- **Priority B** — SKU B gets produced first; A gets the remainder
- **Balanced** — Both are scaled down proportionally

### E) Safety Stock Policy (Choose 1)

Safety stock is defined in **Days of Supply (DOS)**:

| Policy | What It Means |
|--------|---------------|
| **3 DOS** | Initial inventory covers ~3 days of average demand. Lean but risky. |
| **6 DOS** | Covers ~6 days. Good buffer for moderate uncertainty. |
| **9 DOS** | Covers ~9 days. Maximum protection, but ties up inventory. |

The engine computes your starting inventory based on the DOS you choose multiplied by the average daily demand.

### F) Final Justification (Required for Final Submission)

Your write-up should cover:

1. Your **S&OP strategy** — are you using level production (same each week), chase (following demand), or a hybrid?
2. **Why your capacity mode fits** your plan + the uncertainty level
3. **Why your lot size makes sense** (efficiency vs flexibility trade-off)
4. **Two MRP "need → release" examples** — one for SKU A, one for SKU B (see Section 7 for format)

---

## 3) How Demand and Uncertainty Work (Plan Like a Pro)

### A) Demand Is Stochastic (Not Fixed)

Daily demand is randomly generated from a Normal distribution centered on your Module 1 monthly forecast:

- **baseline_A = Forecast_A / 30** (your M1 forecast converted to daily)
- **baseline_B = Forecast_B / 30**
- Daily demand noise: **SKU A uses σ ≈ 15% of baseline_A**, **SKU B uses σ ≈ 10% of baseline_B**

This means actual demand varies day-to-day. You should plan **buffers** (safety stock + slight overproduction) and avoid razor-thin capacity utilization.

### B) Reliability-Driven Disruption Days

Your Module 1 reliability score determines whether any given day experiences a **material disruption**. On disruption days, planned production is cut to **50%** (simulating material shortage).

**Example:** If your M1 reliability was 95%, roughly 5% of the 56 days (~3 days) will have disrupted production. With 88% reliability (offshore-heavy M1), ~7 days are disrupted.

**Planning implication:** Lower M1 reliability → you need more safety stock or capacity headroom to compensate.

---

## 4) Step-by-Step: How to Build Your 8-Week Plan

This is the recommended workflow. Follow these steps in order.

### Step 1: Calculate Your Weekly Demand Baseline

Take your M1 forecasts and convert to weekly demand:

```
Weekly demand_A = (Forecast_A / 30) × 7
Weekly demand_B = (Forecast_B / 30) × 7
Total weekly demand = demand_A + demand_B

MY CALCULATION:
  Forecast_A from M1 = _______ units/month
  Weekly demand_A = (_______ / 30) × 7 = _______ units/week
  
  Forecast_B from M1 = _______ units/month
  Weekly demand_B = (_______ / 30) × 7 = _______ units/week
  
  Total weekly demand = _______ + _______ = _______ units/week
```

**Example (illustrative only — use YOUR M1 numbers):**
If Forecast_A = 18,000 and Forecast_B = 9,000:
```
Weekly demand_A = (18,000 / 30) × 7 = 4,200 units/week
Weekly demand_B = (9,000 / 30) × 7 = 2,100 units/week
Total = 6,300 units/week
```

### Step 2: Compare Demand to Capacity

Now compare your total weekly demand to the available capacity:

```
MY COMPARISON:
  My total weekly demand: _______ units/week

  Standard weekly capacity:  5,600 → Demand is ___% of capacity
  Overtime weekly capacity:  7,350 → Demand is ___% of capacity
  Two-Shift weekly capacity: 10,500 → Demand is ___% of capacity
```

**What to look for:**
- If demand > capacity → you'll have **rationing** (stockouts likely)
- If demand is 80–95% of capacity → you're in the **sweet spot** (efficient but not overloaded)
- If demand < 60% of capacity → you're **paying for idle capacity** (cost penalty)

**Example (continuing the 6,300/week illustration):**
```
Standard:  6,300 / 5,600 = 113% → OVER CAPACITY (will ration!)
Overtime:  6,300 / 7,350 = 86%  → SWEET SPOT
Two-Shift: 6,300 / 10,500 = 60% → Under-utilized (expensive)
```

### Step 3: Account for Yield Loss

Your lot sizing choice causes a **percentage of planned production to be lost**. So you need to plan slightly MORE than demand to account for this:

```
Adjusted weekly plan = Weekly demand / (1 - yield loss rate)

MY CALCULATION:
  Lot size chosen: _______ (loss rate: ___%)
  Adjusted A = _______ / (1 - ___) = _______ units/week
  Adjusted B = _______ / (1 - ___) = _______ units/week
  Total adjusted plan = _______ units/week
```

**Example (Medium lots, 4% loss):**
```
Adjusted A = 4,200 / 0.96 = 4,375 units/week
Adjusted B = 2,100 / 0.96 = 2,188 units/week
Total = 6,563 units/week
```

### Step 4: Decide Your S&OP Strategy Shape

How will your weekly targets vary across the 8 weeks?

| Strategy | Description | When to Use |
|----------|-------------|-------------|
| **Level** | Same production each week | Simple, stable demand, steady workforce |
| **Chase** | Vary production to match expected demand fluctuations | If you expect demand to ramp up or down |
| **Hybrid** | Mostly level, with slight front-loading or back-loading | Hedge against early disruptions; ramp down to avoid excess |

**Consider:**
- **Front-loading** (slightly higher in Weeks 1–4, lower in 5–8) builds a buffer against disruption days early. But excess at end → markdown.
- **Back-loading** (lower early, higher later) minimizes holding cost but leaves you vulnerable if disruptions happen early.
- **Level** (same each week) is simplest and often scores well.

### Step 5: Enter Your Weekly Targets

Fill in your plan:

```
| Week | SKU A Plan | SKU B Plan | Total | vs Weekly Capacity |
|------|-----------|-----------|-------|-------------------|
| 1    | _______   | _______   | _____ | ___% of capacity   |
| 2    | _______   | _______   | _____ | ___% of capacity   |
| 3    | _______   | _______   | _____ | ___% of capacity   |
| 4    | _______   | _______   | _____ | ___% of capacity   |
| 5    | _______   | _______   | _____ | ___% of capacity   |
| 6    | _______   | _______   | _____ | ___% of capacity   |
| 7    | _______   | _______   | _____ | ___% of capacity   |
| 8    | _______   | _______   | _____ | ___% of capacity   |
| TOTAL| _______   | _______   | _____ |                     |
```

**Check:** Does your total planned production approximately match 8 weeks of expected demand? The S&OP Quality score rewards plans within ±5% of the expected baseline.

### Step 6: Run Practice Simulations

Submit your plan as a **practice run** (unlimited, no grade impact). Review the KPI dashboard:

- **Service level < 92%?** → Increase production plan or switch to higher capacity mode
- **Capacity utilization < 70%?** → You're paying for idle capacity; consider Standard mode
- **Capacity utilization > 95%?** → You're at the edge; any disruption causes stockouts
- **High markdown cost?** → You're overproducing; reduce late-week production targets
- **High stockout cost?** → Increase safety stock DOS or front-load production

### Step 7: Refine and Finalize

Adjust based on practice results. Run 3–5 practice iterations. When you're satisfied, submit your final plan.

---

## 5) What the Dashboard Shows You (KPIs)

After each practice run, you'll see:

| KPI | What It Means | Target for Good Score |
|-----|---------------|----------------------|
| **Service Level (%)** | Demand met / Total demand | ≥ 95% for 13 pts, ≥ 98% for 15 pts |
| **Total Cost** | Capacity + holding + changeover + stockout + markdown | Within ~5% of target for your capacity mode |
| **Capacity Utilization (%)** | Production / Available capacity | 80–95% sweet spot |
| **Stockouts (A and B)** | Units of unmet demand | Lower is better |
| **Ending Inventory** | Units remaining at Day 56 | Above safety stock = ok; way above = markdown risk |
| **Markdown Cost** | Penalty for excess ending inventory above target | Lower is better |

**Key cost parameters used by the engine:**

| Cost Element | Rate |
|-------------|------|
| Holding cost | €0.15 per unit per day |
| Stockout penalty | €5.00 per unmet unit |
| Markdown cost | €12.00 per excess unit above target ending inventory |
| Changeover cost | €800 per changeover |

---

## 6) Grading Rubric (55 Points)

This is the **exact rubric** the engine uses. Study it before you start.

### Performance — Service Level (15 pts)

| Service Level | Points |
|--------------|--------|
| ≥ 98% | 15 |
| ≥ 95% | 13 |
| ≥ 92% | 11 |
| < 92% | 8 |

### Performance — Cost Efficiency (15 pts)

Scored by your total cost relative to a **target cost** for your chosen capacity mode. The closer to target (or below), the higher your score.

| Cost vs Target | Points |
|---------------|--------|
| Within 5% | 15 |
| Within 10% | 13 |
| Within 15% | 11 |
| Over 15% | 8 |

### S&OP Quality (10 pts)

Compares your **total planned production** (sum of all 8 weeks, both SKUs) to the **expected baseline demand** over 56 days. This uses the expected baseline, NOT the random stochastic demand — so you're graded on planning quality, not luck.

| Plan vs Expected Demand | Points |
|------------------------|--------|
| Within ±5% | 10 |
| Within ±10% | 8 |
| Outside ±10% | 6 |

### MRP Logic / Capacity Utilization (8 pts)

Rewards a plan that achieves realistic capacity utilization — neither idle nor reckless.

| Capacity Utilization | Points |
|---------------------|--------|
| 80–95% | 8 |
| 70–80% or 95–100% | 6 |
| Outside these ranges | 4 |

### Justification Quality (5 pts)

Auto-scored by length (character count):

| Justification Length | Points |
|---------------------|--------|
| ≥ 500 characters (~80+ words) | 5 |
| ≥ 300 characters (~50+ words) | 4 |
| < 300 characters | 2 |

Note: A well-written paragraph of 100+ words easily clears the maximum. Focus on **quality and depth**, not word count.

### Validity (2 pts)

Starts at 2 points. Loses 0.5 per week where your total weekly plan exceeds weekly capacity by more than 30%. If you stay within reasonable bounds, you keep full marks.

### Letter Grade Mapping

| Points | Grade |
|--------|-------|
| ≥ 50 | A |
| ≥ 44 | B |
| ≥ 38 | C |
| < 38 | D |

---

## 7) What to Include in Your MRP Examples (Required in Justification)

Your justification must include **two MRP "need → release" examples** — one for SKU A and one for SKU B. Use this structure with YOUR numbers:

### MRP Example Template

```
SKU: _______ (A or B)
Week: _______ (pick one week from your plan)

1) NEED: In Week ___, I plan to produce _______ units of SKU ___.

2) MATERIAL REQUIREMENT: 
   _______ units × _______ kg/unit × _______ scrap factor = _______ kg of _______ (cotton/nylon)

3) LEAD TIME: My M1 supplier lead time is approximately _______ days.

4) RELEASE TIMING:
   To have materials arrive by Week ___ (Day ___), 
   I need to release the order by Day ___ (_______ days earlier).

5) BUFFER: My safety stock of ___ DOS provides _______ units of protection 
   against demand variability and disruption days.
```

**Example (illustrative — use YOUR numbers):**
```
SKU: A (Trend Tee)
Week: 3

1) NEED: In Week 3, I plan to produce 4,375 units of SKU A.

2) MATERIAL REQUIREMENT:
   4,375 units × 0.23 kg/unit × 1.06 scrap = 1,067 kg cotton

3) LEAD TIME: My M1 primary supplier (PT2) has avg lead time of 6 days.

4) RELEASE TIMING:
   Week 3 starts on Day 15. I need materials by Day 15.
   Release order by Day 9 (6 days earlier).

5) BUFFER: My 6 DOS safety stock provides ~3,570 units of protection.
   This covers ~1 disruption day + demand variability.
```

---

## 8) The Visual S&OP Planner (Interactive Chart)

Module 2 includes a **Visual S&OP Dashboard** (React/Recharts) that updates in real-time as you type your weekly targets:

- **Blue bars** = your planned production per week (A + B combined)
- **Red dashed line** = weekly capacity limit for your chosen mode
- **Red bars** (if any) = over-capacity amount

**How to use it:**
1. Enter your weekly targets in the form
2. Watch the chart update instantly
3. If any blue bar exceeds the red line, you're over capacity that week → the engine will ration production
4. Adjust your plan until bars are comfortably below the line

---

## 9) Final Submission Checklist

Before clicking **Submit Final:**

- [ ] All 8 weeks entered for both SKU A and SKU B
- [ ] Capacity mode selected (and I checked my plan fits within weekly capacity)
- [ ] Lot size selected (and I understand the yield loss impact)
- [ ] Priority rule selected
- [ ] Safety stock DOS selected
- [ ] Total planned production is within ±5–10% of expected 56-day demand
- [ ] Capacity utilization is in the 80–95% range (check KPI dashboard)
- [ ] Justification completed with S&OP strategy, capacity reasoning, lot size reasoning
- [ ] Two MRP "need → release" examples included (one A, one B)
- [ ] At least 3 practice runs completed and reviewed
- [ ] Service level ≥ 95% in my best practice run

---

*Module 2 Student Guidebook — Veloce Wear SCM Simulation*
