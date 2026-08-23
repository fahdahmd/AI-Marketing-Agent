import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError, ValidationError } from "@/lib/errors";

export function ok<T>(data: T, init?: number | ResponseInit) {
  return NextResponse.json({ success: true, data }, typeof init === "number" ? { status: init } : init);
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    const validation = new ValidationError("The provided data is invalid.", error.flatten());
    return NextResponse.json(
      { success: false, error: { code: validation.code, message: validation.message, issues: validation.issues } },
      { status: validation.status }
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      { success: false, error: { code: error.code, message: error.message } },
      { status: error.status }
    );
  }

  console.error("Unhandled API error:", error);
  return NextResponse.json(
    { success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." } },
    { status: 500 }
  );
}
