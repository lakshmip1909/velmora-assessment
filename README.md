
# VELMORA — GIS Analytics Assessment

A responsive concept e-commerce website for Velmora, a fictional London-based made-to-order evening-wear brand.

## Live website

https://velmora-assessment.netlify.app/

## Features

- Responsive homepage with occasion-based shopping
- Winter Weddings collection built from the supplied catalogue
- Featured Vela dress product page
- AI-assisted "Find Your Piece" shopping stylist
- Product filtering by occasion, category, fit, budget and UK size
- UK and EU delivery estimates with event-date suitability warnings
- Black Friday interest registration demonstration
- Transparent product information and prototype limitations

## AI shopping stylist

The stylist combines a pretrained language model with catalogue-based safeguards.

### How it works

1. The customer selects an occasion, category, fit, budget, size and optional delivery details.
2. JavaScript filters the supplied `products.json` catalogue to find eligible products.
3. A pretrained MiniLM sentence-embedding model, loaded through Transformers.js, compares customer preferences with product descriptions and ranks matching pieces by semantic similarity.
4. When an event date is provided, delivery suitability takes priority over AI ranking.
5. The website displays verified product information and estimated delivery ranges.

### Model and implementation

- Model: `Xenova/all-MiniLM-L6-v2`
- Library: Hugging Face Transformers.js
- Inference: Runs in the customer's browser
- Cost: No paid inference API
- API keys: None required
- AI module: `js/stylist-ai.js`
- Main stylist logic: `js/stylist.js`

### Reliability and safeguards

- AI only ranks products that have already passed catalogue filters.
- Products, prices, sizes, fabrics and lead times come from `data/products.json`.
- Delivery estimates use production lead times and stated shipping ranges, not model-generated dates.
- The stylist warns when an item is unlikely to arrive before an event.
- Unknown or unavailable delivery information is not presented as confirmed.
- If the AI model cannot load, the stylist falls back to deterministic catalogue ranking.
- If only one product matches, AI ranking is unnecessary.

The model may require an initial download and can take longer to run on slower devices. AI ranking is a recommendation aid, not a guarantee of suitability or delivery.

## Run locally

From the project folder:

```bash
python3 -m http.server 8000
```

Then visit:

http://localhost:8000/

An internet connection is required for the initial AI model download.

## Project structure

- `index.html` — Homepage and shopping stylist
- `product.html` — Featured Vela dress page
- `winter-wedding.html` — Winter Weddings collection
- `css/styles.css` — Responsive styling
- `js/stylist.js` — Catalogue filtering, delivery checks and recommendation display
- `js/stylist-ai.js` — Browser-based AI ranking
- `js/product.js` — Product page interactions
- `data/products.json` — Supplied product catalogue
- `COMMERCIAL_PLAN.md` — Data-led commercial growth plan

## Commercial approach

The accompanying commercial plan identifies three priorities ahead of Black Friday 2026:

1. Improve mobile checkout completion.
2. Reduce customer uncertainty about fit and delivery.
3. Reallocate inefficient advertising spend towards email and retention.

The recommendations are based on the supplied April–September analytics.

## Prototype limitations

This is an assessment demonstration, not a live Shopify store.

- No real checkout or payment processing
- Email registration is illustrative; addresses are not stored
- Product visuals are illustrative placeholders, not garment photography
- No external stock images or third-party fashion brand assets are used
- Delivery dates are estimates, not guarantees
- No invented customer reviews, discounts or order deadlines

## Hosting

The website is deployed on Netlify from the GitHub repository.
