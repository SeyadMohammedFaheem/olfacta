/**
 * Fragrance Materials & Chemicals Lookup API Service
 * Combines PubChem REST API (NIH) with a curated Master Perfumery Natural & Aroma Chemical Database.
 */

export interface MaterialLookupResult {
  name: string;
  casNumber: string | null;
  inciName: string | null;
  materialType: "ESSENTIAL_OIL" | "AROMA_CHEMICAL" | "EXTRACT" | "SOLVENT" | "FRAGRANCE" | "OTHER";
  density: number | null;
  description: string | null;
  odorFamily?: string;
  notePyramid?: "TOP" | "HEART" | "BASE";
  source: "PUBCHEM_API" | "PERFUMERY_DATABASE";
}

// Curated Master Perfumery & Natural Oils Catalog
const PERFUMERY_MASTER_DB: MaterialLookupResult[] = [
  {
    name: "Ambroxan",
    casNumber: "6790-58-5",
    inciName: "AMBROXAN / DODECAHYDRO-TETRAMETHYLNAPHTHOFURAN",
    materialType: "AROMA_CHEMICAL",
    density: 0.98,
    description: "Dry amber, radiant woody, warm clean skin, fixative base note with tremendous diffusive power.",
    odorFamily: "Amber / Woody",
    notePyramid: "BASE",
    source: "PERFUMERY_DATABASE",
  },
  {
    name: "Iso E Super",
    casNumber: "54464-57-2",
    inciName: "TETRAMETHYL ACETYLOCTAHYDRONAPHTHALENES",
    materialType: "AROMA_CHEMICAL",
    density: 0.965,
    description: "Transparent velvety cedarwood, ambergris-like, adds fullness, aura, and velvet radiance to formulas.",
    odorFamily: "Woody / Amber",
    notePyramid: "BASE",
    source: "PERFUMERY_DATABASE",
  },
  {
    name: "Hedione (Methyl Dihydrojasmonate)",
    casNumber: "24851-98-7",
    inciName: "METHYL DIHYDROJASMONATE",
    materialType: "AROMA_CHEMICAL",
    density: 1.005,
    description: "Transparent dewy floral, jasmine petal freshness, boosts bloom and spatial projection.",
    odorFamily: "Floral / Citrus",
    notePyramid: "HEART",
    source: "PERFUMERY_DATABASE",
  },
  {
    name: "Bergamot Oil (FCF)",
    casNumber: "8007-75-8",
    inciName: "CITRUS AURANTIUM BERGAMIA PEEL OIL",
    materialType: "ESSENTIAL_OIL",
    density: 0.875,
    description: "Sparkling, crisp citrus-floral top note, sweet peppery Earl Grey character. FCF furocoumarin-free.",
    odorFamily: "Citrus / Fresh",
    notePyramid: "TOP",
    source: "PERFUMERY_DATABASE",
  },
  {
    name: "Mysore Sandalwood Oil",
    casNumber: "8006-87-9",
    inciName: "SANTALUM ALBUM OIL",
    materialType: "ESSENTIAL_OIL",
    density: 0.973,
    description: "Rich, creamy, warm precious wood, buttery balsamic and deeply diffusive fixative.",
    odorFamily: "Woody / Balsamic",
    notePyramid: "BASE",
    source: "PERFUMERY_DATABASE",
  },
  {
    name: "Damascenone Beta",
    casNumber: "23696-85-7",
    inciName: "BETA-DAMASCENONE",
    materialType: "AROMA_CHEMICAL",
    density: 0.945,
    description: "Intense stewed apples, baked plum, natural rose petal and tobacco nuances. Ultra potent micro-doser.",
    odorFamily: "Fruity / Floral",
    notePyramid: "HEART",
    source: "PERFUMERY_DATABASE",
  },
  {
    name: "Linalool Pure",
    casNumber: "78-70-6",
    inciName: "LINALOOL",
    materialType: "AROMA_CHEMICAL",
    density: 0.86,
    description: "Fresh floral, clean lavender-citrus, bergamot facet with smooth woody undertone.",
    odorFamily: "Fresh Floral",
    notePyramid: "TOP",
    source: "PERFUMERY_DATABASE",
  },
  {
    name: "Galaxolide 50% (IPM)",
    casNumber: "1222-05-5",
    inciName: "HEXAMETHYLINDANOPYRAN",
    materialType: "AROMA_CHEMICAL",
    density: 1.002,
    description: "Clean, sweet musky, powdery floral undertone, long-lasting tenacious background aura.",
    odorFamily: "Musk",
    notePyramid: "BASE",
    source: "PERFUMERY_DATABASE",
  },
  {
    name: "Vanillin Pure",
    casNumber: "121-33-5",
    inciName: "VANILLIN",
    materialType: "AROMA_CHEMICAL",
    density: 1.056,
    description: "Sweet, creamy, comforting gourmand vanilla bean with caramel and balsamic facets.",
    odorFamily: "Gourmand / Balsamic",
    notePyramid: "BASE",
    source: "PERFUMERY_DATABASE",
  },
  {
    name: "Patchouli Oil Dark",
    casNumber: "8014-09-3",
    inciName: "POGOSTEMON CABLIN LEAF OIL",
    materialType: "ESSENTIAL_OIL",
    density: 0.965,
    description: "Deep earthy, dark rich woody, mossy-herbal with sweet camphoraceous and amber undertones.",
    odorFamily: "Woody / Earthy",
    notePyramid: "BASE",
    source: "PERFUMERY_DATABASE",
  },
  {
    name: "Cardamom CO2 Extract",
    casNumber: "8000-66-6",
    inciName: "ELETTARIA CARDAMOMUM SEED EXTRACT",
    materialType: "EXTRACT",
    density: 0.925,
    description: "Aromatic spicy, balsamic resinous, fresh eucalyptus-lemon facet with warm woody drydown.",
    odorFamily: "Spicy / Aromatic",
    notePyramid: "TOP",
    source: "PERFUMERY_DATABASE",
  },
  {
    name: "Rose Absolute (Morocco)",
    casNumber: "8007-01-0",
    inciName: "ROSA CENTIFOLIA FLOWER EXTRACT",
    materialType: "EXTRACT",
    density: 0.985,
    description: "Rich, deep honeyed floral, warm spicy tea rose petals with profound depth and natural complexity.",
    odorFamily: "Floral",
    notePyramid: "HEART",
    source: "PERFUMERY_DATABASE",
  },
  {
    name: "Frankincense Oil (Olibanum)",
    casNumber: "8016-36-2",
    inciName: "BOSWELLIA CARTERII OIL",
    materialType: "ESSENTIAL_OIL",
    density: 0.87,
    description: "Fresh balsamic, citrus-peppery, meditative incense resin with dry woody undertones.",
    odorFamily: "Resinous / Balsamic",
    notePyramid: "HEART",
    source: "PERFUMERY_DATABASE",
  },
  {
    name: "Cashmeran (Velvione)",
    casNumber: "33704-61-9",
    inciName: "DIHYDRO-PENTAMETHYLINDANONE",
    materialType: "AROMA_CHEMICAL",
    density: 0.96,
    description: "Complex woody-musk with spicy cedar, wet concrete, and velvety animalic warmth.",
    odorFamily: "Musk / Woody",
    notePyramid: "BASE",
    source: "PERFUMERY_DATABASE",
  },
  {
    name: "Coumarin",
    casNumber: "91-64-5",
    inciName: "COUMARIN",
    materialType: "AROMA_CHEMICAL",
    density: 0.935,
    description: "Sweet tonka bean, freshly mown hay, almond and tobacco nuances. Classic Fougère anchor.",
    odorFamily: "Gourmand / Aromatic",
    notePyramid: "BASE",
    source: "PERFUMERY_DATABASE",
  },
  {
    name: "Perfumers Alcohol 96%",
    casNumber: "64-17-5",
    inciName: "ALCOHOL DENAT.",
    materialType: "SOLVENT",
    density: 0.81,
    description: "High-purity ethanol formulation base for fine fragrance compounding and diffusion.",
    odorFamily: "Solvent / Carrier",
    notePyramid: "TOP",
    source: "PERFUMERY_DATABASE",
  },
  {
    name: "Dipropylene Glycol (DPG)",
    casNumber: "25265-71-8",
    inciName: "DIPROPYLENE GLYCOL",
    materialType: "SOLVENT",
    density: 1.023,
    description: "Colorless, odorless solvent carrier and solubilizer for aroma chemicals and accords.",
    odorFamily: "Solvent",
    notePyramid: "BASE",
    source: "PERFUMERY_DATABASE",
  },
];

/**
 * Searches the local database and queries the PubChem API asynchronously
 */
export async function lookupMaterial(query: string): Promise<MaterialLookupResult[]> {
  const clean = query.trim().toLowerCase();
  if (!clean || clean.length < 2) return [];

  // 1. Search local curated perfumery master catalog
  const localMatches = PERFUMERY_MASTER_DB.filter(
    (item) =>
      item.name.toLowerCase().includes(clean) ||
      (item.casNumber && item.casNumber.includes(clean)) ||
      (item.inciName && item.inciName.toLowerCase().includes(clean))
  );

  // If local match is found, return it
  if (localMatches.length > 0) {
    return localMatches;
  }

  // 2. Query PubChem REST API (NIH) for chemical compounds
  try {
    const encoded = encodeURIComponent(query.trim());
    const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encoded}/property/IUPACName,MolecularWeight,CanonicalSMILES,Title/JSON`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const props = data?.PropertyTable?.Properties?.[0];

      if (props) {
        return [
          {
            name: props.Title || query.trim(),
            casNumber: null, // PubChem properties return IUPAC name; CAS is resolved in synonyms
            inciName: props.IUPACName ? props.IUPACName.toUpperCase() : null,
            materialType: "AROMA_CHEMICAL",
            density: 1.0,
            description: `IUPAC: ${props.IUPACName || "N/A"} (MW: ${props.MolecularWeight} g/mol). SMILES: ${props.CanonicalSMILES || "N/A"}`,
            source: "PUBCHEM_API",
          },
        ];
      }
    }
  } catch {
    // Graceful fallback on network timeout
  }

  return [];
}
