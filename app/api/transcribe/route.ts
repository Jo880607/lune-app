import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error("[Transcribe] OPENAI_API_KEY가 설정되지 않음");
      return NextResponse.json(
        { error: "API 키가 설정되지 않았습니다" },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: "음성 파일이 필요합니다" },
        { status: 400 }
      );
    }

    console.log("[Transcribe] Whisper 호출 시작:", {
      fileName: audioFile.name,
      size: audioFile.size,
      type: audioFile.type,
    });

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "ko",
    });

    console.log("[Transcribe] 변환 완료:", transcription.text.slice(0, 50));

    return NextResponse.json({ text: transcription.text });
  } catch (error) {
    console.error("[Transcribe] 에러:", error);
    return NextResponse.json(
      { error: "음성 변환 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
