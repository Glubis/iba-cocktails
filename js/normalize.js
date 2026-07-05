const ALIAS_RULES = [
  { pattern: /mint sprig|mint leave|fresh mint/i, name: "Mint" },
  { pattern: /strawberry syrup|grenadine|sugar syrup|sugar cube|white sugar|brown sugar|powdered sugar|teaspoon sugar|teaspoons sugar|\bsugar\b/i, name: "Syrup" },
  { pattern: /angostura|peychaud|peach bitters|orange bitters/i, name: "Orange Bitters" },
  { pattern: /egg white/i, name: "Egg white" },
  { pattern: /espresso/i, name: "Hot coffee" },
  { pattern: /maraschino/i, name: "Maraschino" },
  { pattern: /worcestershire/i, name: "Worcestershire Sauce" },
  { pattern: /celery salt/i, name: "Celery salt" },
  { pattern: /vanilla extract/i, name: "Vanilla extract" },
  { pattern: /orange flower water/i, name: "Orange flower water" },
  { pattern: /agave nectar/i, name: "Agave nectar" },
  { pattern: /clear honey|\bhoney\b/i, name: "Honey" },
  { pattern: /chili pepper|chilli pepper|hot chili/i, name: "Chili peppers" },
  { pattern: /\bonion\b/i, name: "Onion" },
  { pattern: /\btabasco\b/i, name: "Tabasco" },
  { pattern: /\bpepper\b/i, name: "Pepper" },
  { pattern: /\bsalt\b/i, name: "Salt" },
  { pattern: /plain water|teaspoons water|teaspoon water|\bfew dashes plain water\b/i, name: "Water" },
  { pattern: /fresh lime|slice lime|lime wedge/i, name: "Lime" },
];

const QUANTITY_PREFIX = /^(?:\d+(?:\.\d+)?(?:\s*\/\s*\d+)?|\d+\s+to\s+\d+|\d+\/\d+|\d+)\s*(?:cl|ml|oz|dash(?:es)?|drop(?:s)?|teaspoon(?:s)?|bar spoon(?:s)?|spoon(?:s)?|slice(?:s)?|sprig(?:s)?|wedge(?:s)?|short|raw|fresh|few|half|top with|splash of|a splash of|dash of)?\s*(?:of\s+)?/i;

const PAREN_SUFFIX = /\s*\([^)]*\)\s*$/;

function titleCase(text) {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function matchAlias(text) {
  for (const rule of ALIAS_RULES) {
    if (rule.pattern.test(text)) {
      return rule.name;
    }
  }
  return null;
}

function matchCatalog(text, catalogSortedByLength) {
  const lower = text.toLowerCase();
  for (const name of catalogSortedByLength) {
    if (lower.includes(name.toLowerCase())) {
      return name;
    }
  }
  return null;
}

function extractFallback(text) {
  let cleaned = text.trim().replace(PAREN_SUFFIX, "");
  cleaned = cleaned.replace(QUANTITY_PREFIX, "").trim();
  cleaned = cleaned.replace(/^(?:top with|splash of|a splash of|dash of)\s+/i, "").trim();
  if (!cleaned) {
    return null;
  }
  return titleCase(cleaned);
}

export function parseSpecialIngredient(specialText, catalogSortedByLength) {
  const aliasMatch = matchAlias(specialText);
  if (aliasMatch) {
    return aliasMatch;
  }

  const catalogMatch = matchCatalog(specialText, catalogSortedByLength);
  if (catalogMatch) {
    return catalogMatch;
  }

  return extractFallback(specialText);
}

export function getRecipeIngredients(recipe, catalogSortedByLength) {
  const ingredients = new Set();

  for (const entry of recipe.ingredients) {
    if (entry.ingredient) {
      ingredients.add(entry.ingredient);
      continue;
    }

    if (entry.special) {
      const parsed = parseSpecialIngredient(entry.special, catalogSortedByLength);
      if (parsed) {
        ingredients.add(parsed);
      }
    }
  }

  return [...ingredients].sort((a, b) => a.localeCompare(b));
}

export function buildCatalog(baseIngredients, recipes) {
  const catalog = new Set(Object.keys(baseIngredients));
  let catalogSortedByLength = [...catalog].sort((a, b) => b.length - a.length);

  for (const recipe of recipes) {
    for (const entry of recipe.ingredients) {
      if (entry.ingredient) {
        catalog.add(entry.ingredient);
        continue;
      }

      if (entry.special) {
        const parsed = parseSpecialIngredient(entry.special, catalogSortedByLength);
        if (parsed) {
          catalog.add(parsed);
        }
      }
    }
    catalogSortedByLength = [...catalog].sort((a, b) => b.length - a.length);
  }

  return [...catalog].sort((a, b) => a.localeCompare(b));
}

export function buildCatalogSortedByLength(catalog) {
  return [...catalog].sort((a, b) => b.length - a.length);
}
