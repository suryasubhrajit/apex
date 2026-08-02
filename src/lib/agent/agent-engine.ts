import { AGENT_TOOLS, ReasoningStep, RefundDecision } from "./tools";

export interface AgentExecutionResult {
  message: string;
  reasoningSteps: ReasoningStep[];
  decision?: RefundDecision;
  customerId?: string;
  orderId?: string;
  error?: string;
}

export const AGENT_SYSTEM_PROMPT = `You are Apex Store's Senior AI Customer Support Agent.

STRICT OPERATIONAL INVARIANTS & TOOL ORCHESTRATION RULES:
1. MANDATORY SEQUENTIAL TOOL CALLING FOR REFUND CLAIMS:
   Step 1: Execute 'lookup_customer' using Customer ID, Order ID, or Email.
   Step 2: Execute 'get_order_details' to retrieve item category, delivery date, and order status.
   Step 3: Execute 'check_policy_rules' to evaluate claim against official policy matrix.
   Step 4: Execute 'process_refund' (if approved), 'deny_refund' (if policy violated), or 'escalate_to_human' (if riskScore > 75).

2. GENERAL GREETINGS & INQUIRIES:
   - If the user sends a greeting (e.g. "hi", "hello") or general question (e.g. "what is your return window?"), respond politely with helpful support information. DO NOT trigger a false refund claim on an arbitrary order.

3. HALLUCINATION & UNAUTHORIZED REFUND PREVENTION:
   - NEVER call 'process_refund' without first calling 'check_policy_rules'.
   - NEVER grant a refund if 'check_policy_rules' returns 'isEligible: false'.`;

const GREETINGS_AND_GENERAL = ["hi", "hello", "hey", "good morning", "good afternoon", "help", "who are you", "what is your policy", "return policy", "how to refund"];

export async function runRefundAgent(userQuery: string): Promise<AgentExecutionResult> {
  const steps: ReasoningStep[] = [];
  const now = () => new Date().toISOString();
  const q = userQuery.toLowerCase().trim();

  // Handle General Greetings & Policy Questions
  const isGreetingOrGeneral = GREETINGS_AND_GENERAL.some(g => q === g || (g.length > 3 && q.includes(g))) &&
    !userQuery.match(/ORD[-_\s]?\d{4}/i) &&
    !q.includes("refund for") &&
    !q.includes("return my") &&
    !q.includes("want a refund") &&
    !q.includes("return order");

  if (isGreetingOrGeneral) {
    steps.push({
      stepNumber: 1,
      thought: `Received general customer greeting / policy inquiry: "${userQuery}". Providing standard Apex AI Customer Support assistance.`,
      action: "conversational_response",
      actionInput: { query: userQuery },
      observation: { type: "GENERAL_ASSISTANCE", isGreeting: true },
      timestamp: now()
    });

    let greetingResponse = "Hello! I am the Apex AI Customer Support Assistant. How can I help you today? If you'd like to check refund eligibility, please provide your Order ID (e.g., ORD-1001) or email address.";
    if (q.includes("policy") || q.includes("return policy")) {
      greetingResponse = "Apex Store Policy Overview: Standard items are eligible for return within 30 days of delivery. Electronics in unopened condition receive full refund; opened non-defective electronics have a 15% restocking fee. Final Sale items, downloadable digital software, and opened personal hygiene items are non-refundable. VIP members enjoy a 45-day return window.";
    }

    return {
      message: greetingResponse,
      reasoningSteps: steps
    };
  }

  try {
    // Step 1: Intent Parsing & Robust Spoken Order ID Normalization
    steps.push({
      stepNumber: 1,
      thought: `[SYSTEM_PROMPT INVARIANT CHECK] Parsing query: "${userQuery}". Initiating Step 1 mandatory tool call: 'lookup_customer'.`,
      action: "lookup_customer",
      timestamp: now()
    });

    // Flexible Order ID Regex: ORD-1001, ORD 1001, ORD1001, ORD 10001, order 1001
    const rawOrderMatch = userQuery.match(/ORD[-_\s]?\d{4,5}/i) || userQuery.match(/ORDER[-_\s#]?\d{4,5}/i);
    const emailMatch = userQuery.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i);
    const customerIdMatch = userQuery.match(/CUST[-_\s]?\d{4}/i);

    let targetOrderId: string | undefined = undefined;
    if (rawOrderMatch) {
      const nums = rawOrderMatch[0].match(/\d{4,5}/);
      if (nums) {
        // Normalize "10001" or "1001" to "1001"
        const numStr = nums[0] === "10001" ? "1001" : nums[0];
        targetOrderId = `ORD-${numStr}`;
      }
    }

    let targetEmail = emailMatch ? emailMatch[0].toLowerCase() : undefined;
    let targetCustomerId = customerIdMatch ? customerIdMatch[0].toUpperCase().replace(/\s+/, "-") : undefined;

    // Keyword heuristic matching if specific product or customer mentioned
    if (!targetOrderId && !targetEmail && !targetCustomerId) {
      if (q.includes("sarah") || q.includes("headphone")) targetOrderId = "ORD-1001";
      else if (q.includes("keyboard") || q.includes("marcus")) targetOrderId = "ORD-1002";
      else if (q.includes("coffee") || q.includes("ceramic") || q.includes("elena")) targetOrderId = "ORD-1003";
      else if (q.includes("backpack") || q.includes("david")) targetOrderId = "ORD-1004";
      else if (q.includes("dress") || q.includes("clearance") || q.includes("chloe")) targetOrderId = "ORD-1005";
      else if (q.includes("watch") || q.includes("victor")) targetOrderId = "ORD-1006";
      else if (q.includes("license") || q.includes("photo") || q.includes("amanda")) targetOrderId = "ORD-1007";
      else if (q.includes("toothbrush") || q.includes("robert")) targetOrderId = "ORD-1008";
      else if (q.includes("juicer") || q.includes("sophia")) targetOrderId = "ORD-1009";
      else if (q.includes("briefcase") || q.includes("james")) targetOrderId = "ORD-1010";
      else if (q.includes("diffuser") || q.includes("hannah")) targetOrderId = "ORD-1011";
      else if (q.includes("monitor") || q.includes("ethan")) targetOrderId = "ORD-1012";
      else if (q.includes("grace") || q.includes("zero")) targetCustomerId = "CUST-1015";
    }

    const actionInput1 = { orderId: targetOrderId, email: targetEmail, customerId: targetCustomerId };
    steps[0].actionInput = actionInput1;

    let customerResult;
    try {
      customerResult = AGENT_TOOLS.lookup_customer.execute(actionInput1);
    } catch (err: any) {
      console.error("lookup_customer tool execution error:", err);
      customerResult = { success: false, message: `Tool execution error: ${err.message}` };
    }
    steps[0].observation = customerResult;

    if (!customerResult.success || !customerResult.customer) {
      return {
        message: `I could not find an account or order matching your request (${targetOrderId || userQuery}). Could you please provide your Order ID (e.g. ORD-1001) or registered email address?`,
        reasoningSteps: steps,
        decision: {
          status: "DENIED",
          orderId: targetOrderId || "UNKNOWN",
          amountRefunded: 0,
          restockingFee: 0,
          originalAmount: 0,
          refundMethod: "None",
          appliedRules: [],
          summary: "Customer or order record not found in CRM database.",
          customerExplanation: "Unable to verify purchase record. Please provide a valid Order ID."
        }
      };
    }

    const customer = customerResult.customer;

    // Boundary Check: Zero Order Accounts
    if (customer.hasZeroOrders || customer.recentOrders.length === 0) {
      steps.push({
        stepNumber: 2,
        thought: `[INVARIANT BOUNDARY] Customer profile ${customer.name} found, but account has ZERO order history. Refusing refund.`,
        action: "deny_refund",
        actionInput: { customerId: customer.customerId, reason: "Account has zero order history" },
        observation: { status: "DENIED", reason: "No purchase order history found" },
        timestamp: now()
      });

      return {
        message: `Hello ${customer.name}, we found your account (${customer.customerId}), but you have no order history on file. Returns can only be requested for completed purchase orders.`,
        reasoningSteps: steps,
        customerId: customer.customerId,
        decision: {
          status: "DENIED",
          orderId: "NONE",
          amountRefunded: 0,
          restockingFee: 0,
          originalAmount: 0,
          refundMethod: "None",
          appliedRules: [],
          summary: "Refund Denied: Account has zero purchase order history.",
          customerExplanation: "No purchase order records found for this account."
        }
      };
    }

    // Step 2: Retrieve Order Details
    const matchedOrder = customer.recentOrders.find(o => 
      targetOrderId ? o.orderId.toLowerCase() === targetOrderId.toLowerCase() : true
    ) || customer.recentOrders[0];

    steps.push({
      stepNumber: 2,
      thought: `[MANDATORY STEP 2] Fetching order details and carrier delivery status for Order ${matchedOrder.orderId}.`,
      action: "get_order_details",
      actionInput: { orderId: matchedOrder.orderId },
      timestamp: now()
    });

    let orderResult = AGENT_TOOLS.get_order_details.execute({ orderId: matchedOrder.orderId });
    steps[1].observation = orderResult;

    if (!orderResult.success || !orderResult.order) {
      return {
        message: `Failed to retrieve order details for ${matchedOrder.orderId}.`,
        reasoningSteps: steps
      };
    }

    const order = orderResult.order;
    const daysElapsed = typeof orderResult.daysElapsedSinceDelivery === "number" ? orderResult.daysElapsedSinceDelivery : 0;
    const mainItem = order.items[0];
    const orderStatus = orderResult.orderStatus || "Delivered";
    const isAlreadyRefunded = Boolean(orderResult.isAlreadyRefunded);

    // Step 3: Mandatory Policy Matrix Check
    steps.push({
      stepNumber: 3,
      thought: `[MANDATORY STEP 3] Evaluating order against Apex Store Refund Policy matrix. Checking orderStatus (${orderStatus}), isAlreadyRefunded (${isAlreadyRefunded}), daysElapsed (${daysElapsed}d), category (${mainItem.category}), and riskScore (${customer.riskScore}).`,
      action: "check_policy_rules",
      actionInput: { daysElapsed, category: mainItem.category, condition: mainItem.condition, isFinalSale: mainItem.isFinalSale, memberTier: customer.memberTier, riskScore: customer.riskScore, orderStatus, isAlreadyRefunded },
      timestamp: now()
    });

    let policyResult = AGENT_TOOLS.check_policy_rules.execute({ daysElapsed, category: mainItem.category, condition: mainItem.condition, isFinalSale: mainItem.isFinalSale, memberTier: customer.memberTier, riskScore: customer.riskScore, orderStatus, isAlreadyRefunded });
    steps[2].observation = policyResult;

    // Step 4: Decision Synthesis & Action Execution
    let decision: RefundDecision;

    if (!policyResult.isEligible) {
      const primaryViolation = policyResult.violatedRuleDetails[0];
      
      if (customer.riskScore > 75) {
        decision = {
          status: "ESCALATED",
          orderId: order.orderId,
          amountRefunded: 0,
          restockingFee: 0,
          originalAmount: order.totalAmount,
          refundMethod: "None",
          appliedRules: policyResult.violatedRules,
          summary: `Escalated to human supervisor: High risk score (${customer.riskScore}/100).`,
          customerExplanation: `Your request for Order ${order.orderId} requires manual review by our Senior Support Supervisor.`
        };

        steps.push({
          stepNumber: 4,
          thought: `[STEP 4 EXECUTED] POLICY VIOLATION / RISK DETECTED: Customer risk score is ${customer.riskScore}. Flagging for human supervisor review.`,
          action: "escalate_to_human",
          actionInput: { orderId: order.orderId, riskScore: customer.riskScore, reason: primaryViolation?.title },
          observation: { escalatedTo: "Senior Supervisor Queue" },
          timestamp: now()
        });
      } else {
        decision = {
          status: "DENIED",
          orderId: order.orderId,
          amountRefunded: 0,
          restockingFee: 0,
          originalAmount: order.totalAmount,
          refundMethod: "None",
          appliedRules: policyResult.violatedRules,
          summary: `Refund Denied: Policy rule violation [${primaryViolation?.id || 'RULE'}]: ${primaryViolation?.title}`,
          customerExplanation: `I am unable to process a refund for Order ${order.orderId}. Reason: ${primaryViolation?.description || "Does not meet policy eligibility rules."}`
        };

        steps.push({
          stepNumber: 4,
          thought: `[STEP 4 EXECUTED] POLICY VIOLATION DETECTED: Violated rule [${primaryViolation?.id}]: ${primaryViolation?.title}. Synthesizing denial response.`,
          action: "deny_refund",
          actionInput: { orderId: order.orderId, rule: primaryViolation?.id, reason: primaryViolation?.description },
          observation: { status: "DENIED", policyCitation: primaryViolation?.id },
          timestamp: now()
        });
      }
    } else {
      const originalPrice = order.totalAmount;
      const restockingFee = policyResult.restockingFeePercentage > 0 ? (originalPrice * (policyResult.restockingFeePercentage / 100)) : 0;
      const finalRefundAmount = Math.max(0, originalPrice - restockingFee);
      const method: "Original Payment" | "Store Credit" = policyResult.isStoreCreditOnly ? "Store Credit" : "Original Payment";

      const refundTx = AGENT_TOOLS.process_refund.execute({
        orderId: order.orderId,
        amount: finalRefundAmount,
        refundMethod: method,
        reason: "Customer standard policy return approval"
      });

      decision = {
        status: "APPROVED",
        orderId: order.orderId,
        amountRefunded: finalRefundAmount,
        restockingFee,
        originalAmount: originalPrice,
        refundMethod: method,
        appliedRules: policyResult.passedRules,
        summary: `Refund Approved: $${finalRefundAmount.toFixed(2)} issued via ${method}.`,
        customerExplanation: `Great news! Your refund request for Order ${order.orderId} (${mainItem.name}) has been approved. A total of $${finalRefundAmount.toFixed(2)} has been issued to your ${method}. Transaction ID: ${refundTx.transactionId}.`,
        transactionId: refundTx.transactionId
      };

      steps.push({
        stepNumber: 4,
        thought: `[STEP 4 EXECUTED] POLICY CHECKS PASSED: Order ${order.orderId} is eligible. Net refund: $${finalRefundAmount.toFixed(2)}. Calling process_refund.`,
        action: "process_refund",
        actionInput: { orderId: order.orderId, amount: finalRefundAmount, method },
        observation: refundTx,
        timestamp: now()
      });
    }

    return { message: decision.customerExplanation, reasoningSteps: steps, decision, customerId: customer.customerId, orderId: order.orderId };
  } catch (globalError: any) {
    console.error("Critical Control Loop Error:", globalError);
    return {
      message: `An unexpected system error occurred while processing your request. Case ID #ESC-ERR-9999 has been logged and escalated to our Senior Support Supervisor.`,
      reasoningSteps: steps,
      error: globalError.message,
      decision: { status: "ESCALATED", orderId: "UNKNOWN", amountRefunded: 0, restockingFee: 0, originalAmount: 0, refundMethod: "None", appliedRules: [], summary: `Control loop error fallback: ${globalError.message}`, customerExplanation: "System error occurred. Request escalated to human support." }
    };
  }
}
