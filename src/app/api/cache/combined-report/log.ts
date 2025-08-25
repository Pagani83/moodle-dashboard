
import { NextRequest, NextResponse } from 'next/server';

// Declaração de tipo para evitar erro TS em globalThis
declare global {
  // eslint-disable-next-line no-var
  var __combinedReportLog: string[] | undefined;
}

const getLog = () => {
  if (!globalThis.__combinedReportLog) globalThis.__combinedReportLog = [];
  return globalThis.__combinedReportLog;
};

export async function GET(req: NextRequest) {
  return NextResponse.json({ log: getLog() });
}
