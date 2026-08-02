import { CRM_DATABASE, CustomerProfile, Order } from "@/data/crm-data";
import { REFUND_POLICY_DOCUMENT, PolicyRule } from "@/data/refund-policy";

export interface ReasoningStep {
  stepNumber: number;
  thought: string;
  action?: string;
  actionInput?: Record<string, any>;
  observation?: Record<string, any> | string;
  timestamp: string;
  tokenUsage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  latencyMs?: number;
}

export interface RefundDecision {
  status: "APPROVED" | "DENIED" | "ESCALATED";
  orderId: string;
  amountRefunded: number;
  restockingFee: number;
  originalAmount: number;
  refundMethod: "Original Payment" | "Store Credit" | "None";
  appliedRules: string[]; // Rule IDs
  summary: string;
  customerExplanation: string;
  transactionId?: string;
}

// Open AI Function Calling Specifications
export const TOOL_SCHEMAS = [
  {
    type: "function",
    function: {
      name: "lookup_customer",
      description: "Lookup customer profile, order history, prior refund count, member tier, and fraud risk score by Customer ID, Email, or Order ID.",
      parameters: {
        type: "object",
        properties: {
          customerId: { type: "string", description: "Customer ID (e.g. CUST-1001)" },
          email: { type: "string", description: "Customer email address" },
          orderId: { type: "string", description: "Order ID (e.g. ORD-1001)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_order_details",
      description: "Retrieve order items, purchase date, delivery date, order status, return window eligibility, and condition.",
      parameters: {
        type: "object",
        properties: {
          orderId: { type: "string", description: "Order ID to look up (e.g. ORD-1001)" }
        },
        required: ["orderId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "check_policy_rules",
      description: "Evaluate return claim against Apex refund policy rules (30-day window, final sale, digital items, hygiene, restocking fees, VIP extension, fraud limits, already refunded, in-transit status).",
      parameters: {
        type: "object",
        properties: {
          daysElapsed: { type: "number", description: "Days elapsed since item delivery date" },
          category: { type: "string", description: "Item category (Electronics, Apparel, Home, Digital, Hygiene, Final Sale)" },
          condition: { type: "string", description: "Item return condition (Unopened, Opened - Unused, Opened - Used, Damaged on Arrival, Defective)" },
          isFinalSale: { type: "boolean", description: "Whether the item was sold on final clearance" },
          memberTier: { type: "string", description: "Customer membership tier (VIP, Regular, New Member)" },
          riskScore: { type: "number", description: "Customer fraud risk score (0-100)" },
          orderStatus: { type: "string", description: "Order delivery status (Delivered, In Transit, Returned, Processing)" },
          isAlreadyRefunded: { type: "boolean", description: "Whether the order was previously refunded" }
        },
        required: ["daysElapsed", "category", "memberTier", "riskScore"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "process_refund",
      description: "Process approved refund transaction with calculated amount and refund method.",
      parameters: {
        type: "object",
        properties: {
          orderId: { type: "string", description: "Order ID being refunded" },
          amount: { type: "number", description: "Net dollar amount to refund" },
          refundMethod: { type: "string", enum: ["Original Payment", "Store Credit"], description: "Method of refund" },
          reason: { type: "string", description: "Reason for approval" }
        },
        required: ["orderId", "amount", "refundMethod", "reason"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "deny_refund",
      description: "Process formal refund denial with policy citation.",
      parameters: {
        type: "object",
        properties: {
          orderId: { type: "string", description: "Order ID being denied" },
          ruleId: { type: "string", description: "Policy rule ID violated (e.g. RULE-30D, RULE-FINAL-SALE, RULE-ALREADY-REFUNDED, RULE-NOT-DELIVERED)" },
          reason: { type: "string", description: "Detailed customer-facing explanation" }
        },
        required: ["orderId", "ruleId", "reason"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "escalate_to_human",
      description: "Escalate refund request to senior human supervisor for review due to fraud risk or policy edge cases.",
      parameters: {
        type: "object",
        properties: {
          orderId: { type: "string", description: "Order ID being escalated" },
          riskScore: { type: "number", description: "Customer fraud risk score" },
          reason: { type: "string", description: "Reason for escalation" }
        },
        required: ["orderId", "riskScore", "reason"]
      }
    }
  }
];

export const AGENT_TOOLS = {
  lookup_customer: {
    name: "lookup_customer",
    execute: (query: { customerId?: string; email?: string; orderId?: string }) => {
      let customer: CustomerProfile | undefined;
      if (query.customerId) {
        customer = CRM_DATABASE.find(c => c.customerId.toLowerCase() === query.customerId?.toLowerCase());
      } else if (query.email) {
        customer = CRM_DATABASE.find(c => c.email.toLowerCase() === query.email?.toLowerCase());
      } else if (query.orderId) {
        customer = CRM_DATABASE.find(c => c.orders.some(o => o.orderId.toLowerCase() === query.orderId?.toLowerCase()));
      }

      if (!customer) {
        return { success: false, message: `No customer record found for query: ${JSON.stringify(query)}` };
      }

      return {
        success: true,
        customer: {
          customerId: customer.customerId,
          name: customer.name,
          email: customer.email,
          memberTier: customer.memberTier,
          priorRefundsCount: customer.priorRefundsCount,
          priorRefundsTotal: customer.priorRefundsTotal,
          riskScore: customer.riskScore,
          ordersCount: customer.totalOrdersCount,
          hasZeroOrders: customer.orders.length === 0,
          recentOrders: customer.orders.map(o => ({
            orderId: o.orderId,
            purchaseDate: o.purchaseDate,
            deliveryDate: o.deliveryDate,
            status: o.status,
            isAlreadyRefunded: o.isAlreadyRefunded || false,
            totalAmount: o.totalAmount,
            items: o.items
          }))
        }
      };
    }
  },

  get_order_details: {
    name: "get_order_details",
    execute: (query: { orderId: string }) => {
      let foundOrder: Order | undefined;
      let customer: CustomerProfile | undefined;

      for (const c of CRM_DATABASE) {
        const order = c.orders.find(o => o.orderId.toLowerCase() === query.orderId.toLowerCase());
        if (order) {
          foundOrder = order;
          customer = c;
          break;
        }
      }

      if (!foundOrder || !customer) {
        return { success: false, message: `Order ${query.orderId} not found in database.` };
      }

      const currentDate = new Date("2026-08-02");
      const deliveryDate = new Date(foundOrder.deliveryDate);
      const diffTime = Math.abs(currentDate.getTime() - deliveryDate.getTime());
      const daysElapsed = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        success: true,
        order: foundOrder,
        customerName: customer.name,
        customerId: customer.customerId,
        memberTier: customer.memberTier,
        daysElapsedSinceDelivery: daysElapsed,
        orderStatus: foundOrder.status,
        isAlreadyRefunded: foundOrder.isAlreadyRefunded || false
      };
    }
  },

  check_policy_rules: {
    name: "check_policy_rules",
    execute: (params: {
      daysElapsed: number;
      category: string;
      condition?: string;
      isFinalSale?: boolean;
      memberTier: string;
      riskScore: number;
      orderStatus?: string;
      isAlreadyRefunded?: boolean;
    }) => {
      const violatedRules: PolicyRule[] = [];
      const passedRules: PolicyRule[] = [];
      let restockingFeePercentage = 0;
      let isStoreCreditOnly = false;

      // Edge Case 1: Already Refunded
      if (params.isAlreadyRefunded || params.orderStatus === "Returned") {
        violatedRules.push(REFUND_POLICY_DOCUMENT.rules.find(r => r.id === "RULE-ALREADY-REFUNDED")!);
      }

      // Edge Case 2: Order In Transit / Not Delivered
      if (params.orderStatus === "In Transit" || params.orderStatus === "Processing") {
        violatedRules.push(REFUND_POLICY_DOCUMENT.rules.find(r => r.id === "RULE-NOT-DELIVERED")!);
      }

      // Final Sale Rule
      if (params.isFinalSale || params.category === "Final Sale") {
        if (params.condition !== "Damaged on Arrival" && params.condition !== "Defective") {
          violatedRules.push(REFUND_POLICY_DOCUMENT.rules.find(r => r.id === "RULE-FINAL-SALE")!);
        }
      }

      // Digital Goods Rule
      if (params.category === "Digital") {
        violatedRules.push(REFUND_POLICY_DOCUMENT.rules.find(r => r.id === "RULE-DIGITAL")!);
      }

      // Hygiene Items Rule
      if (params.category === "Hygiene" && (params.condition === "Opened - Used" || params.condition === "Opened - Unused")) {
        violatedRules.push(REFUND_POLICY_DOCUMENT.rules.find(r => r.id === "RULE-HYGIENE")!);
      }

      // Fraud / High Risk Score
      if (params.riskScore > 75) {
        violatedRules.push(REFUND_POLICY_DOCUMENT.rules.find(r => r.id === "RULE-FRAUD")!);
      }

      // 30-Day Window with VIP extension
      if (params.daysElapsed > 30) {
        if (params.memberTier === "VIP" && params.daysElapsed <= 45) {
          passedRules.push(REFUND_POLICY_DOCUMENT.rules.find(r => r.id === "RULE-VIP-EXT")!);
          isStoreCreditOnly = true;
        } else {
          violatedRules.push(REFUND_POLICY_DOCUMENT.rules.find(r => r.id === "RULE-30D")!);
        }
      } else {
        passedRules.push(REFUND_POLICY_DOCUMENT.rules.find(r => r.id === "RULE-30D")!);
      }

      // Restocking Fee
      if (params.condition === "Opened - Unused" && (params.category === "Electronics" || params.category === "Home")) {
        restockingFeePercentage = 15;
        passedRules.push(REFUND_POLICY_DOCUMENT.rules.find(r => r.id === "RULE-RESTOCKING")!);
      }

      // Damaged/Defective Full Waiver
      if (params.condition === "Damaged on Arrival" || params.condition === "Defective") {
        passedRules.push(REFUND_POLICY_DOCUMENT.rules.find(r => r.id === "RULE-DAMAGE-DEFECT")!);
      }

      return {
        isEligible: violatedRules.length === 0,
        violatedRules: violatedRules.map(r => r.id),
        violatedRuleDetails: violatedRules,
        passedRules: passedRules.map(r => r.id),
        restockingFeePercentage,
        isStoreCreditOnly
      };
    }
  },

  process_refund: {
    name: "process_refund",
    execute: (params: { orderId: string; amount: number; refundMethod: "Original Payment" | "Store Credit"; reason: string }) => {
      const transactionId = `TXN-REF-${Math.floor(100000 + Math.random() * 900000)}`;

      // Update CRM state in memory so subsequent claims are flagged as duplicate
      for (const c of CRM_DATABASE) {
        const order = c.orders.find(o => o.orderId.toLowerCase() === params.orderId.toLowerCase());
        if (order) {
          order.status = "Returned";
          order.isAlreadyRefunded = true;
          break;
        }
      }

      return {
        success: true,
        transactionId,
        refundedAmount: params.amount,
        method: params.refundMethod,
        timestamp: new Date().toISOString(),
        status: "COMPLETED",
        message: `Refund of $${params.amount.toFixed(2)} processed successfully via ${params.refundMethod}.`
      };
    }
  },

  deny_refund: {
    name: "deny_refund",
    execute: (params: { orderId: string; ruleId: string; reason: string }) => {
      return {
        success: true,
        status: "DENIED",
        orderId: params.orderId,
        violatedRule: params.ruleId,
        explanation: params.reason,
        timestamp: new Date().toISOString()
      };
    }
  },

  escalate_to_human: {
    name: "escalate_to_human",
    execute: (params: { orderId: string; riskScore: number; reason: string }) => {
      const caseId = `ESC-${Math.floor(1000 + Math.random() * 9000)}`;
      return {
        success: true,
        status: "ESCALATED",
        caseId,
        orderId: params.orderId,
        assignedQueue: "Senior Escalations Supervisor",
        timestamp: new Date().toISOString()
      };
    }
  }
};
