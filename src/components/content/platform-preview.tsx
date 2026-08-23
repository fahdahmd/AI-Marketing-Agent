import Image from "next/image";
import { Heart, MessageCircle, Send, ThumbsUp, Repeat2, Share2 } from "lucide-react";
import type { Platform } from "@prisma/client";

export interface PreviewContent {
  brandName: string;
  logoUrl?: string | null;
  hook?: string | null;
  caption?: string | null;
  body?: string | null;
  cta?: string | null;
  hashtags?: string[];
  imageUrl?: string | null;
}

function BrandAvatar({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  if (logoUrl) {
    return <Image src={logoUrl} alt={name} width={32} height={32} className="h-8 w-8 rounded-full object-cover" />;
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function CreativeArea({ imageUrl }: { imageUrl?: string | null }) {
  return (
    <div className="flex aspect-square w-full items-center justify-center overflow-hidden bg-muted">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="text-xs text-muted-foreground">No creative generated yet</span>
      )}
    </div>
  );
}

function InstagramPreview({ content }: { content: PreviewContent }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-background text-sm">
      <div className="flex items-center gap-2 p-3">
        <BrandAvatar name={content.brandName} logoUrl={content.logoUrl} />
        <span className="font-semibold">{content.brandName}</span>
      </div>
      <CreativeArea imageUrl={content.imageUrl} />
      <div className="flex items-center gap-3 p-3 text-muted-foreground">
        <Heart className="h-5 w-5" />
        <MessageCircle className="h-5 w-5" />
        <Send className="h-5 w-5" />
      </div>
      <div className="space-y-1 px-3 pb-3">
        {content.hook && <p className="font-medium">{content.hook}</p>}
        <p className="whitespace-pre-wrap">
          <span className="font-semibold">{content.brandName}</span> {content.caption}
        </p>
        {content.hashtags && content.hashtags.length > 0 && (
          <p className="text-primary">{content.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ")}</p>
        )}
      </div>
    </div>
  );
}

function FacebookPreview({ content }: { content: PreviewContent }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-background text-sm">
      <div className="flex items-center gap-2 p-3">
        <BrandAvatar name={content.brandName} logoUrl={content.logoUrl} />
        <span className="font-semibold">{content.brandName}</span>
      </div>
      <div className="px-3 pb-3 whitespace-pre-wrap">{content.caption}</div>
      <CreativeArea imageUrl={content.imageUrl} />
      <div className="flex items-center justify-around border-t p-2 text-muted-foreground">
        <span className="flex items-center gap-1 text-xs"><ThumbsUp className="h-4 w-4" /> Like</span>
        <span className="flex items-center gap-1 text-xs"><MessageCircle className="h-4 w-4" /> Comment</span>
        <span className="flex items-center gap-1 text-xs"><Share2 className="h-4 w-4" /> Share</span>
      </div>
    </div>
  );
}

function LinkedInPreview({ content }: { content: PreviewContent }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-background text-sm">
      <div className="flex items-center gap-2 p-3">
        <BrandAvatar name={content.brandName} logoUrl={content.logoUrl} />
        <div>
          <p className="font-semibold">{content.brandName}</p>
          <p className="text-xs text-muted-foreground">Sponsored</p>
        </div>
      </div>
      <div className="px-3 pb-3 whitespace-pre-wrap">
        {content.hook && <p className="mb-1 font-medium">{content.hook}</p>}
        {content.body}
      </div>
      <CreativeArea imageUrl={content.imageUrl} />
      <div className="flex items-center justify-around border-t p-2 text-muted-foreground">
        <span className="flex items-center gap-1 text-xs"><ThumbsUp className="h-4 w-4" /> Like</span>
        <span className="flex items-center gap-1 text-xs"><MessageCircle className="h-4 w-4" /> Comment</span>
        <span className="flex items-center gap-1 text-xs"><Repeat2 className="h-4 w-4" /> Repost</span>
      </div>
    </div>
  );
}

function XPreview({ content }: { content: PreviewContent }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-background p-3 text-sm">
      <div className="flex items-start gap-2">
        <BrandAvatar name={content.brandName} logoUrl={content.logoUrl} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{content.brandName}</p>
          {content.hook && <p className="mt-0.5 font-medium">{content.hook}</p>}
          <p className="mt-0.5 whitespace-pre-wrap">{content.caption}</p>
          {content.imageUrl && (
            <div className="mt-2 overflow-hidden rounded-lg border">
              <CreativeArea imageUrl={content.imageUrl} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function PlatformPreview({ platform, content }: { platform: Platform; content: PreviewContent }) {
  switch (platform) {
    case "INSTAGRAM":
      return <InstagramPreview content={content} />;
    case "FACEBOOK":
      return <FacebookPreview content={content} />;
    case "LINKEDIN":
      return <LinkedInPreview content={content} />;
    case "X":
      return <XPreview content={content} />;
  }
}
