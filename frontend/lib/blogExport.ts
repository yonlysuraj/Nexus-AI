/**
 * Blog post export utilities
 */

export interface BlogExportData {
  filename: string;
  content: string;
  mimeType: string;
}

/**
 * Generate filename for blog post with date
 */
export function generateBlogFilename(title: string): string {
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  // Slugify title: lowercase, replace spaces with hyphens, remove special chars
  const slug = title
    .toLowerCase()
    .trim()
    .substring(0, 50)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${slug}-${dateStr}.md`;
}

/**
 * Create blog post with YAML frontmatter
 */
export function createBlogWithFrontmatter(
  blogContent: string,
  metadata: {
    title: string;
    metaDescription: string;
    keywords: string[];
    wordCount: number;
    readingTime: number;
  }
): string {
  const frontmatter = `---
title: ${metadata.title}
description: ${metadata.metaDescription}
keywords: ${metadata.keywords.join(', ')}
reading_time: ${metadata.readingTime} minutes
word_count: ${metadata.wordCount}
date: ${new Date().toISOString().split('T')[0]}
---

`;

  return frontmatter + blogContent;
}

/**
 * Export blog post as markdown file
 */
export function exportBlogPost(
  blogContent: string,
  metadata: {
    title: string;
    metaDescription: string;
    keywords: string[];
    wordCount: number;
    readingTime: number;
  }
): BlogExportData {
  const filename = generateBlogFilename(metadata.title);
  const contentWithFrontmatter = createBlogWithFrontmatter(blogContent, metadata);

  return {
    filename,
    content: contentWithFrontmatter,
    mimeType: 'text/markdown',
  };
}

/**
 * Download blog post to user's computer
 */
export function downloadBlogPost(
  blogContent: string,
  metadata: {
    title: string;
    metaDescription: string;
    keywords: string[];
    wordCount: number;
    readingTime: number;
  }
): void {
  const { filename, content, mimeType } = exportBlogPost(blogContent, metadata);

  // Create blob
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  // Create download link
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Copy blog post to clipboard
 */
export async function copyBlogPostToClipboard(blogContent: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(blogContent);
    return true;
  } catch {
    return false;
  }
}
