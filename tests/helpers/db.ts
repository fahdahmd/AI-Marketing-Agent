import { PrismaClient } from "@prisma/client";

export const testDb = new PrismaClient();

let counter = 0;
export function uniqueEmail(prefix: string) {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}@test.local`;
}
