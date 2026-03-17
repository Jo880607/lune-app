import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = "claude-haiku-4-5-20251001";

// 첫 기록 분석 프롬프트
function getFirstRecordPrompt(content: string): string {
  return `다음은 사용자가 처음으로 남긴 기록입니다.

기록: "${content}"

위 기록에서 가장 강하게 느껴지는 감정 하나를 추출하고, 그 감정에 공감하는 따뜻한 한 문장을 작성해주세요.

규칙:
- emotion은 반드시 명사형 감정 단어여야 합니다 (예: 슬픔, 기쁨, 피로감, 외로움, 설렘, 불안, 평온, 그리움, 답답함, 후회, 기대감, 허무함)
- "오늘이", "당신이", "시작이" 같은 주어나 애매한 표현은 감정이 아닙니다. 절대 사용하지 마세요.
- 감정은 딱 하나만, 가장 핵심적인 것으로 골라주세요.
- message는 판단하거나 지시하지 말고, 그냥 옆에 조용히 앉아있는 사람처럼 공감만 해주세요.
- 지시형 표현("~하세요", "~해야 합니다")은 절대 사용하지 마세요.

반드시 아래 JSON 형식으로만 응답해주세요:
{"emotion": "명사형 감정 단어", "message": "공감하는 따뜻한 한 문장"}`;
}

// 주간 분석 프롬프트
function getWeeklyPrompt(records: string[]): string {
  const recordsText = records.map((r, i) => `${i + 1}. ${r}`).join("\n");

  return `다음은 사용자의 이번 주 기록들입니다.

${recordsText}

위 기록들을 분석해서 다음 정보를 추출해주세요:
- headline: 이번 주를 한 문장으로 요약 (예: "조용히 지쳐가고 있었어요")
- emotions: 자주 느낀 감정 3개 (배열)
- keywords: 자주 등장한 단어 3개 (배열)
- peakTime: 기록이 집중된 시간대 추정 (예: "밤 11시~새벽 1시")
- comparison: 기록의 특징 한 문장 (예: "지난주보다 기록이 늘었어요")
- comfortMessage: 따뜻한 위로 한 문장

판단하지 말고, 따뜻하고 감성적인 톤으로 작성해주세요.
지시형 표현("~하세요", "~해야 합니다")은 절대 사용하지 마세요.

반드시 아래 JSON 형식으로만 응답해주세요:
{"headline": "...", "emotions": ["...", "...", "..."], "keywords": ["...", "...", "..."], "peakTime": "...", "comparison": "...", "comfortMessage": "..."}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, content, records } = body;

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("[API] ANTHROPIC_API_KEY가 설정되지 않음");
      return NextResponse.json(
        { error: "API 키가 설정되지 않았습니다" },
        { status: 500 }
      );
    }

    let prompt: string;

    if (type === "first") {
      if (!content) {
        return NextResponse.json(
          { error: "content가 필요합니다" },
          { status: 400 }
        );
      }
      prompt = getFirstRecordPrompt(content);
    } else if (type === "weekly") {
      if (!records || !Array.isArray(records) || records.length === 0) {
        return NextResponse.json(
          { error: "records 배열이 필요합니다" },
          { status: 400 }
        );
      }
      prompt = getWeeklyPrompt(records);
    } else {
      return NextResponse.json(
        { error: "type은 'first' 또는 'weekly'여야 합니다" },
        { status: 400 }
      );
    }

    console.log("[API] Claude 호출 시작:", { type, model: MODEL });

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    console.log("[API] Claude 응답 수신");

    // 응답에서 텍스트 추출
    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // JSON 파싱
    try {
      // JSON 부분만 추출 (```json ... ``` 형태일 수 있음)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("[API] JSON 파싱 실패 - 응답:", responseText);
        throw new Error("JSON 형식 응답 없음");
      }

      const result = JSON.parse(jsonMatch[0]);
      console.log("[API] 분석 완료:", result);

      return NextResponse.json(result);
    } catch (parseError) {
      console.error("[API] JSON 파싱 에러:", parseError, "응답:", responseText);

      // 파싱 실패 시 기본 응답
      if (type === "first") {
        return NextResponse.json({
          emotion: "복잡함",
          message: "오늘 하루도 수고했어요.",
        });
      } else {
        return NextResponse.json({
          headline: "이번 주도 수고했어요",
          emotions: ["피로감", "일상", "잔잔함"],
          keywords: ["오늘", "하루", "생각"],
          peakTime: "저녁 시간대",
          comparison: "꾸준히 기록하고 있어요",
          comfortMessage: "차곡차곡 쌓이고 있어요.",
        });
      }
    }
  } catch (error) {
    console.error("[API] 분석 API 에러:", error);
    return NextResponse.json(
      { error: "분석 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
