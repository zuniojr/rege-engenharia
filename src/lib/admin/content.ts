import fs from 'node:fs/promises';
import path from 'node:path';
import { persistFile, type SaveResult } from './github';

export function getNestedValue(obj: any, pathStr: string): any {
  if (!obj || !pathStr) return undefined;
  const parts = pathStr.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  return current;
}

export function setNestedValue(obj: any, pathStr: string, value: any): void {
  if (!obj || !pathStr) return;
  const parts = pathStr.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== 'object' || current[part] === null) {
      current[part] = {};
    }
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
}

/**
 * Loads page data from src/data/pages/[pageName].json
 */
export async function getPageData(pageName: string): Promise<Record<string, any>> {
  try {
    const filePath = path.resolve(process.cwd(), `src/data/pages/${pageName}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.warn(`[Content] Aviso: Não foi possível ler página ${pageName}.json, retornando objeto vazio.`);
    return {};
  }
}

/**
 * Saves page field update (e.g. page="home", fieldPath="hero.title1", value="Novo Texto")
 */
export async function updatePageField(
  pageName: string,
  fieldPath: string,
  value: any,
  commitMessage?: string
): Promise<SaveResult> {
  const pageData = await getPageData(pageName);
  setNestedValue(pageData, fieldPath, value);

  const filePath = `src/data/pages/${pageName}.json`;
  const formattedContent = JSON.stringify(pageData, null, 2) + '\n';
  const msg = commitMessage || `chore(content): atualizar ${fieldPath} em ${pageName}.json via Admin Visual`;

  return await persistFile({
    filePath,
    content: formattedContent,
    commitMessage: msg,
  });
}

/**
 * Saves entire page data object
 */
export async function savePageData(
  pageName: string,
  data: Record<string, any>,
  commitMessage?: string
): Promise<SaveResult> {
  const filePath = `src/data/pages/${pageName}.json`;
  const formattedContent = JSON.stringify(data, null, 2) + '\n';
  const msg = commitMessage || `chore(content): atualizar página ${pageName}.json via Admin Visual`;

  return await persistFile({
    filePath,
    content: formattedContent,
    commitMessage: msg,
  });
}

/**
 * Loads a single blog post by slug
 */
export async function getPostBySlug(slug: string): Promise<Record<string, any> | null> {
  try {
    const filePath = path.resolve(process.cwd(), `src/data/posts/${slug}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    return null;
  }
}

/**
 * Saves or creates a blog post
 */
export async function savePost(
  slug: string,
  postData: Record<string, any>,
  commitMessage?: string
): Promise<SaveResult> {
  const filePath = `src/data/posts/${slug}.json`;
  const formattedContent = JSON.stringify(postData, null, 2) + '\n';
  const msg = commitMessage || `chore(blog): atualizar artigo "${postData.title || slug}" via Admin Visual`;

  return await persistFile({
    filePath,
    content: formattedContent,
    commitMessage: msg,
  });
}
