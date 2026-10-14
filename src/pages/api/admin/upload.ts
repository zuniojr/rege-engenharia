export const prerender = false;
import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';
import { isRequestAuthenticated } from '../../../lib/admin/auth';
import { isLocalEnvironment, REPO_OWNER, REPO_NAME, DEFAULT_BRANCH } from '../../../lib/admin/github';

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/svg+xml'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const POST: APIRoute = async ({ request }) => {
  if (!isRequestAuthenticated(request)) {
    return new Response(
      JSON.stringify({ success: false, message: 'Acesso não autorizado.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file || typeof file === 'string') {
      return new Response(
        JSON.stringify({ success: false, message: 'Nenhum arquivo enviado.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Tipo de arquivo não permitido. Envie PNG, JPG, WebP, AVIF ou SVG.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return new Response(
        JSON.stringify({ success: false, message: 'Arquivo muito grande. Limite máximo de 5MB.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize filename
    const originalName = file.name || 'image.png';
    const extension = path.extname(originalName).toLowerCase();
    const cleanBaseName = path.basename(originalName, extension)
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .slice(0, 60); // limit length
    const timestamp = Date.now();
    const safeFileName = `${cleanBaseName}-${timestamp}${extension}`;
    const relativeFilePath = `public/images/${safeFileName}`;
    const publicUrl = `/images/${safeFileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ── Ambiente LOCAL (dev) ─────────────────────────────────────────────────
    if (isLocalEnvironment()) {
      try {
        const destination = path.resolve(process.cwd(), relativeFilePath);
        await fs.mkdir(path.dirname(destination), { recursive: true });
        await fs.writeFile(destination, buffer);
        return new Response(
          JSON.stringify({
            success: true,
            url: publicUrl,
            message: 'Imagem salva localmente com sucesso!',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (fsErr: any) {
        return new Response(
          JSON.stringify({ success: false, message: `Erro ao salvar imagem localmente: ${fsErr.message}` }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // ── Produção (Vercel) — obrigatório usar GitHub API ─────────────────────
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return new Response(
        JSON.stringify({
          success: false,
          message:
            'GITHUB_TOKEN não configurado. Para fazer upload de imagens em produção, adicione a variável de ambiente GITHUB_TOKEN nas configurações da Vercel (Settings → Environment Variables).',
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Upload via GitHub Contents API
    const githubUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${relativeFilePath}`;
    const body = {
      message: `chore(media): upload da imagem ${safeFileName} via Admin Visual`,
      content: buffer.toString('base64'),
      branch: DEFAULT_BRANCH,
      committer: {
        name: 'Regê Admin Visual',
        email: 'admin@regeengenharia.com.br',
      },
    };

    const res = await fetch(githubUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Rege-Admin-Visual',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: res.statusText }));
      return new Response(
        JSON.stringify({
          success: false,
          message: `Erro ao enviar imagem ao GitHub (${res.status}): ${errorData.message || res.statusText}`,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Trigger Vercel deploy if hook is configured
    if (process.env.VERCEL_DEPLOY_HOOK) {
      fetch(process.env.VERCEL_DEPLOY_HOOK, { method: 'POST' }).catch(() => {});
    }

    return new Response(
      JSON.stringify({
        success: true,
        url: publicUrl,
        message: 'Imagem enviada ao repositório GitHub com sucesso! O deploy iniciará em instantes.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, message: `Erro inesperado no upload: ${err.message}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
