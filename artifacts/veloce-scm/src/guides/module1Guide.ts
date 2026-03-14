export const module1Guide = `# Global Sourcing Under Pressure — "Veloce Wear" Micro-Collection Cycle

## Your Briefing

Welcome to **Veloce Wear**, a premium fast-fashion apparel company inspired by Zara's ability to launch **new designs quickly** while protecting **quality**, **brand reputation**, and **sustainability commitments**.

You have been appointed as the **Global Sourcing Analyst** for the next micro-collection cycle. Your mission is to build a sourcing plan that ensures our Porto, Portugal manufacturing campus receives the right materials **on time**, **at the right quality**, and **at a total landed cost that protects profit**.

This is not a "buy the cheapest" exercise. In fast fashion, procurement decisions shape the entire supply chain. A sourcing plan that looks good on paper can still fail if it creates:

- late material arrivals,
- inconsistent quality (rework and delays),
- sustainability compliance risks,
- or cost spikes from expediting and penalties.

---

## Global Sourcing Sprint — CSCO Briefing

You are the Global Sourcing Manager for Veloce Wear's next micro-collection. Your job is to forecast demand, translate it into **material requirements**, and award supplier volumes across global suppliers while protecting Veloce Wear's mission (fast fashion speed + high perceived quality + responsible sourcing). You must balance cost vs lead time vs reliability vs sustainability, then lock one final sourcing strategy.

### Your Role

You are part of the **Global Procurement & Supplier Management Team**. Your responsibilities include:

1. **Forecast demand** for two SKUs using historical sales data provided in the simulation
2. Convert your forecast into **material requirements (kg)** using the BOM and scrap rates
3. Select and allocate suppliers for:
   - **Cotton** (SKU A: Trend Tee)
   - **Nylon-spandex** (SKU B: Core Jogger)
4. Choose logistics decisions that matter in real life:
   - **Transport mode** (cost vs speed vs carbon)
   - **Assurance package** (risk reduction vs premium cost)
   - **Batching strategy** (flexibility vs admin cost and delay risk)
5. Decide whether to purchase a **€10,000 Market Intelligence Report** that reduces forecast uncertainty

### The Business Reality (Why This Is Hard)

Veloce Wear competes in three major markets:

- **Western Europe (largest store footprint)** — expects fast replenishment and consistent quality
- **USA & Canada (high margin + very high service expectations)** — stockouts mean lost sales
- **APAC (trend-sensitive, volatile)** — the wrong inventory arrives too late and gets discounted

**Mission Statement:**

> "Deliver new designs fast while meeting strict quality and sustainability standards."

So your sourcing plan must balance five real-world criteria:

- **Cost** (total landed cost matters)
- **Lead time** (Porto must receive materials in time to produce)
- **Reliability** (on-time delivery is not guaranteed)
- **Quality** (supports premium positioning and reduces rework)
- **Sustainability & compliance** (certifications, ethical sourcing, ESG expectations)

### What You Will See in the Simulation

The app provides interactive tools, including:

**Interactive 3D Bubble Chart** — visualizes suppliers by Cost vs Quality vs Sustainability. Helps you identify "best value" suppliers and premium sustainable options.

**KPI Dashboard** after each run — landed cost, lead time and reliability, sustainability/quality scores, carbon index, late delivery outcomes (penalties).

**A structured grading rubric** — you are graded on forecasting, supplier decision quality, logistics tradeoffs, mission alignment, and data validity.

### Your Deliverable (What You Submit)

You will submit one final sourcing plan that includes:

- your **demand forecast** for both SKUs
- your **material requirements** (cotton and nylon in kg)
- your **supplier selection and allocations**
- your **logistics and risk management choices**
- a professional **justification** explaining your tradeoffs

You may run multiple practice simulations. Only your **Final Submission** counts.

### How This Connects to the Next Modules

Your Module 1 decisions become real constraints in the later modules:

- If you choose long lead times or low reliability, **production may be delayed** (Module 2).
- If you choose low-quality materials, **rework and cost increase** (Module 2).
- If you choose high-cost expediting or carbon-heavy modes, it impacts **profit and sustainability targets** (Module 3).

In other words: **your sourcing plan becomes the foundation of the entire supply chain strategy.**

---

# Ultimate Student Guide — Module 1: Global Sourcing & Procurement (55 points)

**Module Goal:** You are the Global Sourcing Analyst for Veloce Wear. Your job is to forecast demand, convert it into raw-material requirements (kg), select suppliers using a formal method, choose transport/assurance/batching, and submit a defensible plan.

---

## 1) Business Context (What You're Optimizing For)

**Company mission (important — this affects your grade):**

> "Deliver 'newness' fast while meeting strict quality and sustainability standards."

**Manufacturing:** Porto Manufacturing Campus (Portugal) — cut/sew/finish/package.

**Store network:** 420 stores globally (Western Europe, USA/Canada, APAC).

---

## 2) Products, BOM, Scrap (Raw Materials, Not Finished Goods)

You are **buying raw materials** to feed Porto manufacturing.

**SKU A — Trend Tee (cotton knit):**
- BOM: **0.23 kg cotton per unit**
- Scrap/Waste: **6%** (multiply by **1.06**)

**SKU B — Core Jogger (nylon-spandex fabric):**
- BOM: **0.42 kg nylon per unit**
- Scrap/Waste: **8%** (multiply by **1.08**)

**Material requirement formulas (what you must compute):**
- **Cotton kg required = Your_Forecast_A × 0.23 × 1.06**
- **Nylon kg required = Your_Forecast_B × 0.42 × 1.08**

---

## 3) Forecasting — Your First Major Decision

### Where to Get Your Data

⚠️ **IMPORTANT:** The simulation platform displays historical demand data on-screen when you open Module 1. **Use the data shown in the simulation** as the basis for your forecasting. The reference dataset below is provided so you can practice forecasting methods in Excel before you open the simulation.

### Reference Dataset (30-Year Annual Sales History)

Use this dataset to **practice your forecasting skills** in Excel. When you open the simulation, you will see platform-generated historical data — apply the same analytical approach to that data.

| Year | SKU A (Trend Tee) | SKU B (Core Jogger) |
|------|-------------------|---------------------|
| 1 | 8,100 | 9,150 |
| 2 | 8,450 | 8,750 |
| 3 | 8,700 | 8,900 |
| 4 | 9,050 | 9,200 |
| 5 | 9,200 | 9,000 |
| 6 | 9,600 | 8,750 |
| 7 | 9,750 | 9,250 |
| 8 | 10,100 | 9,050 |
| 9 | 10,350 | 8,850 |
| 10 | 10,650 | 9,300 |
| 11 | 10,900 | 9,000 |
| 12 | 11,200 | 8,800 |
| 13 | 11,450 | 9,150 |
| 14 | 11,750 | 8,950 |
| 15 | 12,050 | 9,200 |
| 16 | 12,350 | 9,050 |
| 17 | 12,650 | 8,900 |
| 18 | 12,900 | 9,250 |
| 19 | 13,200 | 8,850 |
| 20 | 13,500 | 9,150 |
| 21 | 13,850 | 8,950 |
| 22 | 14,150 | 9,100 |
| 23 | 14,450 | 8,800 |
| 24 | 14,800 | 9,200 |
| 25 | 15,050 | 9,000 |
| 26 | 15,350 | 8,850 |
| 27 | 15,650 | 8,800 |
| 28 | 16,050 | 9,000 |
| 29 | 16,350 | 9,200 |
| 30 | 16,700 | 9,000 |
| **Next** | **(YOU forecast)** | **(YOU forecast)** |

### How to Choose a Forecasting Method

The right forecasting method depends on the **pattern you observe in the data**. Before choosing a method, do this analysis:

**Step 1 — Plot the data.** Create a chart in Excel with the historical values. What do you see?

**Step 2 — Ask these diagnostic questions for EACH SKU:**

- Does the data show a **consistent upward or downward slope** over time? If yes, you need a method that captures **trend**.
- Does the data **fluctuate around a relatively flat line** without a clear direction? If yes, a **smoothing or averaging** method may be sufficient.
- Are there **repeating peaks and valleys** at regular intervals? If yes, consider a method that handles **seasonality**.
- Is the most recent data **more representative** of the future than older data? If yes, consider methods that weight recent observations more heavily.

**Step 3 — Match the pattern to a method:**

| Data Pattern You Observe | Methods That Work Well | Methods That Work Poorly |
|--------------------------|----------------------|-------------------------|
| Clear upward/downward slope | Linear Regression, Exponential Smoothing with trend | Simple Moving Average (lags behind the trend) |
| Stable, fluctuating around a mean | Moving Average, Simple Exponential Smoothing | Regression may overfit noise |
| Repeating seasonal cycles | Seasonal Decomposition, Holt-Winters | Simple averages ignore cycles |
| Recent shift in behavior | Weighted/Exponential Smoothing (high α) | Long-window Moving Average (slow to react) |

**Step 4 — Calculate your forecast.** Use Excel (LINEST, TREND, AVERAGE, or manual formulas) and **document your method and rationale**.

### 📝 Your Forecasting Worksheet

\`\`\`
FOR EACH SKU, complete this analysis:

1. What pattern do I see in the data?
   SKU A pattern: _________________________________
   SKU B pattern: _________________________________

2. Which method matches each pattern? (refer to the table above)
   SKU A method: _________________ Why? _________________
   SKU B method: _________________ Why? _________________

3. My calculations (attach Excel output or show formula):
   _________________________________________________

4. My forecasts:
   SKU A: _______ units
   SKU B: _______ units

5. Material requirements:
   Cotton kg = _______ × 0.23 × 1.06 = _______ kg
   Nylon kg  = _______ × 0.42 × 1.08 = _______ kg
\`\`\`

### Demand Uncertainty & the Market Intelligence Report

The simulation uses **stochastic demand** around *your forecast* using a Normal distribution:
- Actual_A ~ Normal(mean = Forecast_A, σ = 10% of Forecast_A)
- Actual_B ~ Normal(mean = Forecast_B, σ = 6% of Forecast_B)

**Optional: Market Intelligence Report (€10,000)**
- Cost: **€10,000**
- Effect: reduces uncertainty to **σ_A = 7%** and **σ_B = 4%**
- Buy if: you want to reduce the risk of stockout or overstock
- Skip if: your forecasting method is highly accurate and you're budget-constrained

---

## 4) Supplier Database (8 Suppliers)

Two suppliers per country with different quality/sustainability/certification profiles.

| ID | Company | Country | Cotton €/kg | Nylon €/kg | Lead (days) | On-Time % | Sustainability (1–5) | Quality (1–5) | Certifications |
|----|---------|---------|-------------|------------|-------------|-----------|---------------------|---------------|----------------|
| PT1 | Lusitex Premium | Portugal | 3.55 | 5.10 | 5 | 97% | 4.4 | 4.6 | ISO9001, ISO14001, OEKO-TEX |
| PT2 | PortoWeave Organic | Portugal | 3.85 | 5.25 | 6 | 96% | 4.8 | 4.7 | ISO9001, ISO14001, **GOTS**, OEKO-TEX |
| TR1 | Anatolia Mills | Turkey | 3.20 | 4.95 | 8 | 94% | 3.8 | 4.0 | ISO9001, ISO14001 |
| TR2 | Bosporus Textiles | Turkey | 3.35 | 5.05 | 9 | 95% | 4.1 | 4.2 | ISO9001, ISO14001, OEKO-TEX |
| VN1 | Saigon Spinners | Vietnam | 2.85 | 4.70 | 28 | 88% | 3.2 | 3.6 | ISO9001 |
| VN2 | Hanoi EcoWeave | Vietnam | 3.05 | 4.85 | 30 | 90% | 4.0 | 3.8 | ISO9001, ISO14001, OEKO-TEX |
| MX1 | Monterrey KnitWorks | Mexico | 3.10 | 4.60 | 24 | 91% | 3.5 | 3.7 | ISO9001 |
| MX2 | Yucatan SustainTex | Mexico | 3.25 | 4.75 | 26 | 92% | 4.2 | 3.9 | ISO9001, ISO14001 |

**Certifications you should understand (use in your justification):**
- **ISO 9001** — quality management system
- **ISO 14001** — environmental management system
- **OEKO-TEX** — chemical safety for textiles
- **GOTS** — Global Organic Textile Standard (only PT2 has this — required if you claim "organic" in your strategy)

**You must select suppliers using a formal MCDA method** (Weighted Scoring, AHP, or TOPSIS). Define your criteria weights, score each supplier, rank them, and select 2–4 for your portfolio.

---

## 5) Transportation Constraints, Costs, and Lead Times

**Mode feasibility rules (hard constraint — invalid choices lose points):**
- **Nearshore** (Portugal, Turkey): Truck / Rail / Air
- **Offshore** (Vietnam, Mexico): Ocean / Air only

| Mode | Cost €/kg | Transit Time | CO₂ Index | Reliability Bonus |
|------|-----------|-------------|-----------|-------------------|
| Truck | 0.18 | 2–5 days | 2 | +0% |
| Rail | 0.12 | 4–8 days | 1 (lowest) | +1% |
| Ocean | 0.08 | 18–35 days | 3 | +0% |
| Air | 0.95 | 4–9 days | 9 (highest) | +2% |

**Admin/ordering cost:** **€200 per batch** (per supplier allocation).

---

## 6) Assurance Packages (Risk vs Cost)

Assurance increases reliability but also increases **material price** (premium). Reliability is capped at **99%**.

| Package | Price Premium | Reliability Boost | When to Consider |
|---------|-------------|-------------------|------------------|
| Standard | +0% | +0% | Suppliers already at high reliability |
| Priority | +3% price | +4% reliability | Suppliers with moderate reliability |
| Premium | +6% price | +8% reliability | Suppliers with low base reliability |

---

## 7) Quantity Discounts (Per Supplier, Per Material)

These apply to **kg ordered per supplier**, not total kg across all suppliers.

**Cotton discount tiers:**
- ≥ 20,000 kg → **2% discount**
- ≥ 50,000 kg → **4% discount**

**Nylon discount tiers:**
- ≥ 10,000 kg → **2% discount**
- ≥ 25,000 kg → **4% discount**

⚠️ **Caution:** Your monthly material needs are typically 4,000–5,000 kg per material. Ordering 20,000+ kg to chase a discount creates massive excess inventory and markdown risk. Make sure the discount math actually works before over-ordering.

---

## 8) Late Delivery Probability and Penalty

For each supplier allocation, you choose **# of batches** (1, 2, or 4). Each batch is independently tested for lateness using the **effective reliability** (base + transport bonus + assurance boost).

- **Late penalty: €500 per late batch**
- More batches = more chances for individual batches to be late, but each late batch affects a smaller portion of your total order
- Fewer batches = fewer individual tests but each failure hits harder

---

## 9) Interactive Visualization (Keep This Open While Deciding)

Module 1 includes an **Interactive 3D Bubble Chart** (React/Recharts) that visualizes supplier trade-offs:

- **X-axis:** Cost (€/kg) — left is cheaper
- **Y-axis:** Quality (higher is better)
- **Bubble size:** Sustainability (bigger = more sustainable)
- **Color:** Nearshore = Green, Offshore = Purple
- **Hover** to see certifications and detailed data

Use it to quickly identify:
- **Top-left quadrant:** high quality + lower cost ("best value")
- **Top-right quadrant:** premium suppliers (great quality/sustainability, higher cost)
- **Large green bubbles:** nearshore suppliers with strong sustainability (mission-aligned)

---

## 10) What You Enter in the Simulation

You will enter:

1. **Forecast_A and Forecast_B** (your demand forecast for both SKUs)
2. **Forecast method** (dropdown: linear regression, moving average, exponential smoothing, seasonal decomposition)
3. Whether you buy the **Market Report (€10,000)**
4. A set of **supplier allocations**, each with:
   - Supplier ID
   - Material type (cotton or nylon)
   - kg ordered
   - Transport mode
   - Assurance package
   - Number of batches (1, 2, or 4)
5. A written **justification** (recommended 400–600+ words)

---

## 11) KPI Dashboard (What You See After Each Run)

After each run the engine calculates and displays:

- Total procurement cost (material + transport + order/admin + report + late penalties)
- Forecast error % (based on simulated actual vs your forecast)
- Avg lead time (weighted by kg across suppliers)
- Avg reliability % (weighted by kg)
- Avg sustainability (1–5 scale), avg quality (1–5 scale)
- Total CO₂ index
- Cotton required vs allocated; nylon required vs allocated
- Late deliveries (number of late batches)

**Use practice runs to test different strategies.** Compare KPIs across runs to see what improves your score.

---

## 12) Grading Rubric — Total 55 Points

This is **exactly** how the engine awards points. Study it before you start.

### Category 1 — Forecasting & Planning Logic (15 pts)

Based on average forecast error (across both SKUs), plus a bonus for method quality.

| Avg Forecast Error | Points |
|-------------------|--------|
| ≤ 5% | 15 |
| 5–10% | 12 |
| 10–15% | 9 |
| > 15% | 6 |

**+1 bonus** if you select **linear regression** or **exponential smoothing** as your method (capped at 15 total).

### Category 2 — Supplier Selection / MCDA Method (12 pts)

Based on diversification — number of suppliers with kg > 0.

| Suppliers Used | Points |
|---------------|--------|
| 2–4 suppliers | 12 |
| 5+ suppliers | 9 |
| 1 supplier | 7 |
| 0 suppliers | 0 |

### Category 3 — Logistics Trade-offs: Cost + Reliability (12 pts)

**Cost score (0–6 points):**

| Total Procurement Cost | Points |
|-----------------------|--------|
| < €30,000 | 6 |
| < €35,000 | 5 |
| < €40,000 | 4 |
| ≥ €40,000 | 2 |

**Reliability score (0–6 points):**

| Weighted Avg Reliability | Points |
|-------------------------|--------|
| ≥ 96% | 6 |
| ≥ 94% | 5 |
| ≥ 92% | 3 |
| < 92% | 2 |

Trade-offs score = Cost score + Reliability score.

### Category 4 — Mission Alignment: Quality + Sustainability (8 pts)

| Weighted Avg Quality | Points | Weighted Avg Sustainability | Points |
|---------------------|--------|---------------------------|--------|
| ≥ 4.2 | 4 | ≥ 4.2 | 4 |
| ≥ 4.0 | 3 | ≥ 4.0 | 3 |
| ≥ 3.5 | 2 | ≥ 3.5 | 2 |
| < 3.5 | 1 | < 3.5 | 1 |

### Category 5 — Data Validity + Justification (8 pts)

**Validity (0–5 points):** Start with 5 points. Lose 1 point per validation flag (e.g., invalid transport mode). Additional −2 if cotton or nylon coverage < 95%.

**Justification (0–3 points):**

| Justification Length | Points |
|---------------------|--------|
| ≥ 500 characters | 3 |
| ≥ 300 characters | 2 |
| ≥ 150 characters | 1 |
| < 150 characters | 0 |

Note: This is measured in **characters** (not words). 500 characters is approximately 70–80 words. A well-written 400-word justification easily clears the maximum threshold, so focus on **quality and depth** rather than hitting a word count.

### Letter Grade Mapping

| Points | Grade |
|--------|-------|
| ≥ 51 | A |
| ≥ 45 | B |
| ≥ 38 | C |
| ≥ 30 | D |
| < 30 | F |

---

## 13) Tips for a Strong Submission

**DO:**
- Plot the historical data before choosing a method — let the pattern guide your choice
- Use a formal MCDA method with weights that sum to exactly 100%
- Diversify across 2–4 suppliers for risk hedging
- Consider the mission statement when weighting your MCDA criteria
- Run 3–5 practice simulations to compare strategies
- Write a detailed justification explaining your reasoning, trade-offs, and mission alignment

**DON'T:**
- Don't choose a forecasting method without examining the data pattern first
- Don't use Truck or Rail for Vietnam/Mexico suppliers (validation error)
- Don't claim "organic cotton" unless you allocate to PT2 (the only GOTS-certified supplier)
- Don't single-source everything to one supplier (reduced diversification score)
- Don't chase quantity discounts by massively over-ordering (markdown risk exceeds savings)
- Don't submit your final without running practice simulations first

---

## 14) Submission Checklist

Before clicking **Submit Final:**

- [ ] I plotted the historical data and identified patterns for each SKU
- [ ] I selected a forecasting method that matches each SKU's pattern
- [ ] I calculated my demand forecasts and can explain my method
- [ ] I calculated material requirements using BOM × scrap factor
- [ ] I used a formal MCDA method with documented weights summing to 100%
- [ ] I selected 2–4 suppliers and allocated kg covering 100% of requirements
- [ ] My transport modes are valid for each supplier's region
- [ ] I assigned assurance packages and batching strategies with rationale
- [ ] My justification addresses forecasting, supplier selection, logistics, and mission alignment
- [ ] I ran at least 3 practice simulations and reviewed the KPI dashboard
- [ ] My best practice score is at a level I'm satisfied with

---

*Module 1 Student Guidebook — Veloce Wear SCM Simulation*
`;
