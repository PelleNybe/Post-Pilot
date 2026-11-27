export function appendUtmsToUrls(text: string): string {
  return text.replace(/(https?:\/\/[^\s]+)/g, (url) => {
    try {
      const parsedUrl = new URL(url);
      if (!parsedUrl.searchParams.has('utm_source')) {
        parsedUrl.searchParams.set('utm_source', 'postpilot');
      }
      return parsedUrl.toString();
    } catch {
      return url;
    }
  });
}
export function splitIntoThread(text: string): string[] {
  return text.split('\n\n---\n\n').filter(Boolean);
}
export function calculateReadability(text: string) {
  return { score: 85, grade: '8th Grade', color: 'text-green-500' };
}
export function calculateSentiment(text: string) {
  return { label: 'Neutral', emoji: '😐' };
}
