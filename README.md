# Velmora — GIS Analytics Assessment

A responsive concept e-commerce website for Velmora, a fictional London-based, made-to-order evening-wear brand.

## Live website

https://velmora-assessment.netlify.app/

## Features

- Responsive homepage with occasion-based navigation
- Winter Weddings collection generated from the product catalogue
- Featured Vela dress product page
- Find Your Piece: a catalogue-grounded shopping recommendation tool
- Filtering by occasion, category, fit, budget and UK size
- Estimated UK/EU delivery ranges and event-date suitability warnings
- Black Friday interest registration demonstration

## How the stylist works

The stylist uses transparent, rules-based filtering and ranking against `data/products.json`. It prioritises estimated delivery suitability when an event date is provided.

It does not use a generative AI model. Recommendations are based on listed catalogue information, and delivery dates are estimates rather than guarantees.

## Run locally

From the project folder:

```bash
python3 -m http.server 8000
```

Open http://localhost:8000/

## Project structure

- `index.html` — Homepage and shopping stylist
- `product.html` — Featured product page
- `winter-wedding.html` — Occasion collection
- `css/styles.css` — Website styling
- `js/stylist.js` — Product recommendations
- `js/product.js` — Product page interactions
- `data/products.json` — Product catalogue
- `COMMERCIAL_PLAN.md` — Commercial growth plan

## Limitations

This is an assessment prototype, not a live store. There is no real checkout or payment processing. Email registration is illustrative and does not store submissions. Product visuals are illustrative rather than garment photography.

## Commercial strategy

The accompanying plan prioritises mobile checkout conversion, fit and delivery confidence, and more efficient email-led customer acquisition ahead of Black Friday 2026.