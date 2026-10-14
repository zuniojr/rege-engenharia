import fs from 'node:fs/promises';
import path from 'node:path';

export const REPO_OWNER = 'zuniojr';
export const REPO_NAME = 'rege-engenharia';
export const DEFAULT_BRANCH = 'main';

export interface SaveOptions {
  filePath: string; // e.g. "src/data/pages/home.json" or "src/data/posts/meu-post.json"
  content: string;   // stringified content (JSON or text)
  commitMessage: string;
  authorName?: string;
  authorEmail?: string;
}

export interface SaveResult {
  success: boolean;
  mode: 'local' | 'github';
  message: string;
  sha?: string;
  deployTriggered?: boolean;
}

/**
 * Returns true if we should use local filesystem (dev environment without token, or running locally)
 */
export function isLocalEnvironment(): boolean {
  // If explicitly in local development with no GITHUB_TOKEN set, or running in local dev server
  return process.env.NODE_ENV !== 'production' && !process.env.FORCE_GITHUB_SYNC;
}

/**
 * Fetches file SHA from GitHub repository (needed to update an existing file via GitHub REST API)
 */
async function getGitHubFileSha(token: string, filePath: string, branch = DEFAULT_BRANCH): Promise<string | undefined> {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}?ref=${branch}`;
  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Rege-Admin-Visual',
      },
    });
    if (res.ok) {
      const data = await res.json();
      return data.sha;
    }
  } catch (err) {
    console.error(`[GitHub API] Erro ao obter SHA do arquivo ${filePath}:`, err);
  }
  return undefined;
}

/**
 * Persists a file either locally (dev) or directly to GitHub (Vercel Serverless)
 */
export async function persistFile(options: SaveOptions): Promise<SaveResult> {
  const { filePath, content, commitMessage, authorName = 'Regê Admin Visual', authorEmail = 'admin@regeengenharia.com.br' } = options;

  // 1. Local environment: use node fs
  if (isLocalEnvironment()) {
    try {
      const absolutePath = path.resolve(process.cwd(), filePath);
      await fs.mkdir(path.dirname(absolutePath), { recursive: true });
      await fs.writeFile(absolutePath, content, 'utf-8');
      return {
        success: true,
        mode: 'local',
        message: `Arquivo salvo localmente em ${filePath}`,
      };
    } catch (err: any) {
      return {
        success: false,
        mode: 'local',
        message: `Erro ao salvar localmente: ${err.message}`,
      };
    }
  }

  // 2. Production (Vercel) / GitHub persistence
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    // If on Vercel without GITHUB_TOKEN, attempt local save or warn clearly
    try {
      const absolutePath = path.resolve(process.cwd(), filePath);
      await fs.mkdir(path.dirname(absolutePath), { recursive: true });
      await fs.writeFile(absolutePath, content, 'utf-8');
      return {
        success: true,
        mode: 'local',
        message: 'Aviso: GITHUB_TOKEN não configurado. Salvo no filesystem temporário.',
      };
    } catch (err: any) {
      return {
        success: false,
        mode: 'github',
        message: 'GITHUB_TOKEN não configurado nas variáveis de ambiente da Vercel. Não foi possível persistir no GitHub.',
      };
    }
  }

  try {
    const sha = await getGitHubFileSha(token, filePath);
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`;

    const body: Record<string, any> = {
      message: commitMessage,
      content: Buffer.from(content, 'utf-8').toString('base64'),
      branch: DEFAULT_BRANCH,
      committer: {
        name: authorName,
        email: authorEmail,
      },
    };

    if (sha) {
      body.sha = sha;
    }

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Rege-Admin-Visual',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: res.statusText }));
      return {
        success: false,
        mode: 'github',
        message: `Erro ao comitar no GitHub: ${errorData.message || res.statusText}`,
      };
    }

    const data = await res.json();

    // Trigger Vercel Deploy Hook if configured
    let deployTriggered = false;
    if (process.env.VERCEL_DEPLOY_HOOK) {
      try {
        await fetch(process.env.VERCEL_DEPLOY_HOOK, { method: 'POST' });
        deployTriggered = true;
      } catch (deployErr) {
        console.warn('[Vercel Hook] Falha ao acionar Deploy Hook:', deployErr);
      }
    }

    return {
      success: true,
      mode: 'github',
      sha: data.content?.sha,
      deployTriggered,
      message: 'Alteração comitada com sucesso no GitHub! O deploy da Vercel iniciará em instantes.',
    };
  } catch (err: any) {
    return {
      success: false,
      mode: 'github',
      message: `Exceção na comunicação com GitHub: ${err.message}`,
    };
  }
}
