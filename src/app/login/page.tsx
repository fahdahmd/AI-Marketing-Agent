import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) {
  const session = await auth();
  if (session?.user) redirect("/app/dashboard");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4">
      <Link href="/" className="mb-8 text-xl font-bold tracking-tight">
        AI Marketing Agent
      </Link>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to manage your marketing campaigns.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm callbackUrl={searchParams.callbackUrl} />
        </CardContent>
      </Card>
    </main>
  );
}
