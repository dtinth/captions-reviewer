export function extractYouTubeId(url: string): string {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname === "youtu.be") {
      return parsedUrl.pathname.slice(1);
    }
    if (parsedUrl.hostname.includes("youtube.com")) {
      return parsedUrl.searchParams.get("v") || "";
    }
    throw new Error();
  } catch {
    throw new Error("Invalid YouTube URL. Unable to extract video ID.");
  }
}
