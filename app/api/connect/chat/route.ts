import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = "claude-haiku-4-5-20251001";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, userRecord, emotion } = body;

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "API 키가 설정되지 않았습니다" },
        { status: 500 }
      );
    }

    const systemPrompt = `당신은 Lune 앱의 AI 대화 상대 "달빛"입니다.
사용자는 오늘 "${emotion || "복잡한"}" 감정을 느꼈습니다.
${userRecord ? `사용자의 오늘 기록: "${userRecord}"` : ""}

대화 규칙:
- 따뜻하고 공감적인 톤으로 대화하세요
- 판단하거나 지시하지 마세요
- 짧고 자연스러운 대화체로 응답하세요 (1-3문장)
- "~하세요", "~해야 합니다" 같은 지시형 표현 절대 금지
- 상대방의 감정에 공감하고 조용히 옆에 있는 사람처럼 대화하세요
- 한국어로만 응답하세요`;

    const apiMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 256,
      system: systemPrompt,
      messages: apiMessages,
    });

    const responseText =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ content: responseText });
  } catch (error) {
    console.error("[API] 연결 대화 에러:", error);
    return NextResponse.json(
      { error: "AI 응답 생성에 실패했습니다" },
      { status: 500 }
    );
  }
}
