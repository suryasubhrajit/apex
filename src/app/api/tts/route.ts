import { NextResponse } from "next/server";
import OpenAI from "openai";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { text, voice = "alloy" } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text string is required for TTS audio generation." }, { status: 400 });
    }

    const openAiKey = process.env.OPENAI_API_KEY;

    // OpenAI TTS API if key present
    if (openAiKey && openAiKey.length > 5) {
      try {
        const openai = new OpenAI({ apiKey: openAiKey });
        const mp3 = await openai.audio.speech.create({
          model: "tts-1",
          voice: voice as any,
          input: text,
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": "audio/mpeg",
            "Content-Length": buffer.length.toString(),
          },
        });
      } catch (err: any) {
        console.warn("OpenAI TTS API fallback to browser SpeechSynthesis:", err.message);
      }
    }

    // Return JSON indicating browser SpeechSynthesis fallback
    return NextResponse.json({
      fallback: "browser-speech-synthesis",
      text,
      message: "OpenAI TTS key not provided or fallback active. Browser SpeechSynthesis engine active."
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
