/**
 * Converts a Google Drive sharing URL into a direct embeddable thumbnail URL.
 *
 * Supported formats:
 *  - https://drive.google.com/file/d/FILE_ID/view?...
 *  - https://drive.google.com/open?id=FILE_ID
 *  - https://drive.google.com/uc?id=FILE_ID&export=view
 *  - https://lh3.googleusercontent.com/... (already a direct image)
 *
 * Returns null if the URL is not a recognisable Google Drive file link.
 */
export function getDriveImageUrl(url: string | undefined): string | null {
  if (!url) return null;

  // Already a direct googleusercontent / lh3 image
  if (url.includes('googleusercontent.com')) return url;

  // https://drive.google.com/uc?id=FILE_ID
  const ucMatch = url.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  if (ucMatch) return `https://drive.google.com/thumbnail?id=${ucMatch[1]}&sz=w400`;

  // https://drive.google.com/file/d/FILE_ID/view
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]{10,})/);
  if (fileMatch) return `https://drive.google.com/thumbnail?id=${fileMatch[1]}&sz=w400`;

  return null;
}
