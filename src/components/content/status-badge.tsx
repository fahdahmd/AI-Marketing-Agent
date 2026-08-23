import { Badge } from "@/components/ui/badge";
import type { ContentStatus } from "@prisma/client";

const STATUS_CONFIG: Record<ContentStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }> = {
  DRAFT: { label: "Draft", variant: "outline" },
  GENERATING: { label: "Generating...", variant: "secondary" },
  READY_FOR_REVIEW: { label: "Ready for review", variant: "warning" },
  APPROVED: { label: "Approved", variant: "success" },
  SCHEDULED: { label: "Scheduled", variant: "secondary" },
  PUBLISHING: { label: "Publishing...", variant: "secondary" },
  PUBLISHED: { label: "Published", variant: "success" },
  FAILED: { label: "Failed", variant: "destructive" },
  REJECTED: { label: "Rejected", variant: "destructive" },
};

export function ContentStatusBadge({ status }: { status: ContentStatus }) {
  const config = STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
