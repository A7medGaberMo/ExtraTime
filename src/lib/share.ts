/**
 * Universal Share & Direct Inviting Utility
 * Provides Web Share API integration, fallback clipboard copy, and direct messaging deep links.
 */

export interface ShareDataOptions {
  title: string;
  text: string;
  url: string;
}

export async function shareContent(
  options: ShareDataOptions,
  onCopied?: () => void,
): Promise<'shared' | 'copied' | 'failed'> {
  if (typeof window === 'undefined') return 'failed';

  if (navigator.share) {
    try {
      await navigator.share({
        title: options.title,
        text: options.text,
        url: options.url,
      });
      return 'shared';
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return 'failed';
      }
      // Fallback to clipboard if share failed
    }
  }

  try {
    await navigator.clipboard.writeText(options.url || options.text);
    onCopied?.();
    return 'copied';
  } catch {
    return 'failed';
  }
}

export function getWhatsAppShareUrl(text: string, url: string): string {
  const full = `${text}\n${url}`.trim();
  return `https://wa.me/?text=${encodeURIComponent(full)}`;
}

export function getTelegramShareUrl(text: string, url: string): string {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}
