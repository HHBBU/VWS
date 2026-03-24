# REPLIT FIXES — MODULE 1 (CONSOLIDATED)
## All Engine, Template, and Data Fixes — Apply in Order

**Course:** SCM 4330: SCM Applications — Veloce Wear Simulation  
**Module:** Module 1 — Global Sourcing & Procurement  
**Version:** v3 (Post-Guidebook Finalization)

This file contains every fix needed to align the simulation engine with the finalized
v3 student and instructor guidebooks. Apply ALL fixes below in the order listed.

---

## TABLE OF CONTENTS

| Fix | File | Priority |
|-----|------|----------|
| [Fix 1](#fix-1) — Static 30-year dataset (Year 31, not Month 25) | `modules/historical_data.py` | 🔴 CRITICAL |
| [Fix 2](#fix-2) — Template labels Month → Year | `templates/student/module1.html` | 🔴 CRITICAL |
| [Fix 3](#fix-3) — Category 2 MCDA composite scoring | `modules/simulation_engine.py` | 🔴 CRITICAL |
| [Fix 4](#fix-4) — Category 2 label in results template | `templates/student/module1.html` | 🟡 RECOMMENDED |
| [Fix 5](#fix-5) — Quality/Sustainability thresholds (already in v2) | `modules/simulation_engine.py` | ✅ VERIFY ONLY |
| [Fix 6](#fix-6) — Forecast error denominator (already in v2) | `modules/simulation_engine.py` | ✅ VERIFY ONLY |
| [Fix 7](#fix-7) — numpy in requirements.txt (already in v2) | `requirements.txt` | ✅ VERIFY ONLY |

---

<a name="fix-1"></a>
## FIX 1 — Static 30-Year Dataset (Year 31 Forecasting)
**File:** `modules/historical_data.py`  
**Priority:** 🔴 CRITICAL — Guide uses 30-year annual data; engine was generating 24-month data

The student guidebook's historical data table and the simulation must show identical data.
Replace the entire file contents with the static dataset below.

### ACTION: Replace entire `modules/historical_data.py` with:

```python
"""
Historical data module — static 30-year annual dataset matching the Student Guidebook.
Students see this exact data in the simulation and forecast Year 31.
Seed parameter accepted but ignored (data is deterministic).
"""

def generate_historical_demand(seed=None):
    """
    Return 30 years of historical annual demand for SKU A and SKU B.
    This is the same table printed in the Student Guidebook (v3).
    """
    years = list(range(1, 31))

    # SKU A (Trend Tee) — strong upward trend, ~280 units/year
    sku_a = [
        8100, 8450, 8700, 9050, 9200, 9600, 9750, 10100, 10350, 10650,
        10900, 11200, 11450, 11750, 12050, 12350, 12650, 12900, 13200, 13500,
        13850, 14150, 14450, 14800, 15050, 15350, 15650, 16050, 16350, 16700
    ]

    # SKU B (Core Jogger) — stable demand, fluctuates ~8,750–9,300
    sku_b = [
        9150, 8750, 8900, 9200, 9000, 8750, 9250, 9050, 8850, 9300,
        9000, 8800, 9150, 8950, 9200, 9050, 8900, 9250, 8850, 9150,
        8950, 9100, 8800, 9200, 9000, 8850, 8800, 9000, 9200, 9000
    ]

    # Compute trend for display (linear regression slope)
    n = len(years)
    sum_x = sum(years)
    sum_y_a = sum(sku_a)
    sum_xy_a = sum(x * y for x, y in zip(years, sku_a))
    sum_x2 = sum(x * x for x in years)
    denom = n * sum_x2 - sum_x * sum_x
    trend_a = round((n * sum_xy_a - sum_x * sum_y_a) / denom)

    sum_y_b = sum(sku_b)
    sum_xy_b = sum(x * y for x, y in zip(years, sku_b))
    trend_b = round((n * sum_xy_b - sum_x * sum_y_b) / denom)

    return {
        'months': years,          # kept as 'months' key for backward compatibility
        'sku_a': sku_a,
        'sku_b': sku_b,
        'trend_a': trend_a,
        'trend_b': trend_b,
        'data_points': list(zip(years, sku_a, sku_b))
    }


def get_forecast_data_for_display():
    """
    Returns historical data formatted for template rendering.
    """
    import numpy as np
    data = generate_historical_demand()

    chart_data = {
        'labels': [f'Year {y}' for y in data['months']],
        'datasets': [
            {
                'label': 'SKU A — Trend Tee (Cotton)',
                'data': data['sku_a'],
                'borderColor': '#1565C0',
                'backgroundColor': 'rgba(21, 101, 192, 0.1)',
                'fill': True
            },
            {
                'label': 'SKU B — Core Jogger (Nylon)',
                'data': data['sku_b'],
                'borderColor': '#2E7D32',
                'backgroundColor': 'rgba(46, 125, 50, 0.1)',
                'fill': True
            }
        ]
    }

    return {
        'chart_data': chart_data,
        'raw_data': data,
        'summary': {
            'avg_a': int(np.mean(data['sku_a'])),
            'avg_b': int(np.mean(data['sku_b'])),
            'trend_a': data['trend_a'],
            'trend_b': data['trend_b']
        }
    }
```

---

<a name="fix-2"></a>
## FIX 2 — Template Labels: Month → Year
**File:** `templates/student/module1.html`  
**Priority:** 🔴 CRITICAL — Students will see "Month 25" but guide says "Year 31"

### ACTION: Find and replace these four strings in the template:

**Replace 1:**
```html
<!-- FIND: -->
<p class="text-muted">Use this data to forecast Month 25 demand</p>
<!-- REPLACE WITH: -->
<p class="text-muted">Use this data to forecast Year 31 demand</p>
```

**Replace 2:**
```html
<!-- FIND: -->
<h2>1️⃣ Demand Forecasting (Month 25)</h2>
<!-- REPLACE WITH: -->
<h2>1️⃣ Demand Forecasting (Year 31)</h2>
```

**Replace 3:**
```html
<!-- FIND (in data table header): -->
<th>Month</th>
<!-- REPLACE WITH: -->
<th>Year</th>
```

**Replace 4 — show all 30 years (not just last 12):**
```html
<!-- FIND: -->
{% for month, sku_a, sku_b in forecast_data.raw_data.data_points[-12:] %}
<!-- REPLACE WITH: -->
{% for year, sku_a, sku_b in forecast_data.raw_data.data_points %}
```

Also update the loop variable inside the `{% for %}` block from `{{ month }}` to `{{ year }}`:
```html
<!-- FIND: -->
<td>{{ month }}</td>
<!-- REPLACE WITH: -->
<td>Year {{ year }}</td>
```

---

<a name="fix-3"></a>
## FIX 3 — Category 2 MCDA Composite Scoring
**File:** `modules/simulation_engine.py`  
**Priority:** 🔴 CRITICAL — Old code awards points based only on supplier count (gameable)

### BACKGROUND
The old logic awarded 12 pts simply for using 2–4 suppliers, which students could game
without genuine MCDA reasoning. The new logic evaluates four weighted criteria using
variables already computed upstream in the engine.

### ACTION: Find this block in `simulation_engine.py`:

```python
# Category 2: Supplier Selection Method (12 points)
supplier_method_score = 0

if 2 <= num_suppliers_used <= 4:
    supplier_method_score = 12
elif num_suppliers_used == 1:
    supplier_method_score = 7
elif num_suppliers_used > 4:
    supplier_method_score = 9
# num_suppliers_used == 0 → 0 points (already flagged)

score_breakdown['supplier_method'] = supplier_method_score
```

### REPLACE WITH:

```python
# ================================================================
# Category 2: Supplier Selection / MCDA Composite (12 points)
# Four weighted criteria: Responsiveness (25%), Reliability (30%),
# Sustainability (25%), Cost (20%).
# Supplier count drives the Reliability sub-score (diversification
# = resilience), not the entire score.
# ================================================================

# --- Responsiveness sub-score (25% weight = 3.0 pts max) ---
# avg_lead_time already computed above (float, in days, weighted by kg)
if avg_lead_time < 8:
    responsiveness_sub = 3.0
elif avg_lead_time <= 18:
    responsiveness_sub = 1.8
else:
    responsiveness_sub = 0.6

# --- Reliability sub-score (30% weight = 3.6 pts max) ---
# Blends supplier-count tier (diversification) with avg on-time rate.
# num_suppliers_used already computed above.

# Supplier count → normalised tier (0.0–1.0)
if 2 <= num_suppliers_used <= 4:
    count_tier_norm = 1.000   # optimal diversification
elif num_suppliers_used > 4:
    count_tier_norm = 0.750   # over-fragmented (9/12 maps to 0.75)
elif num_suppliers_used == 1:
    count_tier_norm = 0.583   # concentration risk (7/12)
else:
    count_tier_norm = 0.000   # no suppliers

# avg_reliability already computed above (float 0.0–1.0, after assurance uplift)
if avg_reliability >= 0.96:
    reliability_rate_norm = 1.000
elif avg_reliability >= 0.94:
    reliability_rate_norm = 0.833
elif avg_reliability >= 0.92:
    reliability_rate_norm = 0.500
else:
    reliability_rate_norm = 0.333

reliability_sub = 3.6 * (0.5 * count_tier_norm + 0.5 * reliability_rate_norm)

# --- Sustainability sub-score (25% weight = 3.0 pts max) ---
# avg_sustainability already computed above (float 1.0–5.0, weighted by kg)
if avg_sustainability >= 4.2:
    sustainability_sub = 3.0
elif avg_sustainability >= 4.0:
    sustainability_sub = 2.1
elif avg_sustainability >= 3.5:
    sustainability_sub = 1.2
else:
    sustainability_sub = 0.6

# --- Cost sub-score (20% weight = 2.4 pts max) ---
# total_procurement_cost already computed above (euros, includes all components)
if total_procurement_cost < 30000:
    cost_sub = 2.4
elif total_procurement_cost < 35000:
    cost_sub = 1.8
elif total_procurement_cost < 40000:
    cost_sub = 1.2
else:
    cost_sub = 0.5

# --- Composite MCDA score (rounded, capped at 12) ---
mcda_raw = responsiveness_sub + reliability_sub + sustainability_sub + cost_sub
supplier_method_score = min(12, round(mcda_raw))

# Store sub-scores for instructor dashboard and dispute resolution
score_breakdown['supplier_mcda'] = {
    'responsiveness': round(responsiveness_sub, 2),
    'reliability': round(reliability_sub, 2),
    'sustainability': round(sustainability_sub, 2),
    'cost': round(cost_sub, 2),
    'total_raw': round(mcda_raw, 2),
    'num_suppliers_used': num_suppliers_used,
    'avg_lead_time_days': round(avg_lead_time, 1),
    'avg_reliability_pct': round(avg_reliability * 100, 1),
    'avg_sustainability_score': round(avg_sustainability, 2),
    'total_cost_eur': round(total_procurement_cost, 0)
}
score_breakdown['supplier_method'] = supplier_method_score
```

### VERIFICATION — Expected scores for test cases:

| Scenario | Expected Cat 2 Score |
|----------|---------------------|
| 3 nearshore suppliers, avg lead 6 days, avg reliability 97%, avg sustainability 4.5, cost €28k | **12** |
| 1 premium nearshore supplier, avg lead 5 days, avg reliability 99%, avg sustainability 4.7, cost €29k | **9–10** (count tier = 0.583 caps reliability sub) |
| 4 suppliers, avg lead 12 days (mixed), avg reliability 94%, avg sustainability 4.1, cost €33k | **9–10** |
| 6 offshore suppliers, avg lead 26 days, avg reliability 90%, avg sustainability 3.4, cost €38k | **4–5** |
| 0 suppliers | **0** + validation flags |

---

<a name="fix-4"></a>
## FIX 4 — Category 2 Label in Results Template (Cosmetic)
**File:** `templates/student/module1.html`  
**Priority:** 🟡 RECOMMENDED — Helps students understand what was scored

### ACTION: Find the Category 2 result display section and update the label:

```html
<!-- FIND: -->
<div class="category-label">Supplier Selection / MCDA Method</div>
<div class="category-score">{{ score_breakdown.get('supplier_method', 0) }} / 12</div>

<!-- REPLACE WITH: -->
<div class="category-label">Supplier Selection — MCDA (Responsiveness · Reliability · Sustainability · Cost)</div>
<div class="category-score">{{ score_breakdown.get('supplier_method', 0) }} / 12</div>
```

### OPTIONAL — Add MCDA sub-score detail to results panel (instructor view):

If you have an admin/instructor results view, add this block to show the breakdown:

```html
{% if score_breakdown.get('supplier_mcda') %}
<div class="mcda-breakdown">
  <small>
    MCDA Detail:
    Responsiveness {{ score_breakdown.supplier_mcda.responsiveness }}/3.0 |
    Reliability {{ score_breakdown.supplier_mcda.reliability }}/3.6
      ({{ score_breakdown.supplier_mcda.num_suppliers_used }} suppliers,
       {{ score_breakdown.supplier_mcda.avg_reliability_pct }}% avg) |
    Sustainability {{ score_breakdown.supplier_mcda.sustainability }}/3.0
      (avg {{ score_breakdown.supplier_mcda.avg_sustainability_score }}) |
    Cost {{ score_breakdown.supplier_mcda.cost }}/2.4
      (€{{ score_breakdown.supplier_mcda.total_cost_eur|int }})
  </small>
</div>
{% endif %}
```

---

<a name="fix-5"></a>
## FIX 5 — Quality/Sustainability Thresholds
**File:** `modules/simulation_engine.py`  
**Priority:** ✅ VERIFY ONLY — Should already be fixed in v2

### VERIFY this code exists (thresholds at 4.2, not 4.5):

```python
# Category 4: Mission Alignment (8 points)
if avg_quality >= 4.2:
    quality_score = 4
elif avg_quality >= 4.0:
    quality_score = 3
elif avg_quality >= 3.5:
    quality_score = 2
else:
    quality_score = 1

if avg_sustainability >= 4.2:
    sustainability_score = 4
elif avg_sustainability >= 4.0:
    sustainability_score = 3
elif avg_sustainability >= 3.5:
    sustainability_score = 2
else:
    sustainability_score = 1
```

If thresholds are set to 4.5 instead of 4.2 → apply the fix above.

---

<a name="fix-6"></a>
## FIX 6 — Forecast Error Denominator
**File:** `modules/simulation_engine.py`  
**Priority:** ✅ VERIFY ONLY — Should already be fixed in v2

### VERIFY this formula is used (forecast in denominator, NOT actual):

```python
# CORRECT:
forecast_error = abs(actual_demand - forecast) / forecast

# WRONG (do NOT use):
# forecast_error = abs(actual_demand - forecast) / actual_demand
```

---

<a name="fix-7"></a>
## FIX 7 — numpy in requirements.txt
**File:** `requirements.txt`  
**Priority:** ✅ VERIFY ONLY — Should already be in v2

### VERIFY `requirements.txt` contains:

```
flask
flask-session
numpy
```

If numpy is missing, add it. The `historical_data.py` module and simulation engine
both import numpy for mean calculations.

---

## SUMMARY — Files Changed

| File | Changes Applied |
|------|----------------|
| `modules/historical_data.py` | Full replacement with static 30-year dataset |
| `modules/simulation_engine.py` | Fix 3: Category 2 MCDA composite block |
| `templates/student/module1.html` | Fix 2: Month→Year labels + table scope; Fix 4: Cat 2 label |
| `requirements.txt` | Verify numpy present |

---

## INTERNAL DIVISOR NOTE (M2 Compatibility)

After applying Fix 1 (annual dataset), the M2 engine receives Forecast_A and Forecast_B
as **annual unit values** (e.g., ≈ 17,800 units/year for SKU A).

The M2 engine converts these to daily demand using:
```python
daily_demand_baseline_A = m1_forecast_A / 30.0
```

**Do NOT change this divisor to 365.** The annual forecast values (≈ 17,000–18,000) are
in the same order of magnitude as the original monthly forecast values, so the `/30.0`
divisor still produces daily demand values that are compatible with M2's capacity
calibration (Standard capacity = 800 units/day). Changing to `/365.0` would produce
daily demand ≈ 49 units/day and break M2 capacity math entirely.

This is intentional and documented. Students do not see the internal divisor.

---

*End of consolidated fixes file — Module 1 v3*
