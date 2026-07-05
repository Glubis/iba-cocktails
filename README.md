# IBA Cocktails

This project compiles International Bartenders Association's (IBA) [official
cocktail recipes](http://iba-world.com/iba-cocktails/) into machine readable
format, suitable to be embedded into applications.

## Web app

The **Cocktail Pantry Matcher** is a static HTML + JavaScript app in this repo.
Select the ingredients you have on hand and see which IBA cocktails you can make,
grouped by category.

Because the app loads JSON via `fetch()`, it must be served over HTTP (opening
`index.html` directly as a `file://` URL will not work).

```powershell
cd C:\Users\gobis\code\iba-cocktails
python -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080).

Use **Copy JSON** to copy your selected ingredients and match results as JSON
for manual saving.

## Followup work

Prompt:

```Analyze index.html, and the js dir. Right now, it reads ingredients.json and recipes.json. Instead, It should init from final_cocktails_head.csv
```

Note: final_cocktails_head.csv is a sample head to not blow up the ai context. final_cocktails.csv is what it should really load from.

