# REPLIT PROMPT — Split Forecasting Method Into Two Dropdowns (One Per SKU)

Paste this into your Replit AI chat:

---

## PROMPT START

Currently Module 1 has ONE forecasting method dropdown for both SKUs. I need TWO separate dropdowns — one for SKU A and one for SKU B — because each product has a different demand pattern and students should choose the appropriate method for each.

### Change 1: Update the HTML form in `templates/student/module1.html`

Find the single forecasting method dropdown (it looks like this):

```html
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
```

Replace it with TWO dropdowns side by side:

```html
<div class="form-group">
    <label for="forecast_method_a">SKU A Forecasting Method</label>
    <select id="forecast_method_a" name="forecast_method_a" class="form-control" required>
        <option value="">Select method for SKU A...</option>
        <option value="linear_regression">Linear Regression</option>
        <option value="moving_average">Moving Average</option>
        <option value="exponential_smoothing">Exponential Smoothing</option>
        <option value="seasonal_decomposition">Seasonal Decomposition</option>
    </select>
    <small class="form-text">Choose based on the demand pattern you observe for SKU A</small>
</div>

<div class="form-group">
    <label for="forecast_method_b">SKU B Forecasting Method</label>
    <select id="forecast_method_b" name="forecast_method_b" class="form-control" required>
        <option value="">Select method for SKU B...</option>
        <option value="linear_regression">Linear Regression</option>
        <option value="moving_average">Moving Average</option>
        <option value="exponential_smoothing">Exponential Smoothing</option>
        <option value="seasonal_decomposition">Seasonal Decomposition</option>
    </select>
    <small class="form-text">Choose based on the demand pattern you observe for SKU B</small>
</div>
```

### Change 2: Update the form extraction in `routes/student.py`

Find the `_extract_m1_decisions` function (or `extract_m1_decisions_from_form`). It currently reads one method:

```python
forecast_method = form.get('forecast_method', 'unknown')
```

Replace with:

```python
forecast_method_a = form.get('forecast_method_a', 'unknown')
forecast_method_b = form.get('forecast_method_b', 'unknown')
```

And in the return dict, replace:

```python
'forecast_method': forecast_method,
```

With:

```python
'forecast_method_a': forecast_method_a,
'forecast_method_b': forecast_method_b,
'forecast_method': forecast_method_a,  # keep for backward compatibility
```

### Change 3: Update the engine bonus logic in `modules/engine_module1.py`

Find the forecast method bonus section (around the forecasting score calculation):

```python
if forecast_method in ['linear_regression', 'exponential_smoothing'] and forecasting_score > 0:
    forecasting_score = min(15, forecasting_score + 1)
```

Replace with:

```python
# Bonus for appropriate method selection per SKU
# Award +1 if at least one method is regression or exponential smoothing
forecast_method_a = decisions.get('forecast_method_a', decisions.get('forecast_method', 'unknown'))
forecast_method_b = decisions.get('forecast_method_b', 'unknown')

advanced_methods = ['linear_regression', 'exponential_smoothing']
if (forecast_method_a in advanced_methods or forecast_method_b in advanced_methods) and forecasting_score > 0:
    forecasting_score = min(15, forecasting_score + 1)
```

Also update where `forecast_method` is extracted near the top of the function. Find:

```python
forecast_method = decisions.get('forecast_method', 'unknown')
```

Replace with:

```python
forecast_method_a = decisions.get('forecast_method_a', decisions.get('forecast_method', 'unknown'))
forecast_method_b = decisions.get('forecast_method_b', 'unknown')
```

And in the return dict at the bottom, find:

```python
'forecast_method': forecast_method
```

Replace with:

```python
'forecast_method_a': forecast_method_a,
'forecast_method_b': forecast_method_b,
'forecast_method': forecast_method_a  # backward compatibility
```

### What NOT to change

- Do not change the grading thresholds (5%/10%/15% error tiers)
- Do not change how forecast error is calculated
- Do not change the supplier selection, transport, or other sections
- Do not change any Module 2 or Module 3 code

### Summary of changes

Three files, small targeted edits:
1. `templates/student/module1.html` — split 1 dropdown into 2
2. `routes/student.py` — read `forecast_method_a` and `forecast_method_b` from form
3. `modules/engine_module1.py` — use both methods for bonus logic, store both in output

## PROMPT END
