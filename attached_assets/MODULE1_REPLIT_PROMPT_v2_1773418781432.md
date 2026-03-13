# REPLIT BUILD PROMPT — MODULE 1: GLOBAL SOURCING (v2)
## Complete Implementation with Interactive Visualizations (FIXED — Opus 4.6 Review)

**Course:** SCM 4330 SCM Applications  
**Module:** Module 1 — Global Sourcing & Procurement (55 points)  
**Build Type:** Extension to Foundation (builds on existing auth/database)  
**Enhancement Credits:** 
- Interactive Visualizations: Gemini 3 Pro (React/Recharts)
- Simulation Engine & Grading: Claude Sonnet 4.5 (Complete Logic)
- Integration: Hybrid Best-of-Both-Worlds

---

## 📋 TABLE OF CONTENTS

1. [What You're Building](#what-youre-building)
2. [Technical Stack](#technical-stack)
3. [File Structure](#file-structure)
4. [Complete Implementation Steps](#complete-implementation-steps)
5. [Supplier Database](#supplier-database)
6. [Simulation Engine (Complete Logic)](#simulation-engine)
7. [Grading Algorithm (55 Points)](#grading-algorithm)
8. [Interactive Visualizations](#interactive-visualizations)
9. [Routes Integration](#routes-integration)
10. [Templates](#templates)
11. [Testing Checklist](#testing-checklist)
12. [Deployment](#deployment)

---

## 🎯 WHAT YOU'RE BUILDING

### Core Features

**Decision Interface:**
- ✅ **Forecasting Tool** — Time series methods with historical data
- ✅ **Supplier Selection** — 8 global suppliers with MCDA framework
- ✅ **Transport Mode Selection** — Truck/Rail/Ocean/Air with cost-lead-CO₂ tradeoffs
- ✅ **Batching Strategy** — 1/2/4 deliveries per supplier
- ✅ **Assurance Packages** — Standard/Priority/Premium reliability boosters
- ✅ **Market Intelligence** — Optional €10K report to reduce demand uncertainty

**Interactive Visualizations (Gemini):**
- ✨ **3D Bubble Chart** — Cost vs Quality vs Sustainability using Recharts
- ✨ **Real-time Trade-off Analysis** — Interactive supplier comparison
- ✨ **Regional Filtering** — Nearshore vs Offshore color-coded
- ✨ **Hover Details** — Full supplier specs on mouseover

**Simulation Engine (Claude):**
- 🎯 **Deterministic Seeding** — Same student, same inputs → same results
- 🎯 **Stochastic Demand** — Realistic uncertainty (σ = 10% / 6%)
- 🎯 **Quantity Discounts** — 2% / 4% tiers on volume
- 🎯 **Reliability Simulation** — Late delivery penalties
- 🎯 **Comprehensive Grading** — 55-point rubric with 5 categories

**Quality Assurance:**
- ✅ **Practice Runs** — Unlimited attempts with instant feedback
- ✅ **Final Submission** — Locks module, triggers next unlock
- ✅ **Detailed Feedback** — Score breakdown + improvement suggestions
- ✅ **Model Solutions** — A/B/C grade examples

---

## 💻 TECHNICAL STACK

| Component | Technology | Why |
|-----------|------------|-----|
| **Backend** | Python Flask | Simple, Replit-friendly |
| **Database** | SQLite | No external service, persistent |
| **Frontend** | Jinja2 + HTML/CSS | Server-side rendering |
| **Visualizations** | React + Recharts (CDN) | Interactive charts, no build step |
| **Charts** | Chart.js (optional) | Additional KPI dashboards |
| **Auth** | Flask sessions | Inherited from foundation |

**CRITICAL:** Use CDN-based React/Recharts via Babel Standalone. NO Webpack, NO npm build process.

---

## 📁 FILE STRUCTURE

```
veloce-scm-simulation/
├── modules/
│   ├── engine_module1.py          # NEW: Complete simulation engine (400 lines)
│   └── historical_data.py         # NEW: 24-month demand data generator
├── routes/
│   └── student.py                 # UPDATE: Add M1 practice/submit handlers
├── static/
│   ├── css/
│   │   └── module1.css            # NEW: M1-specific styling
│   └── js/
│       └── (React via CDN in HTML)
└── templates/
    └── student/
        ├── module1.html           # NEW: Decision interface + Recharts viz
        ├── module1_results.html   # NEW: KPI dashboard post-run
        └── module1_locked.html    # REUSE: From foundation
```

---

## 🗄️ SUPPLIER DATABASE (8 Suppliers)

### Complete Supplier Specifications

| ID | Company | Country | Material | Price €/kg | Lead (days) | OT% | Sust | Quality | Certifications |
|----|---------|---------|----------|------------|-------------|-----|------|---------|----------------|
| **PT1** | Lusitex Premium | Portugal | Cotton/Nylon | 3.55 / 5.10 | 5 | 97% | 4.4 | 4.6 | ISO9001, ISO14001, OEKO-TEX |
| **PT2** | PortoWeave Organic | Portugal | Cotton/Nylon | 3.85 / 5.25 | 6 | 96% | 4.8 | 4.7 | ISO9001, ISO14001, GOTS, OEKO-TEX |
| **TR1** | Anatolia Mills | Turkey | Cotton/Nylon | 3.20 / 4.95 | 8 | 94% | 3.8 | 4.0 | ISO9001, ISO14001 |
| **TR2** | Bosporus Textiles | Turkey | Cotton/Nylon | 3.35 / 5.05 | 9 | 95% | 4.1 | 4.2 | ISO9001, ISO14001, OEKO-TEX |
| **VN1** | Saigon Spinners | Vietnam | Cotton/Nylon | 2.85 / 4.70 | 28 | 88% | 3.2 | 3.6 | ISO9001 |
| **VN2** | Hanoi EcoWeave | Vietnam | Cotton/Nylon | 3.05 / 4.85 | 30 | 90% | 4.0 | 3.8 | ISO9001, ISO14001, OEKO-TEX |
| **MX1** | Monterrey KnitWorks | Mexico | Cotton/Nylon | 3.10 / 4.60 | 24 | 91% | 3.5 | 3.7 | ISO9001 |
| **MX2** | Yucatan SustainTex | Mexico | Cotton/Nylon | 3.25 / 4.75 | 26 | 92% | 4.2 | 3.9 | ISO9001, ISO14001 |

### Transport Modes by Region

**Nearshore (Portugal, Turkey):**
- Truck: €0.18/kg, 2-5 days, CO₂=2
- Rail: €0.12/kg, 4-8 days, CO₂=1
- Air: €0.95/kg, 4-9 days, CO₂=9

**Offshore (Vietnam, Mexico):**
- Ocean: €0.08/kg, 18-35 days, CO₂=3
- Air: €0.95/kg, 4-9 days, CO₂=9

**Reliability Bonuses:**
- Air: +2 percentage points
- Rail: +1 percentage point

### Assurance Packages

| Package | Cost | Reliability Boost | Max Reliability |
|---------|------|-------------------|-----------------|
| Standard | +0pp | +0% | Base |
| Priority | +3pp | +4% | 99% cap |
| Premium | +6pp | +8% | 99% cap |

### Quantity Discounts

**Cotton:**
- ≥20,000 kg → 2% discount
- ≥50,000 kg → 4% discount

**Nylon:**
- ≥10,000 kg → 2% discount
- ≥25,000 kg → 4% discount

### Market Intelligence Report

- **Cost:** €10,000
- **Effect:** Reduces demand σ from (A: 10%, B: 6%) → (A: 7%, B: 4%)

---

## 🚀 COMPLETE IMPLEMENTATION STEPS

### STEP 1: Historical Data Generator (15 minutes)

**File: `modules/historical_data.py`**

```python
import numpy as np

def generate_historical_demand(seed=12345):
    """
    Generate 24 months of historical demand for SKU A and SKU B.
    This data will be used by students for forecasting.
    
    Returns:
        dict: {
            'months': [1, 2, ..., 24],
            'sku_a': [demand values],
            'sku_b': [demand values],
            'trend_a': float,
            'trend_b': float
        }
    """
    np.random.seed(seed)
    
    months = list(range(1, 25))
    
    # SKU A: Upward trend with seasonal pattern
    base_a = 15000
    trend_a = 150  # units per month
    seasonal_amplitude_a = 2000
    noise_sigma_a = 800
    
    sku_a = []
    for month in months:
        trend_component = base_a + trend_a * month
        seasonal_component = seasonal_amplitude_a * np.sin(2 * np.pi * month / 12)
        noise = np.random.normal(0, noise_sigma_a)
        demand = max(0, int(trend_component + seasonal_component + noise))
        sku_a.append(demand)
    
    # SKU B: Slight upward trend, less seasonality
    base_b = 8000
    trend_b = 50  # units per month
    seasonal_amplitude_b = 800
    noise_sigma_b = 400
    
    sku_b = []
    for month in months:
        trend_component = base_b + trend_b * month
        seasonal_component = seasonal_amplitude_b * np.sin(2 * np.pi * month / 12)
        noise = np.random.normal(0, noise_sigma_b)
        demand = max(0, int(trend_component + seasonal_component + noise))
        sku_b.append(demand)
    
    return {
        'months': months,
        'sku_a': sku_a,
        'sku_b': sku_b,
        'trend_a': trend_a,
        'trend_b': trend_b,
        'data_points': list(zip(months, sku_a, sku_b))
    }

def get_forecast_data_for_display():
    """
    Returns historical data formatted for display in templates.
    """
    data = generate_historical_demand()
    
    # Format for Chart.js or table display
    chart_data = {
        'labels': [f'Month {m}' for m in data['months']],
        'datasets': [
            {
                'label': 'SKU A (Trend Tee)',
                'data': data['sku_a'],
                'borderColor': '#667eea',
                'fill': False
            },
            {
                'label': 'SKU B (Core Jogger)',
                'data': data['sku_b'],
                'borderColor': '#10b981',
                'fill': False
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

### STEP 2: Complete Simulation Engine (60 minutes)

**File: `modules/engine_module1.py`**

```python
"""
Module 1 Simulation Engine — Global Sourcing & Procurement
Veloce Wear SCM Simulation (FIXED — Opus 4.6 Review)

FIXES APPLIED:
  [CRITICAL-2] Forecast error division-by-zero → use forecast as denominator + early guard
  [CRITICAL-4] Quality/sustainability threshold 4.5 → 4.2 (matches achievable supplier mix)
  [MINOR] num_batches clamped to max(1, ...) to prevent zero-batch edge case
  [MINOR] Negative kg_allocated rejected
  [MINOR] round(total_score) instead of bare sum to avoid float truncation
  [MINOR] Zero-supplier edge case adds validation flag
"""

import random
import numpy as np
from modules.helpers import stable_hash, safe_json_load

# ============================================================
# SUPPLIER DATABASE (8 Suppliers — unchanged)
# ============================================================

SUPPLIERS = {
    'PT1': {
        'name': 'Lusitex Premium',
        'country': 'Portugal',
        'cotton_price': 3.55,
        'nylon_price': 5.10,
        'lead_time_mean': 5,
        'lead_time_sd': 1,
        'reliability_base': 0.97,
        'sustainability': 4.4,
        'quality': 4.6,
        'certifications': ['ISO9001', 'ISO14001', 'OEKO-TEX'],
        'region': 'nearshore'
    },
    'PT2': {
        'name': 'PortoWeave Organic',
        'country': 'Portugal',
        'cotton_price': 3.85,
        'nylon_price': 5.25,
        'lead_time_mean': 6,
        'lead_time_sd': 1,
        'reliability_base': 0.96,
        'sustainability': 4.8,
        'quality': 4.7,
        'certifications': ['ISO9001', 'ISO14001', 'GOTS', 'OEKO-TEX'],
        'region': 'nearshore'
    },
    'TR1': {
        'name': 'Anatolia Mills',
        'country': 'Turkey',
        'cotton_price': 3.20,
        'nylon_price': 4.95,
        'lead_time_mean': 8,
        'lead_time_sd': 2,
        'reliability_base': 0.94,
        'sustainability': 3.8,
        'quality': 4.0,
        'certifications': ['ISO9001', 'ISO14001'],
        'region': 'nearshore'
    },
    'TR2': {
        'name': 'Bosporus Textiles',
        'country': 'Turkey',
        'cotton_price': 3.35,
        'nylon_price': 5.05,
        'lead_time_mean': 9,
        'lead_time_sd': 2,
        'reliability_base': 0.95,
        'sustainability': 4.1,
        'quality': 4.2,
        'certifications': ['ISO9001', 'ISO14001', 'OEKO-TEX'],
        'region': 'nearshore'
    },
    'VN1': {
        'name': 'Saigon Spinners',
        'country': 'Vietnam',
        'cotton_price': 2.85,
        'nylon_price': 4.70,
        'lead_time_mean': 28,
        'lead_time_sd': 4,
        'reliability_base': 0.88,
        'sustainability': 3.2,
        'quality': 3.6,
        'certifications': ['ISO9001'],
        'region': 'offshore'
    },
    'VN2': {
        'name': 'Hanoi EcoWeave',
        'country': 'Vietnam',
        'cotton_price': 3.05,
        'nylon_price': 4.85,
        'lead_time_mean': 30,
        'lead_time_sd': 5,
        'reliability_base': 0.90,
        'sustainability': 4.0,
        'quality': 3.8,
        'certifications': ['ISO9001', 'ISO14001', 'OEKO-TEX'],
        'region': 'offshore'
    },
    'MX1': {
        'name': 'Monterrey KnitWorks',
        'country': 'Mexico',
        'cotton_price': 3.10,
        'nylon_price': 4.60,
        'lead_time_mean': 24,
        'lead_time_sd': 3,
        'reliability_base': 0.91,
        'sustainability': 3.5,
        'quality': 3.7,
        'certifications': ['ISO9001'],
        'region': 'offshore'
    },
    'MX2': {
        'name': 'Yucatan SustainTex',
        'country': 'Mexico',
        'cotton_price': 3.25,
        'nylon_price': 4.75,
        'lead_time_mean': 26,
        'lead_time_sd': 3,
        'reliability_base': 0.92,
        'sustainability': 4.2,
        'quality': 3.9,
        'certifications': ['ISO9001', 'ISO14001'],
        'region': 'offshore'
    }
}

# Transport modes
TRANSPORT_MODES = {
    'nearshore': {
        'truck': {'cost_per_kg': 0.18, 'time_min': 2, 'time_max': 5, 'co2': 2, 'reliability_bonus': 0},
        'rail': {'cost_per_kg': 0.12, 'time_min': 4, 'time_max': 8, 'co2': 1, 'reliability_bonus': 0.01},
        'air': {'cost_per_kg': 0.95, 'time_min': 4, 'time_max': 9, 'co2': 9, 'reliability_bonus': 0.02}
    },
    'offshore': {
        'ocean': {'cost_per_kg': 0.08, 'time_min': 18, 'time_max': 35, 'co2': 3, 'reliability_bonus': 0},
        'air': {'cost_per_kg': 0.95, 'time_min': 4, 'time_max': 9, 'co2': 9, 'reliability_bonus': 0.02}
    }
}

# Assurance packages
ASSURANCE_PACKAGES = {
    'standard': {'price_premium': 0.00, 'reliability_boost': 0.00},
    'priority': {'price_premium': 0.03, 'reliability_boost': 0.04},
    'premium': {'price_premium': 0.06, 'reliability_boost': 0.08}
}

# Configuration constants
ORDER_COST_PER_BATCH = 200
MARKET_REPORT_COST = 10000
DEMAND_SIGMA_A = 0.10
DEMAND_SIGMA_B = 0.06
DEMAND_SIGMA_A_WITH_REPORT = 0.07
DEMAND_SIGMA_B_WITH_REPORT = 0.04

# BOM and scrap factors
SKU_A_COTTON_KG = 0.23
SKU_B_NYLON_KG = 0.42
SKU_A_SCRAP_FACTOR = 1.06
SKU_B_SCRAP_FACTOR = 1.08


def run_module1_simulation(user_id, decisions, config, run_number):
    """
    Complete Module 1 simulation engine.

    Args:
        user_id: Student ID for deterministic seeding
        decisions: Dict containing all student decisions
        config: System configuration
        run_number: Practice run number (for seed variation)

    Returns:
        Dict containing score, KPIs, and detailed feedback
    """

    # ========================================
    # 1. SETUP DETERMINISTIC SEED
    # ========================================
    seed_offset = int(config.get('seed_offset', 1000))
    module_offset = 100  # M1 offset
    seed = stable_hash(str(user_id)) + seed_offset + module_offset + run_number
    random.seed(seed)
    np.random.seed(seed % (2**31))  # numpy seed must be < 2^31

    # ========================================
    # 2. EXTRACT DECISIONS
    # ========================================
    forecast_A = float(decisions.get('forecast_A', 0))
    forecast_B = float(decisions.get('forecast_B', 0))
    forecast_method = decisions.get('forecast_method', 'unknown')
    has_report = decisions.get('purchase_report', False)
    allocations = decisions.get('allocations', [])
    justification = decisions.get('justification', '')

    # ========================================
    # 2b. EARLY INPUT VALIDATION  [FIX: added]
    # ========================================
    validation_flags = []

    if forecast_A <= 0:
        validation_flags.append("SKU A forecast must be positive")
    if forecast_B <= 0:
        validation_flags.append("SKU B forecast must be positive")

    # If forecasts are zero/negative, we can still run the simulation
    # but set forecasts to a safe floor so math doesn't break
    forecast_A = max(1.0, forecast_A)
    forecast_B = max(1.0, forecast_B)

    # ========================================
    # 3. SIMULATE ACTUAL DEMAND (WITH UNCERTAINTY)
    # ========================================
    if has_report:
        sigma_A = DEMAND_SIGMA_A_WITH_REPORT
        sigma_B = DEMAND_SIGMA_B_WITH_REPORT
    else:
        sigma_A = DEMAND_SIGMA_A
        sigma_B = DEMAND_SIGMA_B

    actual_A = max(1, int(np.random.normal(forecast_A, sigma_A * forecast_A)))  # FIX: floor 1, not 0
    actual_B = max(1, int(np.random.normal(forecast_B, sigma_B * forecast_B)))  # FIX: floor 1, not 0

    # FIX [CRITICAL-2]: Use forecast as denominator (avoids div-by-zero,
    # measures error relative to the student's controllable input)
    forecast_error_A = abs(actual_A - forecast_A) / forecast_A
    forecast_error_B = abs(actual_B - forecast_B) / forecast_B
    avg_forecast_error = (forecast_error_A + forecast_error_B) / 2

    # ========================================
    # 4. CALCULATE MATERIAL REQUIREMENTS
    # ========================================
    req_cotton_kg = forecast_A * SKU_A_COTTON_KG * SKU_A_SCRAP_FACTOR
    req_nylon_kg = forecast_B * SKU_B_NYLON_KG * SKU_B_SCRAP_FACTOR

    # ========================================
    # 5. PROCESS SUPPLIER ALLOCATIONS & CALCULATE COSTS
    # ========================================
    total_material_cost = 0
    total_transport_cost = 0
    total_order_cost = 0

    total_cotton_allocated = 0
    total_nylon_allocated = 0

    weighted_lead_time = 0
    weighted_reliability = 0
    weighted_sustainability = 0
    weighted_quality = 0
    total_kg = 0

    total_co2 = 0

    late_deliveries = 0
    total_deliveries = 0

    for alloc in allocations:
        supplier_id = alloc.get('supplier_id')
        material_type = alloc.get('material_type')
        kg_allocated = float(alloc.get('kg', 0))
        transport_mode = alloc.get('transport_mode')
        assurance_package = alloc.get('assurance_package', 'standard')
        num_batches = max(1, int(alloc.get('num_batches', 1)))  # FIX: clamp to ≥1

        if kg_allocated <= 0:  # FIX: reject negative AND zero
            continue

        # Get supplier data
        supplier = SUPPLIERS.get(supplier_id)
        if not supplier:
            validation_flags.append(f"Invalid supplier: {supplier_id}")
            continue

        # Validate transport mode for region
        region = supplier['region']
        if region not in TRANSPORT_MODES or transport_mode not in TRANSPORT_MODES[region]:
            validation_flags.append(
                f"Invalid transport mode {transport_mode} for {supplier['name']} ({region})"
            )
            continue

        transport = TRANSPORT_MODES[region][transport_mode]

        # Get material price
        if material_type == 'cotton':
            base_price = supplier['cotton_price']
            total_cotton_allocated += kg_allocated
        elif material_type == 'nylon':
            base_price = supplier['nylon_price']
            total_nylon_allocated += kg_allocated
        else:
            validation_flags.append(f"Invalid material type: {material_type}")
            continue

        # Apply quantity discounts
        discount = 0
        if material_type == 'cotton':
            if kg_allocated >= 50000:
                discount = 0.04
            elif kg_allocated >= 20000:
                discount = 0.02
        elif material_type == 'nylon':
            if kg_allocated >= 25000:
                discount = 0.04
            elif kg_allocated >= 10000:
                discount = 0.02

        effective_price = base_price * (1 - discount)

        # Apply assurance package premium
        assurance = ASSURANCE_PACKAGES.get(assurance_package, ASSURANCE_PACKAGES['standard'])
        effective_price *= (1 + assurance['price_premium'])

        # Calculate costs
        material_cost = kg_allocated * effective_price
        transport_cost = kg_allocated * transport['cost_per_kg']
        order_cost = num_batches * ORDER_COST_PER_BATCH

        total_material_cost += material_cost
        total_transport_cost += transport_cost
        total_order_cost += order_cost

        # Calculate weighted metrics
        total_kg += kg_allocated
        weighted_lead_time += supplier['lead_time_mean'] * kg_allocated

        # Calculate effective reliability
        effective_reliability = min(
            0.99,
            supplier['reliability_base']
            + transport['reliability_bonus']
            + assurance['reliability_boost']
        )
        weighted_reliability += effective_reliability * kg_allocated
        weighted_sustainability += supplier['sustainability'] * kg_allocated
        weighted_quality += supplier['quality'] * kg_allocated

        # Calculate CO2
        total_co2 += kg_allocated * transport['co2']

        # Simulate delivery reliability
        total_deliveries += num_batches
        for _ in range(num_batches):
            if random.random() > effective_reliability:
                late_deliveries += 1

    # FIX: Flag if student used zero suppliers
    num_suppliers_used = len([a for a in allocations if float(a.get('kg', 0)) > 0])
    if num_suppliers_used == 0:
        validation_flags.append("No supplier allocations provided")

    # Add market report cost if purchased
    if has_report:
        total_order_cost += MARKET_REPORT_COST

    # Calculate total procurement cost
    total_procurement_cost = total_material_cost + total_transport_cost + total_order_cost

    # Calculate weighted averages
    avg_lead_time = weighted_lead_time / total_kg if total_kg > 0 else 0
    avg_reliability = weighted_reliability / total_kg if total_kg > 0 else 0
    avg_sustainability = weighted_sustainability / total_kg if total_kg > 0 else 0
    avg_quality = weighted_quality / total_kg if total_kg > 0 else 0

    # ========================================
    # 6. CALCULATE PENALTIES
    # ========================================
    late_delivery_penalty = 0
    if late_deliveries > 0:
        late_delivery_penalty = late_deliveries * 500
        total_procurement_cost += late_delivery_penalty

    # Check allocation coverage
    cotton_coverage = (total_cotton_allocated / req_cotton_kg) if req_cotton_kg > 0 else 0
    nylon_coverage = (total_nylon_allocated / req_nylon_kg) if req_nylon_kg > 0 else 0

    if cotton_coverage < 1.0:
        validation_flags.append(
            f"Cotton allocation insufficient: {cotton_coverage*100:.1f}% of required"
        )
    if nylon_coverage < 1.0:
        validation_flags.append(
            f"Nylon allocation insufficient: {nylon_coverage*100:.1f}% of required"
        )

    # ========================================
    # 7. GRADING (55 POINTS TOTAL)
    # ========================================
    score_breakdown = {}

    # Category 1: Forecasting & Planning Logic (15 points)
    forecasting_score = 0
    if avg_forecast_error <= 0.05:
        forecasting_score = 15
    elif avg_forecast_error <= 0.10:
        forecasting_score = 12
    elif avg_forecast_error <= 0.15:
        forecasting_score = 9
    else:
        forecasting_score = 6

    # Bonus for appropriate method
    if forecast_method in ['linear_regression', 'exponential_smoothing'] and forecasting_score > 0:
        forecasting_score = min(15, forecasting_score + 1)

    score_breakdown['forecasting'] = forecasting_score

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

    # Category 3: Cost/Service/Risk Trade-offs (12 points)
    if total_procurement_cost < 30000:
        cost_score = 6
    elif total_procurement_cost < 35000:
        cost_score = 5
    elif total_procurement_cost < 40000:
        cost_score = 4
    else:
        cost_score = 2

    if avg_reliability >= 0.96:
        reliability_score = 6
    elif avg_reliability >= 0.94:
        reliability_score = 5
    elif avg_reliability >= 0.92:
        reliability_score = 3
    else:
        reliability_score = 2

    tradeoffs_score = cost_score + reliability_score
    score_breakdown['tradeoffs'] = tradeoffs_score

    # Category 4: Quality + Sustainability + Compliance (8 points)
    # FIX [CRITICAL-4]: Lowered top threshold from 4.5 → 4.2
    #   Best achievable mix (PT2+TR2+PT1+TR1) gets ~4.4 quality, ~4.3 sust
    #   Old code gave 3+3=6/8; fixed code gives 4+4=8/8 → 55/55 achievable
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

    quality_sust_score = quality_score + sustainability_score
    score_breakdown['quality_sustainability'] = quality_sust_score

    # Category 5: Validity + Justification (8 points)
    validity_points = 5
    if len(validation_flags) > 0:
        validity_points = max(0, 5 - len(validation_flags))
    if cotton_coverage < 0.95 or nylon_coverage < 0.95:
        validity_points = max(0, validity_points - 2)

    justification_points = 0
    if len(justification) >= 500:
        justification_points = 3
    elif len(justification) >= 300:
        justification_points = 2
    elif len(justification) >= 150:
        justification_points = 1

    validity_score = validity_points + justification_points
    score_breakdown['validity_justification'] = validity_score

    # Calculate total score — use round() not int() to avoid float truncation
    total_score = round(sum(score_breakdown.values()))

    # Determine letter grade
    if total_score >= 51:
        letter_grade = 'A'
    elif total_score >= 45:
        letter_grade = 'B'
    elif total_score >= 38:
        letter_grade = 'C'
    elif total_score >= 30:
        letter_grade = 'D'
    else:
        letter_grade = 'F'

    # ========================================
    # 8. GENERATE FEEDBACK
    # ========================================
    feedback_items = []

    if avg_forecast_error > 0.10:
        suggestion = 'linear regression' if forecast_method != 'linear_regression' else 'exponential smoothing'
        feedback_items.append(
            f"Forecasting error was {avg_forecast_error*100:.1f}%. "
            f"Consider using {suggestion} for better accuracy."
        )

    if total_procurement_cost > 35000:
        feedback_items.append(
            f"Total procurement cost (€{total_procurement_cost:,.0f}) is high. "
            "Consider nearshore suppliers or rail transport to reduce costs."
        )

    if avg_reliability < 0.94:
        feedback_items.append(
            f"Average reliability ({avg_reliability*100:.1f}%) is below target. "
            "Consider Priority/Premium assurance packages."
        )

    if late_deliveries > 0:
        feedback_items.append(
            f"{late_deliveries} late deliveries incurred €{late_delivery_penalty:,.0f} in penalties."
        )

    if avg_sustainability < 4.0:
        feedback_items.append(
            f"Sustainability index ({avg_sustainability:.1f}/5.0) could be improved "
            "by selecting certified suppliers (GOTS, OEKO-TEX)."
        )

    # ========================================
    # 9. RETURN RESULTS
    # ========================================
    return {
        'score': total_score,
        'max_score': 55,
        'letter_grade': letter_grade,
        'score_breakdown': score_breakdown,
        'kpis': {
            'total_procurement_cost': round(total_procurement_cost, 2),
            'material_cost': round(total_material_cost, 2),
            'transport_cost': round(total_transport_cost, 2),
            'order_cost': round(total_order_cost, 2),
            'late_delivery_penalty': round(late_delivery_penalty, 2),
            'forecast_A': forecast_A,
            'forecast_B': forecast_B,
            'actual_A': actual_A,
            'actual_B': actual_B,
            'forecast_error_pct': round(avg_forecast_error * 100, 1),
            'avg_lead_time_days': round(avg_lead_time, 1),
            'avg_reliability_pct': round(avg_reliability * 100, 1),
            'avg_sustainability': round(avg_sustainability, 2),
            'avg_quality': round(avg_quality, 2),
            'total_co2': round(total_co2, 1),
            'cotton_allocated_kg': round(total_cotton_allocated, 1),
            'nylon_allocated_kg': round(total_nylon_allocated, 1),
            'cotton_required_kg': round(req_cotton_kg, 1),
            'nylon_required_kg': round(req_nylon_kg, 1),
            'late_deliveries': late_deliveries,
            'total_deliveries': total_deliveries
        },
        'validation_flags': validation_flags,
        'feedback': feedback_items,
        'has_report': has_report,
        'forecast_method': forecast_method
    }

```

---

### STEP 3: Routes Integration (20 minutes)

**Update: `routes/student.py`**

Add these handler functions to existing student.py:

```python
# Add to existing routes/student.py
# FIX (Opus 4.6): Includes shared helpers used by M1, M2, and M3

from modules.engine_module1 import run_module1_simulation
from modules.historical_data import get_forecast_data_for_display

# ============================================================
# SHARED HELPERS (used by M1, M2, M3 — add once here)
# FIX (Opus 4.6): _get_module_data prevents double-JSON-load bug
# ============================================================

def _get_module_data(db, user_id, module_key):
    """
    Get a module's submission data as a dict.

    CRITICAL FIX: get_final_submission() already calls safe_json_load()
    on the raw DB text, so submission['submission_json'] is ALREADY a dict.
    Do NOT call safe_json_load() again — that would try json.loads(dict),
    which raises TypeError and returns the default {}, silently losing all data.
    """
    submission = get_final_submission(db, user_id, module_key)
    if submission and submission.get('submission_json'):
        return submission['submission_json']  # Already a dict!
    return {}


def _get_config(db):
    """Load config key-value pairs from database."""
    cursor = db.cursor()
    cursor.execute("SELECT key, value FROM config")
    return {row[0]: row[1] for row in cursor.fetchall()}


def _save_simulation_run(db, user_id, module_key, run_number, decisions,
                         results, is_final=False):
    """Save a practice or final run to the simulation_runs table."""
    cursor = db.cursor()
    cursor.execute("""
        INSERT INTO simulation_runs
        (user_id, module_key, run_number, decisions_json, kpi_json, score, is_final, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (user_id, module_key, run_number,
          safe_json_dump(decisions),
          safe_json_dump(results['kpis']),
          results['score'],
          1 if is_final else 0,
          now_iso()))
    return cursor.lastrowid


def _save_final_submission(db, user_id, module_key, run_id, decisions, results):
    """Save final submission to module_submissions table."""
    cursor = db.cursor()
    submission_json = build_submission_json(
        module_key, decisions, results['kpis'], results['score_breakdown'],
        decisions.get('justification', ''), run_id,
        {'timestamp': now_iso(), 'app_version': '2.0.0'}
    )
    cursor.execute("""
        INSERT INTO module_submissions
        (user_id, module_key, score, max_score, submitted_at, submission_json)
        VALUES (?, ?, ?, 55, ?, ?)
        ON CONFLICT(user_id, module_key) DO UPDATE SET
            score = ?, submitted_at = ?, submission_json = ?
    """, (user_id, module_key, results['score'], now_iso(),
          safe_json_dump(submission_json),
          results['score'], now_iso(), safe_json_dump(submission_json)))


# ============================================================
# M1 DECISION EXTRACTION
# ============================================================

def _extract_m1_decisions(form):
    """Extract Module 1 decisions from POST form data."""
    forecast_A = float(form.get('forecast_A', 0) or 0)
    forecast_B = float(form.get('forecast_B', 0) or 0)
    forecast_method = form.get('forecast_method', 'unknown')
    purchase_report = form.get('purchase_report') == 'yes'

    allocations = []
    for i in range(1, 11):
        supplier_id = form.get(f'supp{i}_id')
        if not supplier_id:
            continue
        kg = float(form.get(f'supp{i}_kg', 0) or 0)
        if kg <= 0:
            continue
        allocations.append({
            'supplier_id': supplier_id,
            'material_type': form.get(f'supp{i}_material', 'cotton'),
            'kg': kg,
            'transport_mode': form.get(f'supp{i}_transport', 'truck'),
            'assurance_package': form.get(f'supp{i}_assurance', 'standard'),
            'num_batches': int(form.get(f'supp{i}_batches', 1) or 1)
        })

    return {
        'forecast_A': forecast_A,
        'forecast_B': forecast_B,
        'forecast_method': forecast_method,
        'purchase_report': purchase_report,
        'allocations': allocations,
        'justification': form.get('justification', '').strip()
    }


# ============================================================
# M1 ROUTES
# ============================================================

@bp.route('/module/M1', methods=['GET'])
@login_required
def module_m1():
    """Module 1 decision interface"""
    user_id = session['user_id']
    db = get_db()

    if not module_is_unlocked(db, user_id, 'M1'):
        flash('Module 1 is locked', 'warning')
        return redirect(url_for('student.dashboard'))

    final_submission = get_final_submission(db, user_id, 'M1')
    is_submitted = final_submission is not None
    forecast_data = get_forecast_data_for_display()

    cursor = db.cursor()
    cursor.execute("""
        SELECT run_number, score, created_at, kpi_json
        FROM simulation_runs
        WHERE user_id = ? AND module_key = 'M1' AND is_final = 0
        ORDER BY run_number DESC LIMIT 10
    """, (user_id,))

    practice_runs = []
    for row in cursor.fetchall():
        kpis = safe_json_load(row[3], {})
        practice_runs.append({
            'run_number': row[0], 'score': row[1],
            'created_at': row[2], 'total_cost': kpis.get('total_procurement_cost', 0)
        })

    return render_template('student/module1.html',
                           is_submitted=is_submitted,
                           final_submission=final_submission,
                           forecast_data=forecast_data,
                           practice_runs=practice_runs)


@bp.route('/module/M1/practice', methods=['POST'])
@login_required
def module_m1_practice():
    """Run M1 practice simulation"""
    user_id = session['user_id']
    db = get_db()

    if not module_is_unlocked(db, user_id, 'M1'):
        flash('Module 1 is locked', 'danger')
        return redirect(url_for('student.dashboard'))
    if has_final_submission(db, user_id, 'M1'):
        flash('Module 1 already submitted', 'warning')
        return redirect(url_for('student.module_m1'))

    decisions = _extract_m1_decisions(request.form)
    run_number = next_run_number(db, user_id, 'M1')
    config = _get_config(db)

    try:
        results = run_module1_simulation(user_id, decisions, config, run_number)
    except Exception as e:
        flash(f'Simulation error: {str(e)}. Please check your inputs.', 'danger')
        return redirect(url_for('student.module_m1'))

    _save_simulation_run(db, user_id, 'M1', run_number, decisions, results)
    db.commit()
    return redirect(url_for('student.module_m1_results', run_number=run_number))


@bp.route('/module/M1/submit', methods=['POST'])
@login_required
def module_m1_submit():
    """Submit M1 final"""
    user_id = session['user_id']
    db = get_db()

    if not module_is_unlocked(db, user_id, 'M1'):
        flash('Module 1 is locked', 'danger')
        return redirect(url_for('student.dashboard'))
    if has_final_submission(db, user_id, 'M1'):
        flash('Module 1 already submitted', 'warning')
        return redirect(url_for('student.module_m1'))

    decisions = _extract_m1_decisions(request.form)
    run_number = next_run_number(db, user_id, 'M1')
    config = _get_config(db)

    try:
        results = run_module1_simulation(user_id, decisions, config, run_number)
    except Exception as e:
        flash(f'Simulation error: {str(e)}. Please check your inputs.', 'danger')
        return redirect(url_for('student.module_m1'))

    run_id = _save_simulation_run(db, user_id, 'M1', run_number, decisions, results, is_final=True)
    _save_final_submission(db, user_id, 'M1', run_id, decisions, results)
    db.commit()

    flash('Module 1 submitted successfully!', 'success')
    return redirect(url_for('student.module_m1_results', run_number=run_number, final=1))


@bp.route('/module/M1/results/<int:run_number>')
@login_required
def module_m1_results(run_number):
    """Display M1 results"""
    user_id = session['user_id']
    db = get_db()
    is_final = request.args.get('final', '0') == '1'

    cursor = db.cursor()
    cursor.execute("""
        SELECT decisions_json, kpi_json, score, is_final, created_at
        FROM simulation_runs
        WHERE user_id = ? AND module_key = 'M1' AND run_number = ?
    """, (user_id, run_number))

    row = cursor.fetchone()
    if not row:
        flash('Run not found', 'danger')
        return redirect(url_for('student.module_m1'))

    decisions = safe_json_load(row[0], {})
    kpis = safe_json_load(row[1], {})
    score = row[2]

    score_breakdown = {}
    feedback = []
    if is_final:
        submission = get_final_submission(db, user_id, 'M1')
        if submission:
            submission_data = submission.get('submission_json', {})
            score_breakdown = submission_data.get('score_breakdown', {})
            feedback = submission_data.get('feedback', [])

    return render_template('student/module1_results.html',
                           run_number=run_number, is_final=is_final,
                           decisions=decisions, kpis=kpis, score=score,
                           max_score=55, score_breakdown=score_breakdown,
                           feedback=feedback)

```

---

### STEP 4: Module 1 Decision Interface Template (45 minutes)

**File: `templates/student/module1.html`**

This integrates Gemini's React/Recharts 3D bubble chart with the decision form:

```html
{% extends "base.html" %}
{% block title %}Module 1: Global Sourcing - Veloce Wear{% endblock %}

{% block head %}
<!-- React + Recharts via CDN (NO BUILD STEP) -->
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<script src="https://unpkg.com/recharts@2.5.0/dist/Recharts.js"></script>
<link rel="stylesheet" href="{{ url_for('static', filename='css/module1.css') }}">
{% endblock %}

{% block content %}
<div class="module-container">
    <!-- Header -->
    <div class="glass-panel dashboard-header">
        <div>
            <h1>Module 1: Global Sourcing & Procurement</h1>
            <p class="text-muted">Veloce Wear Manufacturing — Porto, Portugal</p>
        </div>
        {% if is_submitted %}
        <div class="status-badge status-submitted">
            <span class="badge-icon">✓</span>
            <span>Submitted</span>
        </div>
        {% else %}
        <div class="status-badge status-in-progress">
            <span class="badge-icon">⚡</span>
            <span>In Progress</span>
        </div>
        {% endif %}
    </div>

    <!-- Interactive Supplier Visualization (Gemini Enhancement) -->
    <div id="supplier-viz-root"></div>

    <!-- Historical Demand Data -->
    <div class="glass-panel">
        <h2>📊 Historical Demand Data (24 Months)</h2>
        <p class="text-muted">Use this data to forecast Month 25 demand</p>
        
        <div class="demand-summary">
            <div class="summary-card">
                <div class="summary-label">SKU A Average</div>
                <div class="summary-value">{{ forecast_data.summary.avg_a | format_number }}</div>
                <div class="summary-sub">Trend: +{{ forecast_data.summary.trend_a }}/month</div>
            </div>
            <div class="summary-card">
                <div class="summary-label">SKU B Average</div>
                <div class="summary-value">{{ forecast_data.summary.avg_b | format_number }}</div>
                <div class="summary-sub">Trend: +{{ forecast_data.summary.trend_b }}/month</div>
            </div>
        </div>

        <div class="table-responsive">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Month</th>
                        <th>SKU A (Trend Tee)</th>
                        <th>SKU B (Core Jogger)</th>
                    </tr>
                </thead>
                <tbody>
                    {% for month, sku_a, sku_b in forecast_data.raw_data.data_points[-12:] %}
                    <tr>
                        <td>{{ month }}</td>
                        <td>{{ sku_a | format_number }}</td>
                        <td>{{ sku_b | format_number }}</td>
                    </tr>
                    {% endfor %}
                </tbody>
            </table>
        </div>
    </div>

    <!-- Decision Form -->
    <form method="POST" id="m1-form" class="decision-form">
        
        <!-- Section 1: Forecasting -->
        <div class="glass-panel">
            <h2>1️⃣ Demand Forecasting (Month 25)</h2>
            
            <div class="form-grid">
                <div class="form-group">
                    <label for="forecast_A">SKU A Forecast (units)</label>
                    <input type="number" id="forecast_A" name="forecast_A" 
                           class="form-control" required min="0" step="1"
                           placeholder="e.g., 17800">
                    <small class="form-text">BOM: 0.23 kg cotton/unit, 6% scrap</small>
                </div>

                <div class="form-group">
                    <label for="forecast_B">SKU B Forecast (units)</label>
                    <input type="number" id="forecast_B" name="forecast_B" 
                           class="form-control" required min="0" step="1"
                           placeholder="e.g., 9000">
                    <small class="form-text">BOM: 0.42 kg nylon/unit, 8% scrap</small>
                </div>

                <div class="form-group">
                    <label for="forecast_method">Forecasting Method</label>
                    <select id="forecast_method" name="forecast_method" class="form-control" required>
                        <option value="">Select method...</option>
                        <option value="linear_regression">Linear Regression</option>
                        <option value="moving_average">Moving Average (3-month)</option>
                        <option value="exponential_smoothing">Exponential Smoothing</option>
                        <option value="seasonal_decomposition">Seasonal Decomposition</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>
                        <input type="checkbox" name="purchase_report" value="yes"> 
                        Purchase Market Intelligence Report (€10,000)
                    </label>
                    <small class="form-text">Reduces demand uncertainty from 10%/6% to 7%/4%</small>
                </div>
            </div>

            <div class="calc-display" id="material-requirements">
                <h3>Calculated Material Requirements:</h3>
                <div class="req-display">
                    <span>Cotton needed: <strong id="req-cotton">—</strong> kg</span>
                    <span>Nylon needed: <strong id="req-nylon">—</strong> kg</span>
                </div>
            </div>
        </div>

        <!-- Section 2: Supplier Allocation -->
        <div class="glass-panel">
            <h2>2️⃣ Supplier Allocation Strategy</h2>
            <p class="text-muted">Use the interactive chart above to analyze supplier trade-offs</p>

            <div class="allocation-table-container">
                <table class="allocation-table" id="allocation-table">
                    <thead>
                        <tr>
                            <th>Supplier</th>
                            <th>Material</th>
                            <th>Allocation (kg)</th>
                            <th>Transport Mode</th>
                            <th>Assurance</th>
                            <th>Batches</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody id="allocation-rows">
                        <!-- Dynamic rows added via JavaScript -->
                    </tbody>
                </table>
                <button type="button" class="btn btn-secondary" onclick="addAllocationRow()">
                    + Add Allocation
                </button>
            </div>
        </div>

        <!-- Section 3: Justification -->
        <div class="glass-panel">
            <h2>3️⃣ Strategic Justification</h2>
            <textarea name="justification" class="form-control" rows="8" required
                      placeholder="Explain your forecasting methodology, supplier selection criteria (MCDA weights), transport mode decisions, and how your strategy aligns with Veloce Wear's mission (quality, sustainability, agility)..."></textarea>
            <small class="form-text">Minimum 300 words recommended for full points (max 8 pts)</small>
        </div>

        <!-- Submit Actions -->
        <div class="form-actions">
            {% if not is_submitted %}
            <button type="submit" class="btn btn-primary btn-lg" 
                    formaction="{{ url_for('student.module_m1_practice') }}">
                🔄 Run Practice Simulation
            </button>
            <button type="submit" class="btn btn-success btn-lg"
                    formaction="{{ url_for('student.module_m1_submit') }}"
                    onclick="return confirm('Submit final? This will lock Module 1 and cannot be undone.');">
                ✓ Submit Final
            </button>
            {% else %}
            <div class="alert alert-info">
                <strong>Module 1 Submitted!</strong> Score: {{ final_submission.score }}/55
            </div>
            {% endif %}
        </div>
    </form>

    <!-- Practice Run History -->
    {% if practice_runs %}
    <div class="glass-panel">
        <h2>📈 Practice Run History</h2>
        <table class="history-table">
            <thead>
                <tr>
                    <th>Run #</th>
                    <th>Score</th>
                    <th>Total Cost</th>
                    <th>Date</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                {% for run in practice_runs %}
                <tr>
                    <td>{{ run.run_number }}</td>
                    <td>{{ run.score }}/55</td>
                    <td>€{{ run.total_cost | format_number }}</td>
                    <td>{{ run.created_at | format_datetime }}</td>
                    <td>
                        <a href="{{ url_for('student.module_m1_results', run_number=run.run_number) }}" 
                           class="btn btn-sm btn-outline">View Details</a>
                    </td>
                </tr>
                {% endfor %}
            </tbody>
        </table>
    </div>
    {% endif %}

</div>

<!-- React Visualization Component (Gemini Enhancement) -->
<script type="text/babel">
const { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Legend, CartesianGrid, Cell } = Recharts;

// Supplier database for visualization
const supplierData = [
    { id: 'PT1', name: 'Lusitex Premium', country: 'Portugal', cost: 3.55, quality: 92, sustainability: 88, region: 'Nearshore', cert: 'ISO9001, ISO14001, OEKO-TEX' },
    { id: 'PT2', name: 'PortoWeave Organic', country: 'Portugal', cost: 3.85, quality: 94, sustainability: 96, region: 'Nearshore', cert: 'ISO9001, ISO14001, GOTS, OEKO-TEX' },
    { id: 'TR1', name: 'Anatolia Mills', country: 'Turkey', cost: 3.20, quality: 80, sustainability: 76, region: 'Nearshore', cert: 'ISO9001, ISO14001' },
    { id: 'TR2', name: 'Bosporus Textiles', country: 'Turkey', cost: 3.35, quality: 84, sustainability: 82, region: 'Nearshore', cert: 'ISO9001, ISO14001, OEKO-TEX' },
    { id: 'VN1', name: 'Saigon Spinners', country: 'Vietnam', cost: 2.85, quality: 72, sustainability: 64, region: 'Offshore', cert: 'ISO9001' },
    { id: 'VN2', name: 'Hanoi EcoWeave', country: 'Vietnam', cost: 3.05, quality: 76, sustainability: 80, region: 'Offshore', cert: 'ISO9001, ISO14001, OEKO-TEX' },
    { id: 'MX1', name: 'Monterrey KnitWorks', country: 'Mexico', cost: 3.10, quality: 74, sustainability: 70, region: 'Offshore', cert: 'ISO9001' },
    { id: 'MX2', name: 'Yucatan SustainTex', country: 'Mexico', cost: 3.25, quality: 78, sustainability: 84, region: 'Offshore', cert: 'ISO9001, ISO14001' }
];

const REGION_COLORS = { 
    'Nearshore': '#10b981',  // Green
    'Offshore': '#667eea'    // Purple
};

// Custom Tooltip Component
const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div style={{ 
                background: 'rgba(255, 255, 255, 0.98)', 
                padding: '16px', 
                borderRadius: '12px', 
                boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                border: '2px solid var(--primary-color)',
                minWidth: '250px'
            }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#1e293b', fontSize: '16px', fontWeight: '600' }}>
                    {data.name}
                </h4>
                <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
                    <p style={{ margin: '0 0 6px 0' }}>
                        <strong>Country:</strong> {data.country}
                    </p>
                    <p style={{ margin: '0 0 6px 0' }}>
                        <strong>Base Cost:</strong> €{data.cost}/kg
                    </p>
                    <p style={{ margin: '0 0 6px 0' }}>
                        <strong>Quality:</strong> {data.quality}/100
                    </p>
                    <p style={{ margin: '0 0 6px 0' }}>
                        <strong>Sustainability:</strong> {data.sustainability}/100
                    </p>
                    <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#64748b' }}>
                        <strong>Certifications:</strong><br/>{data.cert}
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

// Main Visualization Component
const SupplierVisualization = () => {
    return (
        <div className="glass-panel" style={{ marginTop: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                    <h2 style={{ margin: '0 0 8px 0' }}>🎯 Interactive Supplier Trade-off Analysis</h2>
                    <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
                        <strong>Bubble size</strong> represents Sustainability score. 
                        Hover over bubbles for detailed supplier information.
                    </p>
                </div>
            </div>

            <div style={{ height: '500px', width: '100%', padding: '20px 0' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.7} />
                        
                        <XAxis 
                            type="number" 
                            dataKey="cost" 
                            name="Cost" 
                            unit="€" 
                            domain={[2.7, 4.0]} 
                            label={{ value: 'Cost per Kg (€)', position: 'insideBottom', offset: -15, style: { fontSize: 14, fontWeight: 600 } }}
                            tick={{ fontSize: 12 }}
                        />
                        
                        <YAxis 
                            type="number" 
                            dataKey="quality" 
                            name="Quality" 
                            domain={[65, 100]} 
                            label={{ value: 'Quality Score (0-100)', angle: -90, position: 'insideLeft', style: { fontSize: 14, fontWeight: 600 } }}
                            tick={{ fontSize: 12 }}
                        />
                        
                        <ZAxis 
                            type="number" 
                            dataKey="sustainability" 
                            range={[200, 800]} 
                            name="Sustainability" 
                        />
                        
                        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                        
                        <Legend 
                            verticalAlign="top" 
                            height={40}
                            iconType="circle"
                            wrapperStyle={{ paddingBottom: '20px', fontSize: '14px', fontWeight: 600 }}
                        />
                        
                        <Scatter 
                            name="Nearshore Suppliers (Portugal, Turkey)" 
                            data={supplierData.filter(d => d.region === 'Nearshore')} 
                            fill={REGION_COLORS['Nearshore']}
                        >
                            {supplierData.filter(d => d.region === 'Nearshore').map((entry, index) => 
                                <Cell key={`cell-nearshore-${index}`} fill={REGION_COLORS['Nearshore']} />
                            )}
                        </Scatter>
                        
                        <Scatter 
                            name="Offshore Suppliers (Vietnam, Mexico)" 
                            data={supplierData.filter(d => d.region === 'Offshore')} 
                            fill={REGION_COLORS['Offshore']}
                        >
                            {supplierData.filter(d => d.region === 'Offshore').map((entry, index) => 
                                <Cell key={`cell-offshore-${index}`} fill={REGION_COLORS['Offshore']} />
                            )}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </div>

            <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 600, color: '#4f46e5' }}>
                    💡 How to Use This Chart
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '1.8', color: '#64748b' }}>
                    <li><strong>Top-Right Quadrant:</strong> High quality + High cost (premium suppliers)</li>
                    <li><strong>Top-Left Quadrant:</strong> High quality + Low cost (best value suppliers)</li>
                    <li><strong>Bubble Size:</strong> Larger = More sustainable (target for Veloce Wear mission)</li>
                    <li><strong>Color:</strong> Green = Nearshore (faster, truck/rail), Purple = Offshore (ocean shipping)</li>
                </ul>
            </div>
        </div>
    );
};

// Render the visualization
const root = ReactDOM.createRoot(document.getElementById('supplier-viz-root'));
root.render(<SupplierVisualization />);
</script>

<!-- Form Interaction Scripts -->
<script>
// Calculate material requirements dynamically
document.getElementById('forecast_A').addEventListener('input', updateMaterialRequirements);
document.getElementById('forecast_B').addEventListener('input', updateMaterialRequirements);

function updateMaterialRequirements() {
    const forecastA = parseFloat(document.getElementById('forecast_A').value) || 0;
    const forecastB = parseFloat(document.getElementById('forecast_B').value) || 0;
    
    // SKU A: 0.23 kg cotton/unit * 1.06 scrap
    const cottonKg = (forecastA * 0.23 * 1.06).toFixed(1);
    
    // SKU B: 0.42 kg nylon/unit * 1.08 scrap
    const nylonKg = (forecastB * 0.42 * 1.08).toFixed(1);
    
    document.getElementById('req-cotton').textContent = cottonKg;
    document.getElementById('req-nylon').textContent = nylonKg;
}

// Dynamic allocation table
let allocationCount = 0;

function addAllocationRow() {
    allocationCount++;
    const tbody = document.getElementById('allocation-rows');
    
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>
            <select name="supp${allocationCount}_id" class="form-control" required>
                <option value="">Select...</option>
                <option value="PT1">PT1 - Lusitex Premium</option>
                <option value="PT2">PT2 - PortoWeave Organic</option>
                <option value="TR1">TR1 - Anatolia Mills</option>
                <option value="TR2">TR2 - Bosporus Textiles</option>
                <option value="VN1">VN1 - Saigon Spinners</option>
                <option value="VN2">VN2 - Hanoi EcoWeave</option>
                <option value="MX1">MX1 - Monterrey KnitWorks</option>
                <option value="MX2">MX2 - Yucatan SustainTex</option>
            </select>
        </td>
        <td>
            <select name="supp${allocationCount}_material" class="form-control" required>
                <option value="cotton">Cotton</option>
                <option value="nylon">Nylon</option>
            </select>
        </td>
        <td>
            <input type="number" name="supp${allocationCount}_kg" class="form-control" 
                   min="0" step="0.1" placeholder="0.0" required>
        </td>
        <td>
            <select name="supp${allocationCount}_transport" class="form-control" required>
                <option value="truck">Truck</option>
                <option value="rail">Rail</option>
                <option value="ocean">Ocean</option>
                <option value="air">Air</option>
            </select>
        </td>
        <td>
            <select name="supp${allocationCount}_assurance" class="form-control" required>
                <option value="standard">Standard</option>
                <option value="priority">Priority (+3pp, +4%)</option>
                <option value="premium">Premium (+6pp, +8%)</option>
            </select>
        </td>
        <td>
            <input type="number" name="supp${allocationCount}_batches" class="form-control" 
                   min="1" max="4" value="1" required>
        </td>
        <td>
            <button type="button" class="btn btn-sm btn-danger" onclick="this.closest('tr').remove()">×</button>
        </td>
    `;
    
    tbody.appendChild(row);
}

// Add first row on load
window.addEventListener('DOMContentLoaded', () => {
    addAllocationRow();
    addAllocationRow();
});
</script>
{% endblock %}
```

---

### STEP 5: Results Display Template (20 minutes)

**File: `templates/student/module1_results.html`**

```html
{% extends "base.html" %}
{% block title %}Module 1 Results - Veloce Wear{% endblock %}

{% block content %}
<div class="results-container">
    
    <!-- Results Header -->
    <div class="glass-panel results-header">
        <div>
            <h1>Module 1 Results</h1>
            <p class="text-muted">
                {% if is_final %}
                <strong>FINAL SUBMISSION</strong> — This score counts toward your grade
                {% else %}
                Practice Run #{{ run_number }} — Keep practicing to improve!
                {% endif %}
            </p>
        </div>
        <div class="score-display">
            <div class="score-value">{{ score }}</div>
            <div class="score-label">/ {{ max_score }}</div>
            <div class="letter-grade">{{ (score / max_score * 100) | grade_letter }}</div>
        </div>
    </div>

    <!-- Score Breakdown -->
    {% if score_breakdown %}
    <div class="glass-panel">
        <h2>📊 Score Breakdown</h2>
        <div class="score-breakdown-grid">
            <div class="breakdown-item">
                <div class="category-name">Forecasting & Planning Logic</div>
                <div class="category-score">{{ score_breakdown.get('forecasting', 0) }} / 15</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: {{ (score_breakdown.get('forecasting', 0) / 15 * 100) }}%"></div>
                </div>
            </div>

            <div class="breakdown-item">
                <div class="category-name">Supplier Selection Method</div>
                <div class="category-score">{{ score_breakdown.get('supplier_method', 0) }} / 12</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: {{ (score_breakdown.get('supplier_method', 0) / 12 * 100) }}%"></div>
                </div>
            </div>

            <div class="breakdown-item">
                <div class="category-name">Cost/Service/Risk Trade-offs</div>
                <div class="category-score">{{ score_breakdown.get('tradeoffs', 0) }} / 12</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: {{ (score_breakdown.get('tradeoffs', 0) / 12 * 100) }}%"></div>
                </div>
            </div>

            <div class="breakdown-item">
                <div class="category-name">Quality + Sustainability + Compliance</div>
                <div class="category-score">{{ score_breakdown.get('quality_sustainability', 0) }} / 8</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: {{ (score_breakdown.get('quality_sustainability', 0) / 8 * 100) }}%"></div>
                </div>
            </div>

            <div class="breakdown-item">
                <div class="category-name">Validity + Justification</div>
                <div class="category-score">{{ score_breakdown.get('validity_justification', 0) }} / 8</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: {{ (score_breakdown.get('validity_justification', 0) / 8 * 100) }}%"></div>
                </div>
            </div>
        </div>
    </div>
    {% endif %}

    <!-- KPIs Grid -->
    <div class="kpi-grid">
        <div class="kpi-card">
            <div class="kpi-label">Total Procurement Cost</div>
            <div class="kpi-value">€{{ kpis.total_procurement_cost | format_number }}</div>
        </div>

        <div class="kpi-card">
            <div class="kpi-label">Material Cost</div>
            <div class="kpi-value">€{{ kpis.material_cost | format_number }}</div>
        </div>

        <div class="kpi-card">
            <div class="kpi-label">Transport Cost</div>
            <div class="kpi-value">€{{ kpis.transport_cost | format_number }}</div>
        </div>

        <div class="kpi-card">
            <div class="kpi-label">Average Lead Time</div>
            <div class="kpi-value">{{ kpis.avg_lead_time_days }} days</div>
        </div>

        <div class="kpi-card">
            <div class="kpi-label">Average Reliability</div>
            <div class="kpi-value">{{ kpis.avg_reliability_pct }}%</div>
        </div>

        <div class="kpi-card">
            <div class="kpi-label">Sustainability Index</div>
            <div class="kpi-value">{{ kpis.avg_sustainability }} / 5.0</div>
        </div>

        <div class="kpi-card">
            <div class="kpi-label">Quality Index</div>
            <div class="kpi-value">{{ kpis.avg_quality }} / 5.0</div>
        </div>

        <div class="kpi-card">
            <div class="kpi-label">Total CO₂ Emissions</div>
            <div class="kpi-value">{{ kpis.total_co2 }} units</div>
        </div>
    </div>

    <!-- Feedback Section -->
    {% if feedback %}
    <div class="glass-panel">
        <h2>💡 Improvement Suggestions</h2>
        <ul class="feedback-list">
            {% for item in feedback %}
            <li>{{ item }}</li>
            {% endfor %}
        </ul>
    </div>
    {% endif %}

    <!-- Actions -->
    <div class="results-actions">
        <a href="{{ url_for('student.module_m1') }}" class="btn btn-primary">
            {% if is_final %}Return to Dashboard{% else %}Run Another Practice{% endif %}
        </a>
        {% if not is_final %}
        <a href="{{ url_for('student.dashboard') }}" class="btn btn-outline">Back to Dashboard</a>
        {% endif %}
    </div>

</div>
{% endblock %}
```

---

### STEP 6: Module 1 CSS Styling (15 minutes)

**File: `static/css/module1.css`**

```css
/* Module 1 Specific Styles */

.module-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
}

/* Material Requirements Display */
.calc-display {
    background: var(--glass-bg);
    border: 2px solid var(--primary-color);
    border-radius: 12px;
    padding: 20px;
    margin-top: 20px;
}

.calc-display h3 {
    margin: 0 0 12px 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
}

.req-display {
    display: flex;
    gap: 30px;
    font-size: 18px;
    font-weight: 500;
}

.req-display strong {
    color: var(--primary-color);
    font-size: 24px;
}

/* Allocation Table */
.allocation-table-container {
    overflow-x: auto;
}

.allocation-table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
}

.allocation-table thead th {
    background: var(--glass-bg);
    padding: 12px;
    text-align: left;
    font-weight: 600;
    border-bottom: 2px solid var(--border-color);
}

.allocation-table tbody td {
    padding: 10px;
    border-bottom: 1px solid var(--border-color);
}

.allocation-table select,
.allocation-table input {
    width: 100%;
}

/* Demand Summary Cards */
.demand-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin: 20px 0;
}

.summary-card {
    background: var(--glass-bg);
    padding: 20px;
    border-radius: 12px;
    text-align: center;
    border: 1px solid var(--border-color);
}

.summary-label {
    font-size: 14px;
    color: var(--text-muted);
    margin-bottom: 8px;
}

.summary-value {
    font-size: 32px;
    font-weight: 700;
    color: var(--primary-color);
    margin-bottom: 4px;
}

.summary-sub {
    font-size: 12px;
    color: var(--text-muted);
}

/* Results Page */
.results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
}

.score-display {
    text-align: center;
}

.score-value {
    font-size: 64px;
    font-weight: 700;
    color: var(--success-color);
    line-height: 1;
}

.score-label {
    font-size: 24px;
    color: var(--text-muted);
}

.letter-grade {
    font-size: 36px;
    font-weight: 700;
    color: var(--primary-color);
    margin-top: 10px;
}

/* Score Breakdown */
.score-breakdown-grid {
    display: grid;
    gap: 20px;
}

.breakdown-item {
    padding: 16px;
    background: var(--glass-bg);
    border-radius: 8px;
    border: 1px solid var(--border-color);
}

.category-name {
    font-weight: 600;
    margin-bottom: 8px;
    color: var(--text-primary);
}

.category-score {
    font-size: 20px;
    font-weight: 700;
    color: var(--primary-color);
    margin-bottom: 8px;
}

.progress-bar {
    height: 8px;
    background: var(--bg-secondary);
    border-radius: 4px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
    transition: width 0.3s ease;
}

/* KPI Grid */
.kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin: 30px 0;
}

.kpi-card {
    background: var(--glass-bg);
    padding: 20px;
    border-radius: 12px;
    text-align: center;
    border: 1px solid var(--border-color);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.kpi-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0,0,0,0.1);
}

.kpi-label {
    font-size: 12px;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 8px;
    letter-spacing: 0.5px;
}

.kpi-value {
    font-size: 28px;
    font-weight: 700;
    color: var(--text-primary);
}

/* Feedback List */
.feedback-list {
    list-style: none;
    padding: 0;
}

.feedback-list li {
    padding: 12px 16px;
    margin-bottom: 10px;
    background: var(--glass-bg);
    border-left: 4px solid var(--primary-color);
    border-radius: 4px;
}

/* Responsive */
@media (max-width: 768px) {
    .results-header {
        flex-direction: column;
        text-align: center;
        gap: 20px;
    }
    
    .req-display {
        flex-direction: column;
        gap: 10px;
    }
}
```

---

### STEP 7: Testing Checklist (Complete 50-Point Protocol)

**Module 1 Testing Checklist**

#### **Category 1: Data Validation (10 tests)**

- [ ] **T1.1** Forecast inputs accept only positive integers
- [ ] **T1.2** Allocation kg accepts decimals (0.1 precision)
- [ ] **T1.3** Batches limited to 1-4 range
- [ ] **T1.4** Form validates required fields before submission
- [ ] **T1.5** Negative values rejected for all numeric fields
- [ ] **T1.6** Supplier dropdown shows all 8 suppliers
- [ ] **T1.7** Transport modes match supplier region (nearshore: truck/rail/air, offshore: ocean/air)
- [ ] **T1.8** Material requirements calculate correctly (Cotton: forecast_A × 0.23 × 1.06)
- [ ] **T1.9** Material requirements calculate correctly (Nylon: forecast_B × 0.42 × 1.08)
- [ ] **T1.10** Justification textarea accepts minimum 300 characters

#### **Category 2: Simulation Engine (10 tests)**

- [ ] **T2.1** Same user + same inputs → same results (deterministic seed)
- [ ] **T2.2** Different run numbers produce different demand realizations
- [ ] **T2.3** Market report reduces demand sigma correctly (A: 10%→7%, B: 6%→4%)
- [ ] **T2.4** Quantity discounts apply at correct thresholds (Cotton: 20k→2%, 50k→4%)
- [ ] **T2.5** Quantity discounts apply at correct thresholds (Nylon: 10k→2%, 25k→4%)
- [ ] **T2.6** Assurance packages calculate correctly (Priority: +3pp price, +4% reliability)
- [ ] **T2.7** Late delivery penalties apply (€500 per late batch)
- [ ] **T2.8** Transport costs multiply correctly (kg × cost_per_kg)
- [ ] **T2.9** Order costs calculate correctly (num_batches × €200 + report)
- [ ] **T2.10** Weighted averages calculate correctly (lead time, reliability, quality, sustainability)

#### **Category 3: Grading Logic (10 tests)**

- [ ] **T3.1** Forecasting: ≤5% error → 15 points
- [ ] **T3.2** Forecasting: 5-10% error → 12 points
- [ ] **T3.3** Forecasting: 10-15% error → 9 points
- [ ] **T3.4** Forecasting: >15% error → 6 points
- [ ] **T3.5** Supplier method: 2-4 suppliers → 12 points
- [ ] **T3.6** Supplier method: 1 supplier → 7 points
- [ ] **T3.7** Trade-offs: Cost <€30k → 6 points, Reliability ≥96% → 6 points
- [ ] **T3.8** Quality/Sust: Quality ≥4.5 → 4 pts, Sust ≥4.5 → 4 pts
- [ ] **T3.9** Validity: No validation flags → 5 points, coverage ≥95% → maintained
- [ ] **T3.10** Justification: ≥500 chars → 3 pts, ≥300 → 2 pts, ≥150 → 1 pt

#### **Category 4: Interactive Visualizations (10 tests)**

- [ ] **T4.1** React/Recharts bubble chart renders without errors
- [ ] **T4.2** Chart shows all 8 suppliers as bubbles
- [ ] **T4.3** Bubble size correlates with sustainability score
- [ ] **T4.4** Nearshore suppliers colored green
- [ ] **T4.5** Offshore suppliers colored purple
- [ ] **T4.6** Tooltip shows on hover with correct data
- [ ] **T4.7** X-axis (Cost) range 2.7-4.0 displays correctly
- [ ] **T4.8** Y-axis (Quality) range 65-100 displays correctly
- [ ] **T4.9** Legend distinguishes Nearshore vs Offshore
- [ ] **T4.10** Chart remains responsive on mobile (320px width)

#### **Category 5: Database & Submission Flow (10 tests)**

- [ ] **T5.1** Practice run saves to simulation_runs table (is_final=0)
- [ ] **T5.2** Final submission saves to simulation_runs (is_final=1) AND module_submissions
- [ ] **T5.3** Final submission locks module (cannot re-submit)
- [ ] **T5.4** M2 unlocks after M1 final submission
- [ ] **T5.5** Practice runs increment run_number correctly
- [ ] **T5.6** JSON serialization/deserialization preserves all data
- [ ] **T5.7** Submission timestamp recorded in ISO format
- [ ] **T5.8** Score stored correctly in module_submissions table
- [ ] **T5.9** Gradebook displays M1 score after submission
- [ ] **T5.10** Results page displays score breakdown correctly

**PASS CRITERIA:** All 50 tests must pass before deployment.

---

### STEP 8: Deployment Checklist

**Pre-Deployment:**
- [ ] All routes tested with sample student account
- [ ] Instructor can view M1 submissions in gradebook
- [ ] CSV export includes M1 scores
- [ ] React/Recharts loads without console errors
- [ ] Mobile responsive (test on 320px, 768px, 1024px)

**Post-Deployment:**
- [ ] Create test student account and complete M1 practice run
- [ ] Submit M1 final and verify M2 unlocks
- [ ] Verify instructor can export gradebook with M1 scores
- [ ] Check simulation determinism (same inputs → same results)

---

## ✅ DONE DEFINITION

Module 1 is complete when:

1. ✅ All 8 suppliers appear in interactive 3D bubble chart
2. ✅ Student can complete practice runs with instant feedback
3. ✅ Student can submit final (locks module, unlocks M2)
4. ✅ Grading algorithm scores correctly across all 5 categories (55 points)
5. ✅ All 50 test cases pass
6. ✅ Instructor can view M1 scores in gradebook
7. ✅ Results page displays score breakdown and KPIs
8. ✅ Simulation is deterministic (same seed → same results)

---

## 📚 ADDITIONAL RESOURCES

**Model Solutions:**

**A Grade (51-53/55):**
- Forecasting: Linear regression, 4-6% error
- Suppliers: PT2 (cotton) + TR2 (cotton) + PT1 (nylon) + TR1 (nylon)
- Transport: Mix of Rail (60%) + Truck (40%)
- Assurance: Priority on high-value suppliers
- Batches: 2-3 per supplier (balance cost vs risk)
- Report: Purchased (reduces uncertainty)
- Cost: ~€33,000
- Reliability: 96.5%
- Sustainability: 4.3/5.0
- Justification: 600+ words with MCDA matrix, sensitivity analysis

**B Grade (45-48/55):**
- Forecasting: Moving average, 8-10% error
- Suppliers: TR2 (cotton) + PT1 (nylon)
- Transport: Rail only (cost focus)
- Assurance: Standard
- Batches: 4 (minimize order costs)
- Report: Not purchased
- Cost: ~€29,000
- Reliability: 94.5%
- Sustainability: 4.0/5.0
- Justification: 400 words

**C Grade (38-42/55):**
- Forecasting: No clear method, 15%+ error
- Suppliers: VN1 (cotton) + MX1 (nylon)
- Transport: Ocean (low cost but conflicts with mission)
- Assurance: Standard
- Batches: 1 (high risk)
- Report: Not purchased
- Cost: ~€26,000
- Reliability: 89%
- Sustainability: 3.4/5.0
- Justification: <200 words

---

**Time Estimate:** 3-4 hours to implement completely (experienced developer)

**Support:** If issues arise, check:
1. Console errors for React/Recharts loading
2. Database schema matches foundation
3. Helper functions imported correctly
4. Seed calculation uses stable_hash (not Python hash)

**END OF MODULE 1 REPLIT PROMPT**
