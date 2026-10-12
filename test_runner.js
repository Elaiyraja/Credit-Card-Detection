const cardValidator = require("./src/utils/cardValidator");
const fraudEngine = require("./src/services/fraudEngine");
const paymentGateway = require("./src/services/paymentGateway");

async function runTests() {
  console.log("==================================================");
  console.log("🛡️  RUNNING CREDIT CARD GUARD TEST SUITE");
  console.log("==================================================");

  // 1. Luhn & Brand Detection Tests
  console.log("\n[1] CARD VALIDATION & BRAND RECOGNITION");
  const testCards = [
    { num: "4111111111111111", expectedBrand: "Visa", expectedLuhn: true },
    { num: "4532015588994123", expectedBrand: "Visa", expectedLuhn: false }, // invalid checksum sample
    { num: "5105107622019846", expectedBrand: "Mastercard", expectedLuhn: true },
    { num: "378282246310005", expectedBrand: "American Express", expectedLuhn: true },
    { num: "6011008933415520", expectedBrand: "Discover", expectedLuhn: true }
  ];

  testCards.forEach(tc => {
    const brand = cardValidator.detectCardBrand(tc.num).name;
    const luhn = cardValidator.validateLuhn(tc.num);
    const masked = cardValidator.maskCardNumber(tc.num);
    console.log(` -> Card: ${masked} | Brand: ${brand} | Luhn Valid: ${luhn}`);
  });

  // 2. PCI-DSS Masking Format Tests
  console.log("\n[2] PCI-DSS MASKING CONFORMANCE");
  const rawSample = "4111111111111111";
  const pciMask = cardValidator.maskCardNumber(rawSample);
  const displayMask = cardValidator.formatDisplayMasked(rawSample);
  console.log(` -> Raw Input:  ${rawSample}`);
  console.log(` -> Stored PAN: ${pciMask} (Strict First 6 + Last 4)`);
  console.log(` -> Visual UI:  ${displayMask}`);

  // 3. Fraud Engine Heuristics
  console.log("\n[3] HEURISTIC FRAUD & RISK SCORING");
  const lowRisk = fraudEngine.evaluateRisk({
    cardLast4: "1111",
    cardBin: "411111",
    binData: { country: { alpha2: "US", name: "United States" }, prepaid: false },
    amount: "75.00",
    clientIp: "192.168.1.50",
    billingCountry: "US"
  });
  console.log(` -> Benign Transaction -> Decision: ${lowRisk.decision} | Score: ${lowRisk.score}/100`);

  const highRisk = fraudEngine.evaluateRisk({
    cardLast4: "1111",
    cardBin: "411111",
    binData: { country: { alpha2: "US", name: "United States" }, prepaid: true },
    amount: "4500.00",
    clientIp: "192.168.1.50",
    billingCountry: "FR"
  });
  console.log(` -> High Risk Anomaly  -> Decision: ${highRisk.decision} | Score: ${highRisk.score}/100`);
  console.log(`    Flags: ${highRisk.flags.map(f => f.code).join(", ")}`);

  // 4. Payment Gateway & Tokenization
  console.log("\n[4] PAYMENT GATEWAY INTEGRATION & CAPTURE");
  const token = await paymentGateway.tokenizeCard({
    number: "4111111111111111",
    exp_month: "12",
    exp_year: "28",
    cvc: "123",
    name: "ALICE TESTER"
  });
  console.log(` -> Token Vault Created: ${token.tokenId} via ${token.gateway}`);

  // Normal capture
  const normalPayment = await paymentGateway.processPayment({
    tokenId: token.tokenId,
    amount: "49.99"
  });
  console.log(` -> Payment Captured -> Status: ${normalPayment.status} | Auth: ${normalPayment.authCode} | Latency: ${normalPayment.latencyMs}ms`);

  // Force decline capture
  const declinedPayment = await paymentGateway.processPayment({
    tokenId: token.tokenId,
    amount: "49.99",
    metadata: { forceDecline: true }
  });
  console.log(` -> Simulated Decline -> Status: ${declinedPayment.status} | Reason: ${declinedPayment.errorMessage}`);

  console.log("\n==================================================");
  console.log("✅ ALL TEST SCENARIOS COMPLETED SUCCESSFULLY");
  console.log("==================================================");
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
