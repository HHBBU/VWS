export const module3Guide = `# Service Promise Under Pressure — Distribution Strategy
## Module 3 Ultimate Student Guidebook (55 points)

**Distribution Network, Inventory Policy & Service Strategy**

---

## Scenario (Your Role)

Welcome to **Module 3**, the final stage of the Veloce Wear simulation.

You are now the **VP of Global Fulfillment**. Manufacturing is complete at **Porto, Portugal**, and finished goods must reach **420 stores** across three regions:

- **Western Europe (EU):** 200 stores (45% of footprint)
- **USA & Canada (NA):** 140 stores (40%)
- **APAC (Select Cities):** 80 stores (15%)

Veloce Wear is a **Zara-like fast fashion brand** competing on speed (freshness and rapid replenishment), availability (avoid stockouts/lost sales), cost discipline, and sustainability (carbon matters).

**Your mission:** Design a distribution strategy that answers:

1. **Network strategy:** How many DCs do we operate (centralized vs hybrid vs decentralized)?
2. **Inventory policy (ROP/Q):** When do we reorder and how much?
3. **Service mode:** Standard vs Express vs Mixed (speed vs carbon vs cost).
4. **Uncertainty readiness:** Demand is stochastic (random), and lead times vary.

**Important realism:** Even if your plan looks perfect, randomness can create stockouts. Your job is to build a strategy that performs well **under variability** — not just under averages.

---

## 1) What You'll Do (High Level)

1. Review global market footprint and service expectations
2. Choose a **network strategy** (Centralized / Hybrid / Decentralized)
3. Choose a **service mode** (Standard / Express / Mixed)
4. Set **ROP** (reorder point) and **Q** (order quantity) using a structured approach
5. Use the **Interactive ROP/Q Visualizer** to validate your policy before running the simulation
6. Run practice simulations, interpret KPIs, improve, then submit final

You have unlimited practice runs. Only the **final submission** counts.

---

## 2) What Carries Forward From Modules 1 & 2

### From Module 1

The simulation uses your M1 forecasts to calculate the **daily demand baseline**:

\`\`\`
Daily demand average = (M1_Forecast_A + M1_Forecast_B) / 30
\`\`\`

Higher M1 forecasts → higher baseline demand → you need more inventory to maintain service.

### From Module 2 (NEW — Opus 4.6 Fix)

**Your M2 service level now affects M3 lead time variability.** This is real supply chain cascading:

- High M2 service (≥98%) → reliable production → stable replenishment lead times
- Low M2 service (<92%) → production disruptions → lead times can stretch up to 40% longer

If your M2 service was poor, you'll need higher ROP or more DCs to compensate for the wider lead time variability.

---

## 3) Market Footprint and Store Locations

| Region | # Stores | Demand Share | Trend Sensitivity | Service Expectation |
|--------|----------|-------------|-------------------|---------------------|
| Western Europe (EU) | 200 | 45% | Medium | High |
| USA & Canada (NA) | 140 | 40% | High | Very High |
| APAC (Select Cities) | 80 | 15% | High | High |

**Flagship cities (use in justification):**
- **EU:** Paris, London, Madrid, Milan, Berlin, Amsterdam, Lisbon, Zurich
- **NA:** New York, Los Angeles, Chicago, Dallas, Miami, Toronto, Vancouver, Montréal
- **APAC:** Tokyo, Seoul, Singapore, Sydney, Shanghai, Hong Kong

---

## 4) Your Decisions in the App

You will enter:

1. **Network Strategy** (choose one): Centralized / Hybrid / Decentralized
2. **ROP** (Reorder Point) — when you trigger replenishment
3. **Q** (Order Quantity) — how much you order each time
4. **Service Mode** (choose one): Standard / Express / Mixed
5. **Forecast Method** (label for your approach)
6. **Justification text** (required for final)

---

## 5) Network Strategy Options (Engine Data)

| Strategy | DCs | Weekly DC Cost | Transport Cost/Unit | Lead Time Range | Carbon/Unit |
|----------|-----|---------------|--------------------|-----------------| ------------|
| **Centralized** | 1 (Porto) | €0 | €0.18 | 5–10 days | 1.5 kg |
| **Hybrid** | 2 (Porto + NA) | €22,000/week | €0.22 | 3–7 days | 1.0 kg |
| **Decentralized** | 3 (Porto + NA + APAC) | €40,000/week | €0.24 | 1–4 days | 0.8 kg |

**Key trade-off:** More DCs → faster lead times + better fill rate potential → but higher fixed cost and slightly higher per-unit transport cost.

**Note:** Lead times shown are BASE ranges. If your M2 service level was low, the engine may stretch the maximum lead time further (see Section 2).

---

## 6) Service Mode Options (Engine Data)

| Mode | Cost/Unit | Transit Days | Carbon Multiplier |
|------|-----------|-------------|-------------------|
| **Standard** | €0.75 | 5 | 1.0× |
| **Express** | €1.10 | 2 | 2.5× |
| **Mixed** | €0.90 | 3 | 1.5× |

---

## 7) Cost Parameters (Engine Data)

These costs accumulate during the 90-day simulation:

| Cost Element | Rate |
|-------------|------|
| **Holding cost** | €0.10 per unit per day (inventory on hand) |
| **Stockout penalty** | €8.00 per unit of unmet demand (lost sales) |
| **Carbon tax** | €0.05 per kg of carbon emitted |
| **Transport cost** | Per unit, depends on network strategy (see table above) |
| **DC operating cost** | Per week, depends on network strategy (see table above) |
| **Shipping cost** | Per unit, depends on service mode (see table above) |

---

## 8) Step-by-Step: How to Set Your ROP and Q

This is the most important analytical step in Module 3. Follow this process, then validate with the visualizer.

### Step 1: Estimate Your Daily Demand Baseline

\`\`\`
Daily demand = (M1_Forecast_A + M1_Forecast_B) / 30

MY CALCULATION:
  M1 Forecast A = _______ units/month
  M1 Forecast B = _______ units/month
  Total monthly = _______ units
  Daily demand = _______ / 30 = _______ units/day
\`\`\`

**Example (illustrative — use YOUR M1 forecasts):**
If Forecast_A = 18,000 and Forecast_B = 9,000:
\`\`\`
Daily demand = (18,000 + 9,000) / 30 = 900 units/day
\`\`\`

### Step 2: Calculate Lead Time Demand

\`\`\`
Avg lead time = (lead_time_min + lead_time_max) / 2  (from your network choice)
Lead time demand = Daily demand × Avg lead time

MY CALCULATION:
  My network: _____________ 
  Lead time range: _____ to _____ days
  Avg lead time = (_____ + _____) / 2 = _____ days
  Lead time demand = _____ units/day × _____ days = _____ units
\`\`\`

**Example (Hybrid network):**
\`\`\`
Avg lead time = (3 + 7) / 2 = 5 days
Lead time demand = 900 × 5 = 4,500 units
\`\`\`

### Step 3: Estimate Your ROP

ROP should cover lead time demand **plus a safety buffer** for demand variability:

\`\`\`
ROP = Lead time demand + Safety buffer
Safety buffer = some fraction of lead time demand (typically 20–50%)

MY CALCULATION:
  Lead time demand = _______ units
  Safety buffer (I choose ____%) = _______ units
  My ROP = _______ + _______ = _______ units
\`\`\`

**Example (30% safety buffer):**
\`\`\`
ROP = 4,500 + (4,500 × 0.30) = 4,500 + 1,350 = 5,850 units
\`\`\`

**Reasoning:** The safety buffer protects against demand spikes and lead time variability. Higher uncertainty → higher buffer. Lower M2 service → higher buffer (lead times stretched).

### Step 4: Estimate Your Q

Q is how much you order each time. It balances ordering frequency vs holding cost:

\`\`\`
Think about: How many days of demand should each order cover?

Rule of thumb:
  - Q covering 5–7 days of demand = frequent orders, lower inventory risk
  - Q covering 10–15 days of demand = fewer orders, higher average inventory
  - Too small (<3 days) = constant reordering, handling overhead
  - Too large (>20 days) = inventory piles up, holding cost rises

MY CALCULATION:
  Daily demand = _______ units/day
  I want each order to cover approximately _____ days
  My Q = _______ × _____ = _______ units
\`\`\`

**Example (covering ~7 days):**
\`\`\`
Q = 900 × 7 = 6,300 units
\`\`\`

### Step 5: Validate with the Interactive ROP/Q Visualizer

**Before running the simulation,** enter your ROP and Q in the form and watch the **saw-tooth inventory chart** update:

- **Green line** = your inventory level over time
- **Red dashed line** = your ROP level
- **Saw-tooth pattern** = inventory drops (demand), then jumps back up (order arrives)

**What to look for:**

| Pattern | What It Means | Action |
|---------|--------------|--------|
| Green line hits zero | Stockouts likely | Increase ROP or Q |
| Huge teeth (big swings) | Very large orders, high holding cost | Reduce Q |
| Tiny teeth (frequent small orders) | Many orders, handling pressure | Increase Q |
| Green line stays far above red line | Excess inventory, high holding cost | Reduce ROP |
| Green line barely touches red line | Tight buffer, stockout risk | Increase ROP |

**Starting point (if unsure):** ROP ≈ 1,500, Q ≈ 3,000. Adjust from there based on the visualizer and practice run results.

### Step 6: Run Practice Simulations and Adjust

Run a practice, check the KPI dashboard, then adjust:

| KPI Result | Likely Cause | Fix |
|-----------|-------------|-----|
| Fill rate < 90% | ROP too low or Q too small | Increase ROP by 20% or Q by 30% |
| Fill rate > 98% but cost way over target | Over-stocked, expensive network | Try Centralized or reduce Q |
| High stockout cost | Demand spikes overwhelming your buffer | Increase ROP or switch to faster network |
| High holding cost | Too much inventory sitting idle | Reduce Q or reduce ROP |
| High carbon | Express mode + Decentralized | Switch to Standard or Mixed mode |
| Cost >25% above target | Wrong network/mode for the volume | Re-evaluate network choice |

---

## 9) What the Simulation Is Doing (Plain English)

- The engine generates **random daily demand** using a **Poisson distribution** around your baseline (~900 units/day with typical M1 forecasts).
- Lead times are random within your network's range (and stretched by M2 service level).
- When your **inventory position** (on-hand + pipeline orders) falls to or below ROP, the system places an order of Q units.
- Orders arrive after the random lead time.
- Stockouts are penalized at €8/unit; carbon is calculated and taxed at €0.05/kg.
- The simulation runs for **90 days**.

You don't need to code — your job is to plan intelligently.

---

## 10) KPIs You Will See

| KPI | What It Measures |
|-----|-----------------|
| **Fill Rate (%)** | Demand fulfilled / Total demand |
| **Total Cost (€)** | Holding + transport + DC + shipping + stockout + carbon tax |
| **Total Stockouts** | Units of unmet demand |
| **Carbon (kg)** | Total carbon footprint from transport and shipping |
| **Ending Inventory** | Units remaining at Day 90 |
| **Avg Daily Demand** | Realized average (for comparison to your baseline) |

---

## 11) Grading Rubric (55 Points — Engine Exact)

### Category 1 — Performance Outcomes (35 points)

**Fill Rate (max 20 pts):**

| Fill Rate | Points |
|-----------|--------|
| ≥ 94% | 20 |
| 90–93% | 17 |
| 85–89% | 14 |
| 80–84% | 10 |
| < 80% | 5 |

**Cost Efficiency (max 15 pts):** Based on your total cost vs the target cost for your network:

| Network | Target Cost |
|---------|------------|
| Centralized | €290,000 |
| Hybrid | €320,000 |
| Decentralized | €360,000 |

| Cost vs Target | Points |
|---------------|--------|
| Within 5% | 15 |
| Within 10% | 13 |
| Within 15% | 11 |
| Within 25% | 8 |
| Over 25% | 5 |

### Category 2 — Inventory Policy Logic (10 points)

The engine checks whether your ROP and Q are **reasonable** given the demand and lead times:
- ROP too low → deduction (up to −4)
- Q too small → deduction (up to −3)
- Q extremely large → deduction (up to −2)

If your ROP/Q are in a sensible range for your network and demand level, you keep all 10 points.

### Category 3 — Network Design Logic (5 points)

Rewards alignment between your network choice and your fill rate outcome:
- Hybrid or Decentralized + fill rate ≥ 90% → **5 pts** (best)
- Centralized + fill rate ≥ 90% → **4 pts** (works but not optimal)
- Centralized + fill rate < 85% → **2 pts** (poor choice for service target)
- Other combinations → **3 pts**

### Category 4 — Strategic Justification (3 points)

| Justification Length | Points |
|---------------------|--------|
| ≥ 400 characters (~60+ words) | 3 |
| 250–399 characters | 2 |
| < 250 characters | 1 |

Note: This is measured in **characters**. A well-written paragraph of 100+ words easily clears the maximum. Focus on quality: include forecast reasoning, ROP/Q logic, network rationale, and trade-off analysis.

### Category 5 — Validity & Completeness (2 points)

| Issue | Deduction |
|-------|-----------|
| ROP ≤ 0 or Q ≤ 0 | −1 |
| Q > 50,000 | −0.5 |

### Letter Grade Mapping

| Points | Grade |
|--------|-------|
| ≥ 50 | A |
| ≥ 44 | B |
| ≥ 38 | C |
| < 38 | D |

---

## 12) What to Include in Your Justification

Your justification should address:

1. **Network choice rationale:** Why did you pick Centralized/Hybrid/Decentralized? How does it serve EU/NA/APAC service expectations?
2. **ROP/Q logic:** How did you calculate your reorder point and order quantity? What buffer did you include and why?
3. **Service mode reasoning:** Why Standard/Express/Mixed? What's the cost-carbon-speed trade-off?
4. **M1/M2 integration:** How did your earlier module results (reliability, service level) influence your M3 decisions?
5. **Practice run evidence:** What KPIs did you see in practice? How did you adjust?
6. **Trade-off summary:** What did you sacrifice vs what did you prioritize? Why?

---

## 13) Final Submission Checklist

Before submitting final:

- [ ] I understand my daily demand baseline from M1 forecasts
- [ ] I chose a network strategy and can explain why
- [ ] I calculated ROP using lead time demand + safety buffer
- [ ] I calculated Q based on days-of-demand coverage
- [ ] I validated my ROP/Q using the Interactive Visualizer (no stockouts, reasonable teeth)
- [ ] I chose a service mode and understand the carbon/cost/speed trade-off
- [ ] I ran at least 2–3 practice simulations
- [ ] My best practice fill rate is ≥ 90% (target ≥ 94% for full marks)
- [ ] My total cost is within 10–15% of the target for my network
- [ ] My justification includes network rationale, ROP/Q logic, trade-offs, and KPI evidence
- [ ] ROP > 0 and Q > 0 (and Q < 50,000)

---

*Module 3 Student Guidebook — Veloce Wear SCM Simulation*
`;
