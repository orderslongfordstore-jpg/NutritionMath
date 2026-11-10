import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { calculateRecipe, formatNutrient, type Ingredient, type RecipeLine } from "../shared/nutrition";
import "./styles.css";

const seed: Ingredient[] = [
  { id: "oats", name: "Rolled oats", unit: "g", nutrientsPer100: { energyKj: 1560, proteinG: 13.2, fatG: 6.5, saturatedG: 1.1, carbohydrateG: 58.7, sugarsG: 1.0, sodiumMg: 2 } },
  { id: "milk", name: "Full cream milk", unit: "mL", nutrientsPer100: { energyKj: 270, proteinG: 3.4, fatG: 3.5, saturatedG: 2.3, carbohydrateG: 5.0, sugarsG: 5.0, sodiumMg: 40 } },
  { id: "banana", name: "Banana", unit: "g", nutrientsPer100: { energyKj: 371, proteinG: 1.1, fatG: 0.2, saturatedG: 0.1, carbohydrateG: 20.1, sugarsG: 12.2, sodiumMg: 1 } },
];
const nutrientRows: { key: keyof NonNullable<Ingredient["nutrientsPer100"]>; label: string; unit: string }[] = [
  { key: "energyKj", label: "Energy", unit: "kJ" }, { key: "proteinG", label: "Protein", unit: "g" }, { key: "fatG", label: "Fat, total", unit: "g" }, { key: "saturatedG", label: "Saturated", unit: "g" }, { key: "carbohydrateG", label: "Carbohydrate", unit: "g" }, { key: "sugarsG", label: "Sugars", unit: "g" }, { key: "sodiumMg", label: "Sodium", unit: "mg" },
];

function App() {
  const [lines, setLines] = useState<RecipeLine[]>([{ ingredient: seed[0], quantity: 80, unit: "g" }, { ingredient: seed[1], quantity: 200, unit: "mL" }, { ingredient: seed[2], quantity: 100, unit: "g" }]);
  const [cooked, setCooked] = useState(330); const [servings, setServings] = useState(2); const [name, setName] = useState("Banana oat breakfast bowl");
  const result = useMemo(() => calculateRecipe(lines, cooked, servings), [lines, cooked, servings]);
  const updateLine = (index: number, patch: Partial<RecipeLine>) => setLines(current => current.map((line, i) => i === index ? { ...line, ...patch } : line));
  return <main>
    <header><div className="brand"><span className="mark">n</span><span>nutrition<span className="yellow">Math</span></span></div><span className="badge">AUSTRALIA · FSANZ READY</span></header>
    <section className="hero"><div><p className="eyebrow">RECIPE WORKSPACE</p><h1>Make every batch<br /><span>count.</span></h1><p className="lede">Calculate nutrition, production weight and serving values with a clear Australian labelling workflow.</p></div><div className="status"><span className="dot" /> Calculator live</div></section>
    <section className="workspace">
      <div className="panel inputs"><div className="panel-head"><div><p className="eyebrow">01 · RECIPE INPUT</p><h2>Build your recipe</h2></div><span className="count">{lines.length} items</span></div>
        <label>Recipe name<input value={name} onChange={e => setName(e.target.value)} /></label>
        <div className="line-list">{lines.map((line, index) => <div className="line" key={index}><select value={line.ingredient.id} onChange={e => updateLine(index, { ingredient: seed.find(item => item.id === e.target.value)! })}>{seed.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><input type="number" min="0" value={line.quantity} onChange={e => updateLine(index, { quantity: Number(e.target.value) })} /><select value={line.unit} onChange={e => updateLine(index, { unit: e.target.value as RecipeLine["unit"] })}><option>g</option><option>kg</option><option>mL</option></select><button className="icon" aria-label="Remove ingredient" onClick={() => setLines(lines.filter((_, i) => i !== index))}>×</button></div>)}</div>
        <button className="add" onClick={() => setLines([...lines, { ingredient: seed[0], quantity: 0, unit: "g" }])}>+ Add ingredient</button>
        <div className="settings"><label>Cooked batch weight (g)<input type="number" min="1" value={cooked} onChange={e => setCooked(Number(e.target.value))} /></label><label>Servings<input type="number" min="1" value={servings} onChange={e => setServings(Number(e.target.value))} /></label></div>
      </div>
      <div className="panel output"><div className="panel-head"><div><p className="eyebrow">02 · NUTRITION INFORMATION</p><h2>Australian NIP preview</h2></div><span className={result.completeness === "complete" ? "verified" : "partial"}>{result.completeness === "complete" ? "Verified inputs" : "Partial data"}</span></div>
        <div className="nip"><div className="nip-title">Nutrition Information</div><div className="nip-sub">{name || "Untitled recipe"}</div><div className="nip-serving">Servings per package: {result.servings}<br />Serving size: {Math.round(result.batchWeightG / result.servings)} g</div><div className="nip-row head"><span></span><span>Per serve</span><span>Per 100 g</span></div>{nutrientRows.map(row => <div className="nip-row" key={row.key}><strong>{row.label}</strong><span>{formatNutrient(row.key, result.perServing[row.key])} {row.unit}</span><span>{formatNutrient(row.key, result.per100G[row.key])} {row.unit}</span></div>)}</div>
        <div className="output-note"><strong>{result.completeness === "complete" ? "Ready for review" : "Complete your source data"}</strong><span>{result.completeness === "complete" ? "Values calculated from the current recipe." : "Missing nutrient fields are shown as — and are never estimated."}</span></div>
      </div>
    </section>
    <footer><span>nutritionMath · Calculation workspace</span><span>FSANZ reference workflow · Always verify final labels before sale.</span></footer>
  </main>;
}

createRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);
