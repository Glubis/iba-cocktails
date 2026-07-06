# IBA Cocktails

This project is based on final_cocktails.csv from https://www.kaggle.com/datasets/aadyasingh55/cocktails, version 1, updated Oct 22, 2024.


## Web app

The **Cocktail Pantry Matcher** is a static HTML + JavaScript app in this repo.
Select the ingredients you have on hand and see which IBA cocktails you can make,
grouped by category.

Because the app loads CSV via `fetch()`, it must be served over HTTP (opening
`index.html` directly as a `file://` URL will not work).

```powershell
cd C:\Users\gobis\code\iba-cocktails
python -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080).

Use **Copy JSON** to copy your selected ingredients and match results as JSON
for manual saving.

A new **Populate from my_drinks.json** button lets you load a local `my_drinks.json`
file and prefill selected ingredients automatically.

## App structure

- `index.html` – the single-page frontend and entry point.
- `css/style.css` – layout and styling for the ingredient grid, results, and controls.
- `js/app.js` – application logic, CSV loading, ingredient selection, and result rendering.
- `js/normalize.js` – ingredient normalization and recipe ingredient parsing helpers.
- `final_cocktails.csv` – full recipe dataset loaded by the app at startup.
- `final_cocktails_head.csv` – sample CSV head used for testing or lightweight preview.

The app starts by loading `final_cocktails.csv` and does not depend on any
JSON recipe files at runtime.
