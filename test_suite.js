const cardValidator = require("./src/utils/cardValidator");
const fraudEngine = require("./src/services/fraudEngine");

console.log("=== LUHN CHECKSUM TEST ===");
const validVisa = "4532015588994123";
const invalidVisa = "4532015588994124";
console.log("Valid Visa (Expected true):", cardValidator.validateLuhn(validVisa));
console.log("Invalid Visa (Expected false):", cardValidator.validateLuhn(invalidVisa));

console.log("\n=== BRAND DETECTION & PCI MASKING ===");
console.log("Detected Brand:", cardValidator.detectCardBrand(validVisa).name);
console.log("PCI Masked PAN:", cardValidator.maskCardNumber(validVisa));
console.log("Display Masked:", cardValidator.formatDisplayMasked(validVisa));

console.log("\n=== FRAUD ENGINE HEURISTIC TESTS ===");
const normalTx = fraudEngine.evaluateRisk({
  cardLast4: "4123",
  cardBin: "453201",
  binData: { country: { alpha2: "US", name: "United States" }, prepaid: false },
  amount: 49.99,
  clientIp: "192.168.1.1",
  billingCountry: "US"
});
console.log("Normal Tx -> Decision:", normalTx.decision, "| Score:", normalTx.score);

const flaggedTx = fraudEngine.evaluateRisk({
  cardLast4: "4123",
  cardBin: "453201",
  binData: { country: { alpha2: "US", name: "United States" }, prepaid: true },
  amount: 3500.00,
  clientIp: "192.168.1.1",
  billingCountry: "GB"
});
console.log("Flagged Tx -> Decision:", flaggedTx.decision, "| Score:", flaggedTx.score, "| Flags:", flaggedTx.flags.map(f => f.code));
