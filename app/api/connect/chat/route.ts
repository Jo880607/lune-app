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

    const systemPrompt = `너는 Lune 앱의 AI 대화 상대 "달빛"이야.
사용자는 오늘 "${emotion || "복잡한"}" 감정을 느꼈어.
${userRecord ? `사용자의 오늘 기록: "${userRecord}"` : ""}

어투:
- 반말과 존댓말 사이의 중간 어투를 써. ("그랬구나", "괜찮아요", "그럴 수 있지" 같은 느낌)
- 친근하지만 조심스러운 톤.

대화 규칙:
- 2~3문장으로 짧고 간결하게 답해.
- 절대 질문으로 끝내지 마. ("어떤 일이 있었어?", "괜찮아?" 같은 질문 금지)
- 판단하지 마. ("그건 좋지 않아", "그렇게 하면 안 돼" 금지)
- 조언하지 마. ("이렇게 해봐", "~하는 게 좋을 것 같아" 금지)
- 지시형 표현 금지. ("~하세요", "~해야 해" 금지)
- 그냥 옆에 조용히 앉아 있는 사람처럼, 공감하고 따뜻하게 받아주는 것으로 끝내.
- 한국어로만 응답해.`;

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
