"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Circle } from "lucide-react";
import { markReadAction } from "./actions";

interface NotificationRowProps {
  id: string;
  title: string;
  message: string;
  href: string | null;
  createdAt: string;
  isRead: boolean;
}

export function NotificationRow({ id, title, message, href, createdAt, isRead }: NotificationRowProps) {
  const [pending, startTransition] = useTransition();

  const content = (
    <div
      className={`flex items-start gap-3 rounded-md border p-3 transition-colors ${isRead ? "" : "bg-accent/50"}`}
      onClick={() => {
        if (!isRead) startTransition(() => markReadAction(id));
      }}
    >
      {!isRead && <Circle className="mt-1.5 h-2 w-2 shrink-0 fill-primary text-primary" />}
      <div className={isRead ? "ml-5" : ""}>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{message}</p>
        <p className="mt-1 text-xs text-muted-foreground">{createdAt}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block" style={{ opacity: pending ? 0.6 : 1 }}>
        {content}
      </Link>
    );
  }

  return <div style={{ opacity: pending ? 0.6 : 1 }}>{content}</div>;
}
