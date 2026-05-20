interface YouTubePlayerProps {
  url: string;
  title?: string;
}

export function isYouTubeUrl(s?: string | null): boolean {
  if (!s) return false;
  return /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(s);
}

export function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/i);
  return m ? m[1] : null;
}

export function YouTubePlayer({ url, title }: YouTubePlayerProps) {
  const id = getYouTubeId(url) ?? "";
  const src = `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1&iv_load_policy=3`;
  return (
    <iframe
      src={src}
      title={title ?? "Lección"}
      className="absolute inset-0 h-full w-full"
      allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}
