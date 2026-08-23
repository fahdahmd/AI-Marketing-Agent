import { NextRequest, NextResponse } from "next/server";
import { processPaddleWebhook } from "@/server/services/paddle-webhook.service";
import { handleApiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("paddle-signature") ?? "";
    const rawBody = await req.text();

    await processPaddleWebhook(rawBody, signature);

    return NextResponse.json({ received: true });
  } catch (error) {
    return handleApiError(error);
  }
}
