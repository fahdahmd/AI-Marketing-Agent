import { describe, it, expect, afterEach } from "vitest";
import bcrypt from "bcryptjs";
import { testDb, uniqueEmail } from "./helpers/db";
import { registerUser } from "@/server/services/auth.service";
import { ConflictError, ValidationError } from "@/lib/errors";

describe("registerUser", () => {
  const createdEmails: string[] = [];

  afterEach(async () => {
    for (const email of createdEmails) {
      const user = await testDb.user.findUnique({ where: { email } });
      if (user) {
        await testDb.workspaceMember.deleteMany({ where: { userId: user.id } });
        const workspaces = await testDb.workspace.findMany({ where: { members: { some: { userId: user.id } } } });
        for (const w of workspaces) {
          await testDb.subscription.deleteMany({ where: { workspaceId: w.id } });
          await testDb.workspace.delete({ where: { id: w.id } });
        }
        await testDb.user.delete({ where: { id: user.id } });
      }
    }
    createdEmails.length = 0;
  });

  it("creates a user, hashed password, and an owner workspace", async () => {
    const email = uniqueEmail("register");
    createdEmails.push(email);

    const { user, workspace } = await registerUser({
      name: "New User",
      email,
      password: "correct-horse-battery",
      workspaceName: "New User's Workspace",
    });

    expect(user.email).toBe(email.toLowerCase());
    expect(user.passwordHash).not.toBe("correct-horse-battery");
    expect(await bcrypt.compare("correct-horse-battery", user.passwordHash!)).toBe(true);

    const membership = await testDb.workspaceMember.findUniqueOrThrow({
      where: { userId_workspaceId: { userId: user.id, workspaceId: workspace.id } },
    });
    expect(membership.role).toBe("OWNER");

    const subscription = await testDb.subscription.findUnique({ where: { workspaceId: workspace.id }, include: { plan: true } });
    expect(subscription?.plan.key).toBe("FREE");
  });

  it("rejects a duplicate email", async () => {
    const email = uniqueEmail("dup");
    createdEmails.push(email);

    await registerUser({ name: "First", email, password: "password123", workspaceName: "First Co" });

    await expect(
      registerUser({ name: "Second", email, password: "password456", workspaceName: "Second Co" })
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("rejects a weak password", async () => {
    const email = uniqueEmail("weak");
    await expect(
      registerUser({ name: "Weak", email, password: "short", workspaceName: "Weak Co" })
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
