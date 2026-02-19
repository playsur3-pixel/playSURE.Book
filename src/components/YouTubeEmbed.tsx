function normalizeYoutubeHost(embedSrc: string) {
  // optionnel: remplace youtube.com par youtube-nocookie.com
  try {
    const u = new URL(embedSrc);
    if (u.hostname.includes("youtube.com")) u.hostname = "www.youtube-nocookie.com";
    return u.toString();
  } catch {
    return embedSrc;
  }
}

function buildEmbedSrc(embedSrc: string, opts?: { start?: number }) {
  const src = normalizeYoutubeHost(embedSrc);

  try {
    const u = new URL(src);
    // paramètres "propres"
    u.searchParams.set("rel", "0");
    u.searchParams.set("modestbranding", "1");
    u.searchParams.set("playsinline", "1");
    if (opts?.start && opts.start > 0) u.searchParams.set("start", String(opts.start));
    return u.toString();
  } catch {
    // si embedSrc n'est pas une URL valide, on renvoie tel quel
    return src;
  }
}

export function YouTubeEmbed({ embedSrc, start }: { embedSrc: string; start?: number }) {
  const src = buildEmbedSrc(embedSrc, { start });

  return (
    <div className="aspect-video overflow-hidden rounded-xl2 border border-border bg-black/40">
      <iframe
        className="h-full w-full"
        src={src}
        title="YouTube video"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}
