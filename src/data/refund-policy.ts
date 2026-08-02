export interface PolicyRule {
  id: string;
  category: string;
  title: string;
  description: string;
  isStrict: boolean;
}

export const REFUND_POLICY_DOCUMENT = {
  title: "Apex Store Official E-Commerce Refund Policy (2026 Revision)",
  effectiveDate: "2026-01-01",
  version: "4.3",
  summary: "This policy details the eligibility requirements, conditions, timeframes, and fee structures for customer refund requests processed automatically or via customer support.",
  rules: [
    {
      id: "RULE-30D",
      category: "Time Limits",
      title: "Standard 30-Day Return Window",
      description: "Items are eligible for a full refund within 30 days from the date of delivery. Requests submitted after 30 days are automatically denied unless special VIP extensions apply.",
      isStrict: true
    },
    {
      id: "RULE-FINAL-SALE",
      category: "Exclusions",
      title: "Final Sale & Clearance Non-Refundable",
      description: "Items explicitly marked as 'Final Sale' or 'Clearance' are non-refundable under any circumstances unless arrived broken/defective.",
      isStrict: true
    },
    {
      id: "RULE-DIGITAL",
      category: "Exclusions",
      title: "Digital Products & Software Keys",
      description: "Digital goods, software keys, e-books, and downloadable assets are non-refundable once delivered/issued, as digital licenses cannot be returned.",
      isStrict: true
    },
    {
      id: "RULE-HYGIENE",
      category: "Exclusions",
      title: "Opened Personal Hygiene & Beauty Items",
      description: "For sanitary reasons, health, beauty, and personal hygiene items (e.g. toothbrush heads, unsealed skincare) that have been opened or used CANNOT be returned. Unopened items in original shrink-wrap remain eligible.",
      isStrict: true
    },
    {
      id: "RULE-RESTOCKING",
      category: "Fee Structures",
      title: "15% Restocking Fee for Opened Non-Defective Electronics",
      description: "Non-defective electronics or home items returned in 'Opened - Unused' condition are subject to a 15% restocking fee deducted from the final refund total.",
      isStrict: false
    },
    {
      id: "RULE-DAMAGE-DEFECT",
      category: "Full Waiver",
      title: "Damaged on Arrival & Manufacturing Defects",
      description: "Items arriving damaged or defective qualify for 100% full refund or free replacement with zero restocking or return shipping fees, provided photos/proof is logged.",
      isStrict: false
    },
    {
      id: "RULE-VIP-EXT",
      category: "Tier Perks",
      title: "VIP Member Grace Extension (Up to 45 Days)",
      description: "VIP tier members receive an extended 45-day return window. Returns between day 31 and day 45 are issued as Store Credit rather than original payment method.",
      isStrict: false
    },
    {
      id: "RULE-FRAUD",
      category: "Security & Risk",
      title: "High Refund Frequency & Fraud Escalation",
      description: "Accounts with 3+ prior refunds in the past 90 days or a Risk Score above 75 MUST NOT be processed automatically. The agent must deny or escalate the request to human supervisor review.",
      isStrict: true
    },
    {
      id: "RULE-ALREADY-REFUNDED",
      category: "Status & Claims",
      title: "Duplicate Claim / Order Already Refunded",
      description: "Orders or items that have already been marked as 'Returned' or previously refunded cannot be processed for a duplicate refund claim.",
      isStrict: true
    },
    {
      id: "RULE-NOT-DELIVERED",
      category: "Status & Claims",
      title: "Order In Transit / Unconfirmed Delivery",
      description: "Items that are currently 'In Transit' or 'Processing' cannot be returned for a refund until delivery has been confirmed by carrier tracking.",
      isStrict: true
    }
  ] as PolicyRule[]
};
