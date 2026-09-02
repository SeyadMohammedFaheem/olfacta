import { PrismaClient } from "@prisma/client";
import { Role, MaterialType, ProductType, FormulaStatus, RuleType, Severity, BatchStatus } from "../src/types";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Olfacta database seed...");

  // Clean existing data for clean demo
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.batchIngredient.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.complianceSnapshot.deleteMany();
  await prisma.complianceFinding.deleteMany();
  await prisma.regulatoryRule.deleteMany();
  await prisma.regulatoryProfile.deleteMany();
  await prisma.regulatorySource.deleteMany();
  await prisma.formulaIngredient.deleteMany();
  await prisma.formulaVersion.deleteMany();
  await prisma.formula.deleteMany();
  await prisma.ingredientSupplier.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.organizationMember.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // 1. Create Organization
  const org = await prisma.organization.create({
    data: {
      name: "Aroma Labs",
      slug: "aroma-labs",
    },
  });
  console.log("🏢 Created Organization:", org.name);

  // 2. Create Users
  const passwordHash = await hash("password123", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Elena Rostova",
      email: "admin@aromalabs.demo",
      passwordHash,
      memberships: {
        create: { organizationId: org.id, role: Role.ADMIN },
      },
    },
  });

  const perfumer = await prisma.user.create({
    data: {
      name: "Jean-Claude Laurent",
      email: "perfumer@aromalabs.demo",
      passwordHash,
      memberships: {
        create: { organizationId: org.id, role: Role.PERFUMER },
      },
    },
  });

  const production = await prisma.user.create({
    data: {
      name: "Marco Silva",
      email: "production@aromalabs.demo",
      passwordHash,
      memberships: {
        create: { organizationId: org.id, role: Role.PRODUCTION },
      },
    },
  });

  const compliance = await prisma.user.create({
    data: {
      name: "Dr. Sarah Chen",
      email: "compliance@aromalabs.demo",
      passwordHash,
      memberships: {
        create: { organizationId: org.id, role: Role.COMPLIANCE },
      },
    },
  });
  console.log("👥 Created 4 Demo Users with role assignments");

  // 3. Create Suppliers
  const suppliersData = [
    { name: "Givaudan Fine Fragrances", contactName: "Pierre Dubois", email: "orders@givaudan.demo", website: "https://www.givaudan.com" },
    { name: "Firmenich Naturals", contactName: "Claire Moreau", email: "naturals@firmenich.demo", website: "https://www.firmenich.com" },
    { name: "IFF Aroma Specialties", contactName: "David Miller", email: "specialties@iff.demo", website: "https://www.iff.com" },
    { name: "Symrise Scent & Care", contactName: "Klaus Weber", email: "scent@symrise.demo", website: "https://www.symrise.com" },
    { name: "Mane Ingredients", contactName: "Sophie Mane", email: "info@mane.demo", website: "https://www.mane.com" },
  ];

  const suppliers = [];
  for (const s of suppliersData) {
    const supp = await prisma.supplier.create({
      data: { ...s, organizationId: org.id },
    });
    suppliers.push(supp);
  }
  console.log("🏭 Created 5 Suppliers");

  // 4. Create 20+ Realistic Fragrance Raw Materials
  const rawMaterials = [
    { name: "Bergamot Oil (FCF)", casNumber: "8007-75-8", inciName: "CITRUS AURANTIUM BERGAMIA PEEL OIL", materialType: MaterialType.ESSENTIAL_OIL, density: 0.875, costPerUnit: 0.28, supplierIdx: 1 },
    { name: "Iso E Super", casNumber: "54464-57-2", inciName: "TETRAMETHYL ACETYLOCTAHYDRONAPHTHALENES", materialType: MaterialType.AROMA_CHEMICAL, density: 0.965, costPerUnit: 0.08, supplierIdx: 2 },
    { name: "Hedione (Methyl Dihydrojasmonate)", casNumber: "24851-98-7", inciName: "METHYL DIHYDROJASMONATE", materialType: MaterialType.AROMA_CHEMICAL, density: 1.002, costPerUnit: 0.06, supplierIdx: 0 },
    { name: "Ambroxan", casNumber: "6790-58-5", inciName: "AMBROXAN", materialType: MaterialType.AROMA_CHEMICAL, density: 0.938, costPerUnit: 0.45, supplierIdx: 0 },
    { name: "Galaxolide 50% IPM", casNumber: "1222-05-5", inciName: "HHCB", materialType: MaterialType.AROMA_CHEMICAL, density: 1.005, costPerUnit: 0.05, supplierIdx: 2 },
    { name: "Linalool Pure", casNumber: "78-70-6", inciName: "LINALOOL", materialType: MaterialType.AROMA_CHEMICAL, density: 0.860, costPerUnit: 0.04, supplierIdx: 3 },
    { name: "Linalyl Acetate", casNumber: "115-95-7", inciName: "LINALYL ACETATE", materialType: MaterialType.AROMA_CHEMICAL, density: 0.901, costPerUnit: 0.05, supplierIdx: 3 },
    { name: "Vanillin Pure", casNumber: "121-33-5", inciName: "VANILLIN", materialType: MaterialType.AROMA_CHEMICAL, density: 1.060, costPerUnit: 0.12, supplierIdx: 4 },
    { name: "Damascenone Beta", casNumber: "23696-85-7", inciName: "ROSE KETONE-4", materialType: MaterialType.AROMA_CHEMICAL, density: 0.930, costPerUnit: 1.85, supplierIdx: 1 },
    { name: "Eugenol", casNumber: "97-53-0", inciName: "EUGENOL", materialType: MaterialType.AROMA_CHEMICAL, density: 1.065, costPerUnit: 0.15, supplierIdx: 1 },
    { name: "Cashmeran", casNumber: "33704-61-9", inciName: "DIHYDROINDEN-2-ONE", materialType: MaterialType.AROMA_CHEMICAL, density: 0.960, costPerUnit: 0.35, supplierIdx: 2 },
    { name: "Sandalore", casNumber: "65113-99-7", inciName: "CAMPHOLENIC ALCOHOL DERIVATIVE", materialType: MaterialType.AROMA_CHEMICAL, density: 0.915, costPerUnit: 0.22, supplierIdx: 0 },
    { name: "Lilial (Prohibited Demo)", casNumber: "80-54-6", inciName: "BUTYLPHENYL METHYLPROPIONAL", materialType: MaterialType.AROMA_CHEMICAL, density: 0.945, costPerUnit: 0.09, supplierIdx: 0 },
    { name: "Oakmoss Absolute (Demo Restr)", casNumber: "90028-68-5", inciName: "EVERNIA PRUNASTRI EXTRACT", materialType: MaterialType.EXTRACT, density: 1.100, costPerUnit: 2.40, supplierIdx: 1 },
    { name: "Calone 1951", casNumber: "28940-11-6", inciName: "METHYLENEDIOXYPHENYLMETHYLPROPANAL", materialType: MaterialType.AROMA_CHEMICAL, density: 1.190, costPerUnit: 0.65, supplierIdx: 3 },
    { name: "Cedarwood Virginia", casNumber: "8000-27-9", inciName: "JUNIPERUS VIRGINIANA OIL", materialType: MaterialType.ESSENTIAL_OIL, density: 0.955, costPerUnit: 0.18, supplierIdx: 4 },
    { name: "Rose Damascena Abs", casNumber: "8007-01-0", inciName: "ROSA DAMASCENA FLOWER EXTRACT", materialType: MaterialType.EXTRACT, density: 0.980, costPerUnit: 4.50, supplierIdx: 1 },
    { name: "Patchouli Oil Dark", casNumber: "8014-09-3", inciName: "POGOSTEMON CABLIN OIL", materialType: MaterialType.ESSENTIAL_OIL, density: 0.965, costPerUnit: 0.32, supplierIdx: 4 },
    { name: "Dipropylene Glycol (DPG)", casNumber: "25265-71-8", inciName: "DIPROPYLENE GLYCOL", materialType: MaterialType.SOLVENT, density: 1.023, costPerUnit: 0.01, supplierIdx: 3 },
    { name: "Triethyl Citrate (TEC)", casNumber: "77-93-0", inciName: "TRIETHYL CITRATE", materialType: MaterialType.SOLVENT, density: 1.137, costPerUnit: 0.02, supplierIdx: 3 },
    { name: "Perfumers Alcohol 96%", casNumber: "64-17-5", inciName: "ALCOHOL DENAT.", materialType: MaterialType.SOLVENT, density: 0.810, costPerUnit: 0.005, supplierIdx: 0 },
  ];

  const ingredientsMap = new Map<string, any>();

  for (const raw of rawMaterials) {
    const ing = await prisma.ingredient.create({
      data: {
        organizationId: org.id,
        name: raw.name,
        casNumber: raw.casNumber,
        inciName: raw.inciName,
        materialType: raw.materialType,
        density: raw.density,
        costPerUnit: raw.costPerUnit,
        costCurrency: "USD",
        costUnit: "g",
        status: "ACTIVE",
      },
    });

    // Link supplier
    await prisma.ingredientSupplier.create({
      data: {
        ingredientId: ing.id,
        supplierId: suppliers[raw.supplierIdx].id,
        isPreferred: true,
      },
    });

    ingredientsMap.set(raw.name, ing);
  }
  console.log("🧪 Created 21 Ingredients with Supplier mappings");

  // 5. Create Regulatory Profile & Source
  const regSource = await prisma.regulatorySource.create({
    data: {
      organizationId: org.id,
      name: "IFRA Standards (Demo Dataset)",
      version: "51st Amendment",
      description: "Demo data for formulation compliance engine testing",
    },
  });

  await prisma.regulatoryProfile.create({
    data: {
      organizationId: org.id,
      name: "Fine Fragrance IFRA Standards (Demo)",
      market: "Global / EU",
      standard: "IFRA 51",
      version: "1.0",
      description: "Default compliance profile for Eau de Parfum and fine fragrance formulation",
      isActive: true,
    },
  });

  // 6. Create Demo Regulatory Rules
  const lilial = ingredientsMap.get("Lilial (Prohibited Demo)");
  const damascenone = ingredientsMap.get("Damascenone Beta");
  const eugenol = ingredientsMap.get("Eugenol");
  const oakmoss = ingredientsMap.get("Oakmoss Absolute (Demo Restr)");
  const bergamot = ingredientsMap.get("Bergamot Oil (FCF)");

  // Prohibited substance rule (Lilial)
  await prisma.regulatoryRule.create({
    data: {
      organizationId: org.id,
      ingredientId: lilial.id,
      standard: "IFRA 51 / EU Cosmetic Reg",
      ruleType: RuleType.PROHIBITED,
      limitValue: 0,
      severity: Severity.VIOLATION,
      message: "Lilial (BMHCA) is banned in cosmetics and fine fragrances under EU Annex II and IFRA 51st Amendment.",
      isDemo: true,
      sourceId: regSource.id,
      sourceVersion: "51.0",
    },
  });

  // Max concentration rule (Damascenone - max 0.043%)
  await prisma.regulatoryRule.create({
    data: {
      organizationId: org.id,
      ingredientId: damascenone.id,
      productCategory: "EAU_DE_PARFUM",
      standard: "IFRA 51 (Category 4)",
      ruleType: RuleType.MAX_CONCENTRATION,
      limitValue: 0.05,
      warnAtPercentage: 75,
      severity: Severity.VIOLATION,
      message: "Beta-Damascenone is restricted to 0.05% max in Category 4 (Hydroalcoholic products for skin) due to skin sensitization potential.",
      isDemo: true,
      sourceId: regSource.id,
      sourceVersion: "51.0",
    },
  });

  // Max concentration rule (Eugenol - max 2.50%)
  await prisma.regulatoryRule.create({
    data: {
      organizationId: org.id,
      ingredientId: eugenol.id,
      productCategory: "EAU_DE_PARFUM",
      standard: "IFRA 51 (Category 4)",
      ruleType: RuleType.MAX_CONCENTRATION,
      limitValue: 2.5,
      warnAtPercentage: 80,
      severity: Severity.VIOLATION,
      message: "Eugenol concentration exceeds safety threshold for skin contact.",
      isDemo: true,
      sourceId: regSource.id,
      sourceVersion: "51.0",
    },
  });

  // Presence / Review rule (Oakmoss)
  await prisma.regulatoryRule.create({
    data: {
      organizationId: org.id,
      ingredientId: oakmoss.id,
      standard: "IFRA 51 (Category 4)",
      ruleType: RuleType.REQUIRES_REVIEW,
      limitValue: 0.1,
      severity: Severity.REVIEW_REQUIRED,
      message: "Oakmoss extracts require verification of atranol and chloroatranol levels (< 100 ppm total) before release.",
      isDemo: true,
      sourceId: regSource.id,
      sourceVersion: "51.0",
    },
  });

  console.log("⚖️ Created Demo Compliance & Safety Rules");

  // 7. Create 5 Demo Formulas

  // Formula 1: Citrus Woody EDP (Compliant)
  const f1 = await prisma.formula.create({
    data: {
      organizationId: org.id,
      name: "Citrus Woody EDP",
      description: "Crisp sparkling bergamot top note over an Iso E Super and Ambroxan amber-woody backbone.",
      productType: ProductType.EAU_DE_PARFUM,
      applicationCategory: "Fine Fragrance",
      market: "Global",
      status: FormulaStatus.DRAFT,
      createdById: perfumer.id,
    },
  });

  const f1v1 = await prisma.formulaVersion.create({
    data: {
      formulaId: f1.id,
      versionNumber: 1,
      targetWeight: 1000,
      weightUnit: "g",
      concentration: 20,
      totalWeight: 1000,
      totalPercentage: 100,
      status: FormulaStatus.DRAFT,
      createdById: perfumer.id,
    },
  });

  await prisma.formulaIngredient.createMany({
    data: [
      { formulaVersionId: f1v1.id, ingredientId: ingredientsMap.get("Bergamot Oil (FCF)").id, quantity: 45.0, sortOrder: 0 },
      { formulaVersionId: f1v1.id, ingredientId: ingredientsMap.get("Linalyl Acetate").id, quantity: 15.0, sortOrder: 1 },
      { formulaVersionId: f1v1.id, ingredientId: ingredientsMap.get("Hedione (Methyl Dihydrojasmonate)").id, quantity: 30.0, sortOrder: 2 },
      { formulaVersionId: f1v1.id, ingredientId: ingredientsMap.get("Iso E Super").id, quantity: 60.0, sortOrder: 3 },
      { formulaVersionId: f1v1.id, ingredientId: ingredientsMap.get("Cedarwood Virginia").id, quantity: 20.0, sortOrder: 4 },
      { formulaVersionId: f1v1.id, ingredientId: ingredientsMap.get("Ambroxan").id, quantity: 10.0, sortOrder: 5 },
      { formulaVersionId: f1v1.id, ingredientId: ingredientsMap.get("Galaxolide 50% IPM").id, quantity: 20.0, sortOrder: 6 },
      { formulaVersionId: f1v1.id, ingredientId: ingredientsMap.get("Perfumers Alcohol 96%").id, quantity: 800.0, sortOrder: 7 },
    ],
  });

  // Formula 2: Rose Musk (Formula with Warning: Damascenone close to threshold)
  const f2 = await prisma.formula.create({
    data: {
      organizationId: org.id,
      name: "Rose Musk",
      description: "Rich Turkish rose petals laced with beta-damascenone over soft crystalline white musks.",
      productType: ProductType.EAU_DE_PARFUM,
      applicationCategory: "Fine Fragrance",
      market: "Global",
      status: FormulaStatus.DRAFT,
      createdById: perfumer.id,
    },
  });

  const f2v1 = await prisma.formulaVersion.create({
    data: {
      formulaId: f2.id,
      versionNumber: 1,
      targetWeight: 1000,
      weightUnit: "g",
      concentration: 18,
      totalWeight: 1000,
      totalPercentage: 100,
      status: FormulaStatus.DRAFT,
      createdById: perfumer.id,
    },
  });

  await prisma.formulaIngredient.createMany({
    data: [
      { formulaVersionId: f2v1.id, ingredientId: ingredientsMap.get("Rose Damascena Abs").id, quantity: 25.0, sortOrder: 0 },
      { formulaVersionId: f2v1.id, ingredientId: ingredientsMap.get("Damascenone Beta").id, quantity: 0.40, sortOrder: 1 }, // 0.04% of 1000g -> 80% of 0.05% limit => WARNING
      { formulaVersionId: f2v1.id, ingredientId: ingredientsMap.get("Hedione (Methyl Dihydrojasmonate)").id, quantity: 40.0, sortOrder: 2 },
      { formulaVersionId: f2v1.id, ingredientId: ingredientsMap.get("Galaxolide 50% IPM").id, quantity: 70.0, sortOrder: 3 },
      { formulaVersionId: f2v1.id, ingredientId: ingredientsMap.get("Cashmeran").id, quantity: 15.0, sortOrder: 4 },
      { formulaVersionId: f2v1.id, ingredientId: ingredientsMap.get("Vanillin Pure").id, quantity: 4.6, sortOrder: 5 },
      { formulaVersionId: f2v1.id, ingredientId: ingredientsMap.get("Dipropylene Glycol (DPG)").id, quantity: 25.0, sortOrder: 6 },
      { formulaVersionId: f2v1.id, ingredientId: ingredientsMap.get("Perfumers Alcohol 96%").id, quantity: 820.0, sortOrder: 7 },
    ],
  });

  // Formula 3: Fresh Marine (Formula with Violation: Prohibited Lilial present)
  const f3 = await prisma.formula.create({
    data: {
      organizationId: org.id,
      name: "Fresh Marine",
      description: "Ozone marine accord with Calone and floral heart (Contains banned material for test demonstration).",
      productType: ProductType.EAU_DE_PARFUM,
      applicationCategory: "Fine Fragrance",
      market: "EU",
      status: FormulaStatus.DRAFT,
      createdById: perfumer.id,
    },
  });

  const f3v1 = await prisma.formulaVersion.create({
    data: {
      formulaId: f3.id,
      versionNumber: 1,
      targetWeight: 1000,
      weightUnit: "g",
      concentration: 15,
      totalWeight: 1000,
      totalPercentage: 100,
      status: FormulaStatus.DRAFT,
      createdById: perfumer.id,
    },
  });

  await prisma.formulaIngredient.createMany({
    data: [
      { formulaVersionId: f3v1.id, ingredientId: ingredientsMap.get("Calone 1951").id, quantity: 5.0, sortOrder: 0 },
      { formulaVersionId: f3v1.id, ingredientId: ingredientsMap.get("Bergamot Oil (FCF)").id, quantity: 35.0, sortOrder: 1 },
      { formulaVersionId: f3v1.id, ingredientId: ingredientsMap.get("Lilial (Prohibited Demo)").id, quantity: 12.0, sortOrder: 2 }, // VIOLATION
      { formulaVersionId: f3v1.id, ingredientId: ingredientsMap.get("Hedione (Methyl Dihydrojasmonate)").id, quantity: 40.0, sortOrder: 3 },
      { formulaVersionId: f3v1.id, ingredientId: ingredientsMap.get("Ambroxan").id, quantity: 8.0, sortOrder: 4 },
      { formulaVersionId: f3v1.id, ingredientId: ingredientsMap.get("Perfumers Alcohol 96%").id, quantity: 900.0, sortOrder: 5 },
    ],
  });

  // Record findings for Fresh Marine
  await prisma.complianceFinding.create({
    data: {
      formulaId: f3.id,
      formulaVersionId: f3v1.id,
      ingredientId: lilial.id,
      severity: Severity.VIOLATION,
      status: "OPEN",
      currentValue: 1.2,
      limitValue: 0,
      unit: "%",
      message: "Lilial (BMHCA) is banned in cosmetics and fine fragrances under EU Annex II and IFRA 51st Amendment.",
      source: "IFRA 51 / EU",
      sourceVersion: "51.0",
    },
  });

  // Formula 4: Oud Amber (Formula requiring Review: Oakmoss)
  const f4 = await prisma.formula.create({
    data: {
      organizationId: org.id,
      name: "Oud Amber",
      description: "Deep smoky woods, patchouli and oakmoss absolute requiring batch analytical certificate review.",
      productType: ProductType.EAU_DE_PARFUM,
      applicationCategory: "Fine Fragrance",
      market: "Middle East",
      status: FormulaStatus.IN_REVIEW,
      createdById: perfumer.id,
    },
  });

  const f4v1 = await prisma.formulaVersion.create({
    data: {
      formulaId: f4.id,
      versionNumber: 1,
      targetWeight: 1000,
      weightUnit: "g",
      concentration: 25,
      totalWeight: 1000,
      totalPercentage: 100,
      status: FormulaStatus.IN_REVIEW,
      createdById: perfumer.id,
    },
  });

  await prisma.formulaIngredient.createMany({
    data: [
      { formulaVersionId: f4v1.id, ingredientId: ingredientsMap.get("Patchouli Oil Dark").id, quantity: 60.0, sortOrder: 0 },
      { formulaVersionId: f4v1.id, ingredientId: ingredientsMap.get("Cedarwood Virginia").id, quantity: 40.0, sortOrder: 1 },
      { formulaVersionId: f4v1.id, ingredientId: ingredientsMap.get("Sandalore").id, quantity: 20.0, sortOrder: 2 },
      { formulaVersionId: f4v1.id, ingredientId: ingredientsMap.get("Oakmoss Absolute (Demo Restr)").id, quantity: 1.5, sortOrder: 3 }, // REVIEW REQUIRED
      { formulaVersionId: f4v1.id, ingredientId: ingredientsMap.get("Vanillin Pure").id, quantity: 8.5, sortOrder: 4 },
      { formulaVersionId: f4v1.id, ingredientId: ingredientsMap.get("Iso E Super").id, quantity: 120.0, sortOrder: 5 },
      { formulaVersionId: f4v1.id, ingredientId: ingredientsMap.get("Perfumers Alcohol 96%").id, quantity: 750.0, sortOrder: 6 },
    ],
  });

  await prisma.complianceFinding.create({
    data: {
      formulaId: f4.id,
      formulaVersionId: f4v1.id,
      ingredientId: oakmoss.id,
      severity: Severity.REVIEW_REQUIRED,
      status: "OPEN",
      currentValue: 0.15,
      limitValue: 0.1,
      unit: "%",
      message: "Oakmoss extracts require verification of atranol and chloroatranol levels (< 100 ppm total) before release.",
      source: "IFRA 51",
      sourceVersion: "51.0",
    },
  });

  // Formula 5: Vanilla Woods (Approved & Production Ready)
  const f5 = await prisma.formula.create({
    data: {
      organizationId: org.id,
      name: "Vanilla Woods",
      description: "Sensual Bourbon vanilla infused with cream sandalwood, cashmeran, and cedarwood.",
      productType: ProductType.EAU_DE_PARFUM,
      applicationCategory: "Fine Fragrance",
      market: "Global",
      status: FormulaStatus.APPROVED,
      createdById: perfumer.id,
    },
  });

  const f5v1 = await prisma.formulaVersion.create({
    data: {
      formulaId: f5.id,
      versionNumber: 1,
      targetWeight: 1000,
      weightUnit: "g",
      concentration: 22,
      totalWeight: 1000,
      totalPercentage: 100,
      status: FormulaStatus.APPROVED,
      createdById: perfumer.id,
      approvedById: compliance.id,
      approvedAt: new Date(),
    },
  });

  await prisma.formulaIngredient.createMany({
    data: [
      { formulaVersionId: f5v1.id, ingredientId: ingredientsMap.get("Vanillin Pure").id, quantity: 15.0, sortOrder: 0 },
      { formulaVersionId: f5v1.id, ingredientId: ingredientsMap.get("Sandalore").id, quantity: 35.0, sortOrder: 1 },
      { formulaVersionId: f5v1.id, ingredientId: ingredientsMap.get("Cashmeran").id, quantity: 25.0, sortOrder: 2 },
      { formulaVersionId: f5v1.id, ingredientId: ingredientsMap.get("Cedarwood Virginia").id, quantity: 45.0, sortOrder: 3 },
      { formulaVersionId: f5v1.id, ingredientId: ingredientsMap.get("Iso E Super").id, quantity: 80.0, sortOrder: 4 },
      { formulaVersionId: f5v1.id, ingredientId: ingredientsMap.get("Hedione (Methyl Dihydrojasmonate)").id, quantity: 20.0, sortOrder: 5 },
      { formulaVersionId: f5v1.id, ingredientId: ingredientsMap.get("Perfumers Alcohol 96%").id, quantity: 780.0, sortOrder: 6 },
    ],
  });

  console.log("📝 Created 5 Demo Formulas spanning Compliant, Warning, Violation, Review, and Approved states");

  // 8. Create 3 Batches from the Approved Formula
  // Batch 1: In Production (25 kg)
  const batch1 = await prisma.batch.create({
    data: {
      organizationId: org.id,
      formulaId: f5.id,
      formulaVersionId: f5v1.id,
      batchNumber: "B-2608-001",
      targetQuantity: 25000,
      unit: "g",
      scaleFactor: 25.0,
      status: BatchStatus.IN_PRODUCTION,
      notes: "Commercial pilot run (25 kg scaled batch).",
      createdById: production.id,
    },
  });

  await prisma.batchIngredient.createMany({
    data: [
      { batchId: batch1.id, ingredientId: ingredientsMap.get("Vanillin Pure").id, targetQuantity: 375.0, actualQuantity: 374.8, difference: -0.2, unit: "g" },
      { batchId: batch1.id, ingredientId: ingredientsMap.get("Sandalore").id, targetQuantity: 875.0, actualQuantity: 875.2, difference: 0.2, unit: "g" },
      { batchId: batch1.id, ingredientId: ingredientsMap.get("Cashmeran").id, targetQuantity: 625.0, actualQuantity: 625.0, difference: 0.0, unit: "g" },
      { batchId: batch1.id, ingredientId: ingredientsMap.get("Cedarwood Virginia").id, targetQuantity: 1125.0, unit: "g" },
      { batchId: batch1.id, ingredientId: ingredientsMap.get("Iso E Super").id, targetQuantity: 2000.0, unit: "g" },
      { batchId: batch1.id, ingredientId: ingredientsMap.get("Hedione (Methyl Dihydrojasmonate)").id, targetQuantity: 500.0, unit: "g" },
      { batchId: batch1.id, ingredientId: ingredientsMap.get("Perfumers Alcohol 96%").id, targetQuantity: 19500.0, unit: "g" },
    ],
  });

  // Batch 2: Completed Batch (10 kg)
  const batch2 = await prisma.batch.create({
    data: {
      organizationId: org.id,
      formulaId: f5.id,
      formulaVersionId: f5v1.id,
      batchNumber: "B-2608-002",
      targetQuantity: 10000,
      actualQuantity: 10000.4,
      unit: "g",
      scaleFactor: 10.0,
      status: BatchStatus.COMPLETED,
      notes: "Client evaluation sample batch.",
      createdById: production.id,
      completedById: production.id,
      completedAt: new Date(),
    },
  });

  // Batch 3: Planned Batch (50 kg)
  await prisma.batch.create({
    data: {
      organizationId: org.id,
      formulaId: f5.id,
      formulaVersionId: f5v1.id,
      batchNumber: "B-2608-003",
      targetQuantity: 50000,
      unit: "g",
      scaleFactor: 50.0,
      status: BatchStatus.PLANNED,
      notes: "Scheduled full production run next week.",
      createdById: production.id,
    },
  });

  console.log("📦 Created 3 Production Batches (Planned, In Production, Completed)");

  // 9. Initial Audit Log
  await prisma.auditLog.create({
    data: {
      organizationId: org.id,
      userId: admin.id,
      action: "WORKSPACE_SEEDED",
      entityType: "Organization",
      entityId: org.id,
      newValue: JSON.stringify({ status: "DEMO_READY" }),
    },
  });

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
