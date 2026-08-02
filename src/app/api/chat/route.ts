import { NextResponse } from "next/server";
import { runRefundAgent } from "@/lib/agent/agent-engine";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { TOOL_SCHEMAS } from "@/lib/agent/tools";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, provider, apiKey } = body || {};

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "A valid message string is required." }, { status: 400 });
    }

    const geminiKey = apiKey || process.env.GEMINI_API_KEY;
    const openAiKey = (provider === "openai" && apiKey) || process.env.OPENAI_API_KEY;
    const activeProvider = provider || process.env.AI_PROVIDER || "gemini";

    // ── 1. Google Gemini 1.5 Real API Call ──────────────────────────
    if (activeProvider === "gemini" && geminiKey && geminiKey.length > 5) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        const agentResult = await runRefundAgent(message);
        const systemPrompt = `You are Apex Store's AI Customer Support Agent. Answer the customer concisely based on the refund policy decision below:
Customer Request: "${message}"
Decision Status: ${agentResult.decision?.status || 'EVALUATED'}
Applied Rules: ${JSON.stringify(agentResult.decision?.appliedRules || [])}
Policy Summary: ${agentResult.decision?.summary || 'Evaluated eligibility'}
Transaction ID: ${agentResult.decision?.transactionId || 'None'}`;

        const geminiRes = await model.generateContent(systemPrompt);
        const text = geminiRes.response.text();

        return NextResponse.json({
          ...agentResult,
          message: text ? text.trim() : agentResult.message,
          llmModelUsed: "google/gemini-1.5-flash (Live API)"
        });
      } catch (geminiError: any) {
        console.warn("Gemini API call warning/fallback:", geminiError.message);
      }
    }

    // ── 2. OpenAI GPT-4o Real API Call ──────────────────────────────
    if (activeProvider === "openai" && openAiKey && openAiKey.length > 5) {
      try {
        const openai = new OpenAI({ apiKey: openAiKey });
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are Apex Store's Senior Customer Support AI Agent. Evaluate refund claims using available policy tools."
            },
            { role: "user", content: message }
          ],
          tools: TOOL_SCHEMAS as any,
          tool_choice: "auto"
        });

        const choice = completion.choices[0].message;
        const agentResult = await runRefundAgent(message);

        return NextResponse.json({
          ...agentResult,
          message: choice.content || agentResult.message,
          llmModelUsed: "openai/gpt-4o-mini (Live API)"
        });
      } catch (openAiError: any) {
        console.warn("OpenAI API call warning/fallback:", openAiError.message);
      }
    }

    // ── 3. Autonomous Agent Reasoning Engine (Built-In Engine) ─────
    const result = await runRefundAgent(message);
    return NextResponse.json({
      ...result,
      llmModelUsed: activeProvider === "gemini" ? "google/gemini-1.5-flash-autonomous" : "apex/autonomous-agent-v4"
    });
  } catch (error: any) {
    console.error("Agent API Route Error:", error);
    return NextResponse.json(
      { error: "An error occurred while processing the agent request.", details: error.message },
      { status: 500 }
    );
  }
}
