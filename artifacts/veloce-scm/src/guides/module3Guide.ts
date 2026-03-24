export const module3Guide = `# Module 3: Distribution, Inventory & Service Strategy
## Student Guidebook · 55 Points · Final Module

**SCM 4330: SCM Applications — Veloce Wear Simulation**

---

## 📧 Briefing from Sofia Costa — Director of Global Inventory & Replenishment

*From: Sofia Costa, Director of Global Inventory & Replenishment | Porto HQ*

Team —

Manufacturing is complete. Finished goods are staged at Porto. Now comes the moment that decides whether this collection succeeds in the market — how we get 420 stores across three continents replenished fast, reliably, and **profitably**.

You are now the **Director of Global Inventory & Replenishment**. Your job is to decide: how many distribution centers to operate, how fast to ship, when to reorder, and how much to order each time.

A word of warning: the biggest mistakes I see are students who maximize service level without looking at their profit margin, or who minimize cost without asking what happens when a stockout hits a flagship NYC store. **Veloce Wear wins on speed AND profitability.** Your strategy must deliver both.

Your Module 1 sourcing decisions and Module 2 production performance both shape what you are working with today. Check the cascade context before you decide anything. — *Sofia*

---

## How to Use This Guidebook

Every step follows a pattern:
- **🔍 INVESTIGATE** — where to look in the simulation or data tables
- **💡 THINK ABOUT THIS** — questions to guide your analysis before you decide
- **✍️ YOUR DECISION** — what you must calculate, enter, or submit

> ⚠️ You may run the simulation as many times as you like for practice — only your **Final Submission** is graded. Run at least 2–3 practice scenarios before committing.

---

## STEP 1 — The Cascade: What Your M1 & M2 Decisions Mean for Module 3

Module 3 does not start from scratch. Your decisions in Modules 1 and 2 created real constraints that affect what you are working with today.

**🔍 Open the Module 3 Context Panel in the Simulation**

Find your **M2 service level percentage** — this directly affects lead time variability in Module 3.

Find your **M1 forecast values** for SKU A and SKU B — these set the baseline demand your simulation uses.

If your M2 service level was below 92%, the simulation stretches your maximum lead time by up to 40% — your ROP must account for this.

| If Your M1/M2 Decision Was... | Then in Module 3... |
|-------------------------------|---------------------|
| High M1 quality/reliability suppliers | Your finished goods quality is better; fewer production disruptions |
| Low M2 service level (<92%) | Lead times in M3 are wider — your ROP needs a larger safety buffer |
| High M1 lead times (offshore-heavy) | Production was slower; tighter delivery windows remain |
| Strong M2 service level (≥98%) | Lead times behave as stated in the network table — no stretch penalty |

**💡 Think About This**

- What was your M2 service level? Is it above or below 92%? How much extra safety stock might you need to compensate?
- Your M1 forecasts (SKU A and SKU B) flow into the simulation's demand baseline. If your M1 forecast was significantly off, how does that affect your planning here?
- Sofia's email says "check the cascade context before you decide anything." What does this mean for the sequence of your decisions?

---

## STEP 2 — Market Footprint & Regional Strategy

Veloce Wear serves 420 stores across three regions. Each region has a different demand profile, service expectation, and strategic importance.

| Region | # Stores | Demand Share | Service Expectation | Volatility | Distance from Porto |
|--------|----------|-------------|---------------------|-----------|---------------------|
| Western Europe (EU) | 200 stores | 45% of demand | High | Medium — predictable seasonal patterns | Closest — shortest lead times |
| USA & Canada (NA) | 140 stores | 40% of demand | Very High — stockouts mean lost sales | High — trend-sensitive consumers | Medium — ocean or air depends on mode |
| APAC (Select Cities) | 80 stores | 15% of demand | High | High — volatile, trend-sensitive | Farthest — longest standard lead times |

**Flagship markets (use these to justify your decisions):**

- **EU:** Paris · London · Madrid · Milan · Berlin · Amsterdam · Lisbon · Zurich
- **NA:** New York · Los Angeles · Chicago · Dallas · Miami · Toronto · Vancouver · Montréal
- **APAC:** Tokyo · Seoul · Singapore · Sydney · Shanghai · Hong Kong

**💡 Think About This**

- NA represents 40% of demand with the highest service expectations. If you choose a Centralized network (Porto only), what is the average lead time to a New York store? Is that acceptable for a fast-fashion brand?
- EU is both the largest market (45%) and closest to Porto. How does this affect your base case?
- APAC has the longest lead times under all configurations. Given its 15% demand share, is the cost of a third DC justified?

---

## STEP 3 — Network Strategy: How Many Distribution Centers?

This is your first major decision. Choose between three network postures.

| Strategy | DCs Operated | Weekly DC Fixed Cost | Total DC Cost (90 days ≈ 13 wks) | Transport Cost/Unit | Lead Time Range | Carbon/Unit |
|----------|-------------|---------------------|----------------------------------|---------------------|-----------------|-------------|
| **Centralized** | 1 (Porto only) | €0 | €0 | €0.18 | 5–10 days* | 1.5 kg |
| **Hybrid** | 2 (Porto + NA DC) | €22,000 | €286,000 | €0.22 | 3–7 days* | 1.0 kg |
| **Decentralized** | 3 (Porto + NA + APAC) | €40,000 | €520,000 | €0.24 | 1–4 days* | 0.8 kg |

*Lead time range may be stretched if your M2 service level was below 92%. Check your context panel.*

**💡 Think About This**

- For Hybrid: the NA DC costs €286,000 over the simulation. Is that fixed cost justified if it means NA stores receive goods in 3–7 days instead of 5–10 days?
- Decentralized adds a third DC for APAC (15% of demand). Calculate: is the marginal cost proportional to APAC's demand share?
- Your network choice affects carbon. Fewer DCs means more transport distance per unit. How does carbon/unit interact with total volume?

**✍️ Select Your Network Strategy in the Simulation**

- Write down your rationale BEFORE running the simulation — you will need this for your justification
- Note the lead time range for your chosen strategy — you will use it in Step 6 to calculate ROP

---

## STEP 4 — Service Mode: Standard, Express, or Mixed?

Your service mode determines how finished goods move from DCs to stores.

| Mode | Shipping Cost/Unit | Mean Transit Time (L) | Lead Time Std Dev (σL) | Carbon Multiplier | Carbon Tax Impact |
|------|--------------------|----------------------|------------------------|-------------------|-------------------|
| **Standard** | €0.75 | 5 days | 1.5 days | 1.0× | Baseline |
| **Express** | €1.10 | 2 days | 0.8 days | 2.5× | 2.5× baseline — check your total cost |
| **Mixed** | €0.90 | 3 days | 1.0 days | 1.5× | 1.5× baseline |

> **Key Insight:** The transit time (L) you choose here flows directly into your Safety Stock and ROP calculations in Step 6. Shorter L = lower ROP needed = less safety stock = lower holding cost. Express mode is expensive per unit but may reduce your inventory investment.

**💡 Think About This**

- Calculate the shipping cost difference between Standard and Express for 1,000 units: (€1.10 − €0.75) × 1,000 = €350. Is that difference offset by needing less safety stock under Express?
- If you choose Express (L=2 days), you need a much smaller ROP than Standard (L=5 days). Calculate the carbon tax: assume 10,000 units shipped — what is the carbon cost difference at €0.05/kg?
- Mixed mode (L=3 days) is a compromise. Does it offer the best of both worlds, or a medium-bad outcome on both? When would Mixed be the right choice?

**✍️ Record for Step 6:**
- Your service mode: _______  
- Mean transit time L: _______ days  
- Lead time std dev σL: _______ days

---

## STEP 5 — Demand Analysis: Estimating Daily Demand & Variability

Before you can calculate EOQ, Safety Stock, and ROP, you must know how much demand to expect each day.

**🔍 Use the Context Panel and Historical Demand Data**

The simulation displays your M1 forecast values. Use these to estimate your daily demand baseline:

\`\`\`
Daily demand average = (M1_Forecast_A + M1_Forecast_B) / 30

Example (use YOUR M1 forecasts):
  M1 Forecast A = 17,800 units/month
  M1 Forecast B = 9,000 units/month
  Daily demand = (17,800 + 9,000) / 30 = 893 units/day
\`\`\`

You also need an estimate of daily demand standard deviation (σd) for your safety stock calculation. A reasonable approximation is σd ≈ 15% of average daily demand.

| Demand Parameter | SKU A (Trend Tee) | SKU B (Core Jogger) | Source |
|-----------------|-------------------|---------------------|--------|
| Mean daily demand (μd) | ~593 units/day* | ~300 units/day* | M1 Forecast ÷ 30 |
| Std dev daily demand (σd) | ≈ 90–110 units/day | ≈ 40–55 units/day | ≈ 15% of μd |

*Approximate values — your M1 forecasts may differ. Always use your own context panel values.*

**💡 Think About This**

- Why must you calculate demand separately for SKU A and SKU B? Would a single combined policy be appropriate, or would it systematically over/under-stock?
- Standard deviation measures unpredictability. If SKU A has higher σd than SKU B, what does that mean for how much safety stock each SKU needs?
- The simulation uses one combined ROP and Q. After calculating per-SKU values, you will sum them for your final inputs (see Step 6).

---

## STEP 6 — Inventory Calculations: EOQ, Safety Stock & ROP

This is the analytical core of Module 3. Calculate three values for EACH SKU using the formulas and given inputs. These calculations directly determine your Q and ROP — **and they are graded**.

> ⚠️ Do the math before entering values into the simulation. The engine checks whether your Q and ROP are consistent with the formula-based approach.

### Given Inputs — Use These in Every Formula

| Parameter | SKU A (Trend Tee) | SKU B (Core Jogger) | Source |
|-----------|-------------------|---------------------|--------|
| Selling price (P) | **€29 per unit** | **€69 per unit** | Fixed for Module 3 |
| Ordering cost per order (S) | **€200** | **€200** | Per replenishment order placed |
| Annual holding cost per unit (H) | **€3.60** | **€6.00** | Based on product value & handling |
| Simulation period | 90 days | 90 days | Fixed simulation length |
| Mean transit time (L) | From Step 4 | From Step 4 | Your service mode selection |
| Lead time std dev (σL) | From Step 4 | From Step 4 | Your service mode selection |

---

### Formula 1 — Economic Order Quantity (EOQ)

EOQ tells you how much to order each time you replenish. It balances ordering cost against holding cost.

\`\`\`
EOQ = √ (2 × D × S) / H

Where:
  D = Annual demand (= μd × 365)
  S = Ordering cost per order (€200 for both SKUs)
  H = Annual holding cost per unit (€3.60 for SKU A; €6.00 for SKU B)
\`\`\`

> 🔍 **Common Mistake — Annual vs Daily Demand**
>
> EOQ requires ANNUAL demand (D), not daily demand.
> Convert: D = μd × 365. If μd = 550 units/day, then D = 550 × 365 = 200,750/year.
> Using daily demand directly in EOQ gives a result that is ~18× too small — a very common error.
>
> **Sanity check:** Does your EOQ represent roughly 5–15 days of demand? If it is 2 days or 40 days, something is wrong.

**EOQ Calculation Worksheet:**

| Step | SKU A (Trend Tee) | SKU B (Core Jogger) |
|------|-------------------|---------------------|
| μd = average daily demand | _________ units/day | _________ units/day |
| D = μd × 365 (annual demand) | _________ units/year | _________ units/year |
| S = ordering cost | €200 | €200 |
| H = annual holding cost/unit | €3.60 | €6.00 |
| **EOQ = √(2DS/H)** | **_________ units** | **_________ units** |

Combined Q for simulation = EOQ_A + EOQ_B = _______

---

### Formula 2 — Safety Stock (SS)

Safety stock is the buffer inventory you hold to absorb variability in demand and lead time.

\`\`\`
SS = Z × σd × √L

Where:
  Z  = Z-score for your chosen service level (see table below)
  σd = standard deviation of daily demand (from Step 5)
  L  = mean lead time in days (from Step 4 — your service mode's transit time)
\`\`\`

**Choose Your Service Level — Then Find the Z-score**

| Target Service Level | Z-score | Interpretation & Trade-off |
|---------------------|---------|---------------------------|
| 80% | 0.84 | Accepts 1-in-5 lead time cycles will have a stockout. Minimum acceptable. |
| 85% | 1.04 | Moderate protection. Appropriate for stable, lower-value products. |
| 90% | 1.28 | Good standard for core products like SKU B (Core Jogger) with stable demand. |
| 95% | 1.65 | Industry standard for fashion retail. Appropriate for SKU A (Trend Tee) in key markets. |
| 98% | 2.05 | High protection. Use when stockout cost is very high — e.g., premium items in flagship stores. |
| 99% | 2.33 | Maximum protection. Significantly increases safety stock and holding cost. Justify carefully. |

> The simulation includes a **Service Level selector** where you record which level you used for your SS calculation. Enter your chosen level before submitting.

**💡 Think About This**

- SKU A (Trend Tee) has higher demand volatility AND higher markdown risk if overstocked. Which service level best balances protection against both stockout and overstock?
- SKU B (Core Jogger) at €69 generates 2.4× more revenue per unit than SKU A. A SKU B stockout is more expensive in lost revenue. Does that push you toward a higher service level for SKU B?
- Going from 90% to 99% increases Z from 1.28 to 2.33 — an 82% increase. Your safety stock increases by that same proportion. Is 99% ever cost-justified given the holding and markdown risk it creates?

**Safety Stock Calculation Worksheet:**

| Step | SKU A (Trend Tee) | SKU B (Core Jogger) |
|------|-------------------|---------------------|
| σd = std dev daily demand | _________ units/day | _________ units/day |
| L = mean lead time (days) | _________ days | _________ days |
| √L = square root of lead time | _________ | _________ |
| σLT = σd × √L | _________ units | _________ units |
| Z = service level z-score | _________ | _________ |
| **SS = Z × σLT** | **_________ units** | **_________ units** |

---

### Formula 3 — Reorder Point (ROP)

The Reorder Point is the inventory level that triggers a new replenishment order. It must cover expected demand during lead time PLUS a safety buffer.

\`\`\`
ROP = (μd × L) + SS

Where:
  μd = average daily demand (from Step 5)
  L  = mean lead time in days (from Step 4)
  SS = safety stock (from Formula 2 above)
\`\`\`

**ROP Calculation Worksheet:**

| Step | SKU A (Trend Tee) | SKU B (Core Jogger) |
|------|-------------------|---------------------|
| μd = average daily demand | _________ units/day | _________ units/day |
| L = mean lead time (days) | _________ days | _________ days |
| μLT = μd × L (lead time demand) | _________ units | _________ units |
| SS = safety stock | _________ units | _________ units |
| **ROP = μLT + SS** | **_________ units** | **_________ units** |

Combined ROP for simulation = ROP_A + ROP_B = _______

> **The simulation uses a combined ROP and Q** that apply to your combined inventory across all SKUs.
> - Combined ROP = ROP_A + ROP_B
> - Combined Q = EOQ_A + EOQ_B
>
> In your justification, show both the per-SKU calculations AND how you combined them.

---

## STEP 7 — Use the ROP/Q Visualizer: Sanity-Check Before Simulating

Before running a full practice simulation, use the built-in **ROP/Q Visualizer**. This shows a deterministic (non-random) preview of what your inventory cycle will look like over time.

**🔍 Enter Your Calculated ROP and Q into the Visualizer**

- Enter your combined ROP value from Step 6
- Enter your combined Q (EOQ_A + EOQ_B) from Step 6
- Observe the saw-tooth pattern — inventory drops daily as demand is consumed, then jumps when an order arrives
- The green inventory line should not touch zero

| What You See in the Visualizer | What It Means | What to Do |
|-------------------------------|---------------|------------|
| Inventory line hits zero frequently | ROP is too low — orders trigger too late | Increase ROP (add more safety stock) |
| Inventory barely drops before next order | Q is too large — over-ordering each time | Reduce Q toward your calculated EOQ |
| Orders are placed almost every day | Q is too small — ordering too frequently | Increase Q toward your calculated EOQ |
| Large inventory build-up at end of cycle | Q too large AND/OR demand lower than expected | Reduce Q or check your demand estimate |
| Stable saw-tooth with inventory always above zero | Your ROP and Q are well-calibrated | Proceed to full practice run |

**💡 Think About This**

- If the visualizer shows no stockouts but your full simulation practice run shows stockouts — why? (Hint: the visualizer uses deterministic/average demand; the simulation uses random Poisson demand.)
- If you increase Q by 500 units, does the saw-tooth pattern get taller or shorter?
- What happens if you reduce ROP by 30%? Does inventory still clear safely, or does the line hit zero?

---

## STEP 8 — Practice Runs & KPI Interpretation

Run at least two practice scenarios with different configurations. After each run, read every KPI carefully.

**🔍 After Each Practice Run — Read Every KPI**

| KPI | Direction | Investigation Question |
|-----|-----------|----------------------|
| Fill Rate (%) | Higher = better | If below 90%, which part of your policy is causing it — ROP too low, Q too small, or wrong network? |
| Total Cost (€) | Lower relative to network target = better | Is your cost dominated by DC fixed costs, transport, holding, or stockout penalties? |
| Profit Margin % | Higher = better (target ≥ 15%) | Are your costs so high that even a good fill rate produces a poor margin? |
| Total Revenue | Higher = better | Reflects total units filled × blended selling price |
| Markdown Cost | Lower = better | Ending inventory × selling price × 40%. High value = too much Q or ROP |
| Cost vs Target % | Closer to 0% = better | Calculate: your total cost ÷ network target cost |
| Stockouts (units) | Lower = better | How many units were unmet? Each costs €8.00 in penalty. |
| Carbon (kg) | Lower = better | Is Express mode multiplying your carbon dramatically? |
| Ending Inventory | Should not be near zero OR excessively high | Near zero = stockout risk in final period; Very high = over-ordered |

**Network Target Costs (the engine compares your total cost against these):**

| Network Strategy | Target Cost (90-day) | Cost Points at 5% within target |
|-----------------|---------------------|--------------------------------|
| Centralized | ≈ €290,000 | 10 pts |
| Hybrid | ≈ €320,000 | 10 pts |
| Decentralized | ≈ €360,000 | 10 pts |

> ⚠️ **Cost Efficiency vs Fill Rate Trade-off**
>
> A common mistake is chasing fill rate by increasing Q and ROP to very high levels — this raises holding and markdown costs and pushes total cost well above the network target. Run at least one scenario where you deliberately try to stay within 5% of the cost target while maintaining ≥ 90% fill rate.

---

## STEP 9 — Final Submission: Checklist & Justification

**✍️ Final Submission Checklist**

- [ ] Network strategy selected (Centralized / Hybrid / Decentralized)
- [ ] Service mode selected (Standard / Express / Mixed)
- [ ] Service level selected (the Z-score you used for your SS calculation)
- [ ] ROP entered — your combined calculated value from Step 6
- [ ] Q entered — your combined EOQ from Step 6
- [ ] Forecast method labeled (Moving Average / Exponential Smoothing / Seasonal / Naïve)
- [ ] ROP and Q are both positive and greater than zero
- [ ] Q does not exceed 50,000 (validity flag threshold)
- [ ] At least 2–3 practice runs completed
- [ ] Justification written — minimum 400 characters (~60 words); aim for 400–600+ words for full marks
- [ ] Click FINAL SUBMISSION — this locks Module 3 and completes the course

**What a Strong Justification Includes**

A high-scoring justification is evidence-based and covers all decision layers:

1. **Forecast method per region** — what method you used for EU/NA/APAC and why it fits each region's demand pattern
2. **Network choice** — why you chose your DC configuration given the regional service expectations and demand shares
3. **Service mode** — the cost, carbon, and lead time trade-offs that drove your selection
4. **EOQ/ROP math** — summarize your calculation steps and inputs for each SKU
5. **Service level** — which level you chose for each SKU and why (referencing volatility, margin, and markdown risk)
6. **Trade-off statement** — explicitly state what you sacrificed (e.g., "I accepted higher shipping cost to achieve lower safety stock via Express mode")
7. **KPI evidence** — reference at least two KPIs from your best practice run (e.g., "Practice run 2 achieved 93.4% fill rate at €308,000 total cost")

---

## 📊 Grading Rubric — 55 Points Total

### Category 1 — Performance & Profit (30 points)

Score = Fill Rate sub-score (0–20) + Cost Efficiency sub-score (0–10).

**Fill Rate (max 20 pts):**

| Fill Rate | Points |
|-----------|--------|
| ≥ 94% | 20 |
| 90–93.9% | 17 |
| 85–89.9% | 14 |
| 80–84.9% | 10 |
| < 80% | 5 |

**Cost Efficiency vs Network Target (max 10 pts):**

| Cost vs Target | Points |
|---------------|--------|
| Within 5% | 10 |
| Within 10% | 8 |
| Within 15% | 7 |
| Within 25% | 5 |
| More than 25% over | 3 |

---

### Category 2 — Inventory Math Correctness (15 points)

The engine compares your submitted ROP and Q to formula-derived benchmark values. Your justification is also reviewed to confirm you used the correct formulas and inputs.

| Component | Points | What Is Evaluated |
|-----------|--------|-------------------|
| EOQ logic and calculation | 6 pts | Did you use EOQ = √(2DS/H) with correct annual demand, S=€200, and SKU-specific H? Is your Q within ±15% of the formula output? |
| ROP logic and calculation | 5 pts | Did you use ROP = (μd × L) + SS with consistent inputs? Does your submitted ROP match your calculation? |
| Safety stock logic | 4 pts | Did you use SS = Z × σd × √L with a valid Z-score and the lead time from your service mode? |

**Point thresholds for Q (max 6 pts):**
- Q within ±15% of reference EOQ → 6 pts
- Q within ±30% of reference EOQ → 4 pts
- Q within ±50% of reference EOQ → 2 pts
- Q outside ±50% → 0 pts

**Point thresholds for ROP (max 5 pts):**
- ROP within ±15% of reference ROP → 5 pts
- ROP within ±30% of reference ROP → 3 pts
- ROP within ±50% of reference ROP → 2 pts
- ROP outside ±50% → 0 pts

**Safety Stock implicit (max 4 pts):**
- Your implied SS (ROP − μd×L) ≥ 80% of reference SS → 4 pts
- Implied SS ≥ 40% of reference SS → 2 pts
- Implied SS > 0 but too small → 1 pt
- No safety stock (ROP = lead time demand only) → 0 pts

> ⚠️ **Show Your Work in the Justification**
>
> The engine scores your submitted Q and ROP against formula benchmarks, but your justification must explain your calculation steps. If your numbers deviate from the benchmark, the grader will review your reasoning to award partial credit. No work shown = no partial credit.

---

### Category 3 — Policy Quality & Reasoning (8 points)

Score = Network Alignment (0–5) + Justification Quality (0–3).

| Sub-score | Points | Criteria |
|-----------|--------|----------|
| Network Alignment | 5 pts | Hybrid or Decentralized + fill rate ≥ 90% = 5 pts; Centralized + fill rate ≥ 90% = 4 pts; Centralized + fill rate < 85% = 2 pts; other combinations = 3 pts |
| Justification Quality | 3 pts | ≥ 400 characters (~60 words) = 3 pts · ≥ 250 characters = 2 pts · ≥ 100 characters = 1 pt · < 100 characters = 0 pts |

---

### Category 4 — Validity & Completeness (2 points)

| Check | Deduction |
|-------|-----------|
| ROP ≤ 0 or Q ≤ 0 | −1 point |
| Q > 50,000 units | −0.5 point |

---

### Letter Grade Mapping

| Grade | Points | Profile |
|-------|--------|---------|
| A | ≥ 50 / 55 | Strong fill rate + cost control + correct math + well-justified trade-off reasoning |
| B | ≥ 44 / 55 | Good performance with minor weaknesses in math or reasoning |
| C | ≥ 38 / 55 | Acceptable outcomes but math partially incorrect or justification weak |
| D | < 38 / 55 | Significant issues in performance, math, or completeness |

---

## How This Module Completes the Supply Chain

| Module | Your Decision | What It Built |
|--------|--------------|---------------|
| Module 1 | Global Sourcing | Selected suppliers, negotiated cost and quality, set material lead times |
| Module 2 | Operations Planning | Converted materials into finished goods, set production schedule and service level |
| Module 3 (This Module) | Distribution & Inventory | Getting finished goods to 420 stores globally — the customer-facing layer |

---

## Final Reminder from Sofia Costa

*"The best distribution strategy is the one that serves our customers reliably, protects our margins, and doesn't apologize for its carbon footprint. If you can articulate why every number you entered makes business sense — you have done your job. — Sofia"*

---

*Module 3 Student Guidebook — Veloce Wear SCM Simulation · v3*
`;
