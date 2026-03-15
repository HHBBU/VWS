# STUDENT-FACING TEXT — Ready to Use

---

# FULL INTRO PAGE (for `/intro`)

Paste into `templates/public/intro.html` inside your `{% block content %}` area.

---

## Veloce Wear Supply Chain Simulation

### How the Simulation Works (Read This First)

Welcome to **Veloce Wear** — a fast-fashion apparel company competing on **speed, quality, availability, and responsible sourcing**. You are joining the supply chain leadership team. Your job is to make realistic, data-driven decisions across three modules — then learn from the results as uncertainty and trade-offs unfold.

This is a **3-module simulation sequence**. Each module builds on the one before it, just like a real end-to-end supply chain.

---

### What You'll Complete

**Total: 165 points across 3 modules**

| Module | Role | Points |
|--------|------|--------|
| **Module 1** — Global Sourcing & Procurement | You forecast demand, select suppliers, and design the inbound supply strategy | 55 |
| **Module 2** — Operations Planning & MRP | You plan production, manage capacity, and balance service vs cost vs markdown | 55 |
| **Module 3** — Distribution Network & Inventory | You design the distribution network, set inventory policies, and manage fulfillment | 55 |

---

### How to Access the Simulation

**Account rules:**
- Register and log in using a **.edu email address** (required)
- Your account is tied to your **Student ID**, which ensures grading integrity and reproducibility

**Module introduction pages:**
- Each module has a **Module Introduction Page** available before and after login
- Read the intro before starting — it explains the scenario, the decisions you'll make, and how points are awarded

---

### Practice vs Final Submission

**This is the most important rule. Read carefully.**

**Practice runs:**
- You can run **unlimited practice simulations** for each module
- Practice runs give you instant feedback (score breakdown, KPI dashboard)
- Use them to test different strategies and improve your results
- Practice runs are saved so you and the instructor can see your progress

**Final submission:**
- Each module allows **one final submission only**
- Once you click **Submit Final**, the module locks permanently — no resubmissions
- Your final score and timestamp appear on your dashboard
- The next module unlocks only after you submit the current one

---

### Module Unlock Sequence

Modules unlock in order. You cannot skip ahead.

```
Module 1 opens first
    ↓ submit M1 final
Module 2 unlocks
    ↓ submit M2 final
Module 3 unlocks
    ↓ submit M3 final
Course complete!
```

---

### Timing: Module Windows and Extensions

- Each module has an **official start and end date** (the "module window")
- If the window is closed, you cannot run or submit that module
- **Extensions** are available on a per-student basis (instructor-managed)
- If you need an extension, contact the instructor early and include your Student ID

---

### What Strong Performance Looks Like

This is not a "guess the trick" game. There is no single correct answer. Strong submissions show:

- **Data-driven planning** — you use the provided historical data and analytics tools
- **Trade-off reasoning** — you explicitly discuss cost vs service vs inventory vs risk vs sustainability
- **Operational realism** — your decisions account for lead times, capacity constraints, variability, and batching
- **Clear written justification** — you explain your logic, reference your KPIs, and link decisions to the company mission

You will see dashboards and interactive visualizations (charts, bubble plots, saw-tooth diagrams) designed to help you interpret outcomes and improve decisions.

---

### What to Do Next

1. **Create your account** using your .edu email
2. Go to your **Student Dashboard** and open **Module 1**
3. Read the **Module 1 Introduction**, run practice simulations, then submit final when ready
4. Repeat for Modules 2 and 3

Your goal is to think like a supply chain professional — not just play with numbers. Good luck!

---

# DASHBOARD BANNER

Place at the top of the dashboard, above module cards.

**Text:**

> **How this works:** Run unlimited practice simulations to learn and improve. Submit one final per module (locks permanently). Modules unlock in order: M1 → M2 → M3. Total points: **165**.

**HTML version:**

```html
<div class="glass-panel" style="margin-bottom: 24px; padding: 16px 24px;">
    <p style="margin: 0; font-size: 14px; color: var(--text-muted); line-height: 1.8;">
        <strong>How this works:</strong> 
        Run unlimited practice simulations to learn and improve. 
        Submit one final per module (locks permanently). 
        Modules unlock in order: M1 → M2 → M3. 
        Total points: <strong>165</strong>.
    </p>
</div>
```

---

# MODULE TILE DESCRIPTIONS

Use as description text inside each module card on the dashboard.

**Module 1 — Global Sourcing & Procurement (55 pts)**

> Forecast demand, convert to material requirements, select suppliers and transportation modes, and balance cost vs lead time vs reliability vs sustainability and quality. Your sourcing decisions become the inbound reality for Module 2.

**Module 2 — Operations Planning & MRP (55 pts)**

> Build an 8-week S&OP plan, choose capacity and lot-sizing policies, and apply MRP timing logic. Your M1 supplier reliability shapes how well production executes. Overproduction risks markdown; underproduction risks stockouts.

**Module 3 — Distribution Network & Inventory (55 pts)**

> Design the distribution network, set ROP/Q inventory policies, and choose service modes. Balance service vs cost vs carbon footprint under demand uncertainty. Your M2 service level affects lead time variability here.

---

# STATUS LEGEND

Place as small help text near module cards.

**Text:**

> **Locked** = prerequisite not submitted or module window closed · **Not started** = no runs yet · **In progress** = practice runs exist · **Submitted** = final submitted (read-only)

**HTML version:**

```html
<div style="font-size: 12px; color: var(--text-muted); margin-top: 16px; line-height: 1.8;">
    <strong>Status guide:</strong>
    <strong>Locked</strong> = prerequisite not submitted or module window closed · 
    <strong>Not started</strong> = no runs yet · 
    <strong>In progress</strong> = practice runs exist · 
    <strong>Submitted</strong> = final submitted (read-only)
</div>
```

---

# MODULE INTRO BLURBS (for `/module-intro/M1`, `/module-intro/M2`, `/module-intro/M3`)

**Module 1 — Global Sourcing & Procurement (55 pts)**

You are the **Global Sourcing Manager** preparing Veloce Wear's next production cycle. You will analyze historical demand data, forecast future demand, translate forecasts into material requirements (kg), evaluate 8 global suppliers using a formal MCDA method, select transportation modes, and balance cost vs lead time vs reliability vs sustainability and quality.

Your sourcing decisions set the foundation for the entire supply chain. The suppliers you choose, the reliability you achieve, and the lead times you accept all carry forward into Module 2.

**Key decisions:** Demand forecast, supplier selection and allocation, transport mode, assurance package, batching strategy, optional market intelligence report.

---

**Module 2 — Operations Planning & MRP (55 pts)**

You are the **Operations Planning Manager** at Veloce Wear's Porto manufacturing campus. You will build an 8-week S&OP production plan, choose a capacity mode, select lot-sizing and safety stock policies, and manage the tension between service level, cost, and markdown risk.

Your Module 1 supplier reliability determines how often material disruptions interrupt production. Poor M1 decisions make M2 harder. The Visual S&OP Dashboard helps you check your plan against capacity limits in real time.

**Key decisions:** Weekly production targets (8 weeks × 2 SKUs), capacity mode, lot sizing, priority rule, safety stock policy.

---

**Module 3 — Distribution Network & Inventory (55 pts)**

You are the **Distribution Strategy Lead** designing how finished goods flow from Porto to 420 stores across EU, North America, and APAC. You will choose a network structure (centralized, hybrid, or decentralized), set inventory replenishment policies (ROP and Q), and select a shipping service mode.

Your Module 2 service level affects lead time variability in M3 — poor production performance creates wider delivery windows. The Interactive ROP/Q Visualizer helps you calibrate inventory policies before running the stochastic simulation.

**Key decisions:** Network strategy, reorder point (ROP), order quantity (Q), service mode, forecast method.
