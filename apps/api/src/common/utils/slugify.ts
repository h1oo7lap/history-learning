/**
 * Generate a URL-friendly kebab-case slug from a Vietnamese string.
 * Removes diacritics, lowercases, replaces spaces/special chars with hyphens.
 */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove combining diacritical marks
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate a unique slug by appending a suffix if the base slug is taken.
 * @param base - The base slug.
 * @param exists - A function that checks if a slug already exists.
 */
export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  let slug = slugify(base);
  let counter = 1;
  while (await exists(slug)) {
    slug = `${slugify(base)}-${counter++}`;
  }
  return slug;
}
