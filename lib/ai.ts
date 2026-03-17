// AI 분석 함수들 - Claude Haiku API 호출

export interface FirstRecordAnalysis {
  emotion: string;
  message: string;
}

export interface WeeklyAnalysis {
  headline: string;
  emotions: string[];
  keywords: string[];
  peakTime: string;
  comparison: string;
  comfortMessage: string;
}

// 첫 기록 즉시 분석
export async function analyzeFirstRecord(content: string): Promise<FirstRecordAnalysis> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "first",
      content,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("[AI] analyzeFirstRecord 실패:", error);
    throw new Error(error.error || "분석 실패");
  }

  return response.json();
}

// 주간 분석
export async function analyzeWeeklyRecords(records: string[]): Promise<WeeklyAnalysis> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "weekly",
      records,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("[AI] analyzeWeeklyRecords 실패:", error);
    throw new Error(error.error || "분석 실패");
  }

  return response.json();
}
