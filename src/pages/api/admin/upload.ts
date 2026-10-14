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

    // Clean filename
    const originalName = file.name || 'image.png';
    const extension = path.extname(originalName).toLowerCase();
    const cleanBaseName = path.basename(originalName, extension)
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-');
    const timestamp = Date.now();
    const safeFileName = `${cleanBaseName}-${timestamp}${extension}`;
    const relativeFilePath = `public/images/${safeFileName}`;
    const publicUrl = `/images/${safeFileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Local environment
    if (isLocalEnvironment()) {
      const destination = path.resolve(process.cwd(), relativeFilePath);
      await fs.writeFile(destination, buffer);
      return new Response(
        JSON.stringify({
          success: true,
          url: publicUrl,
          message: 'Imagem enviada e salva com sucesso!',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Production (GitHub API)
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      // Fallback
      const destination = path.resolve(process.cwd(), relativeFilePath);
      await fs.writeFile(destination, buffer);
      return new Response(
        JSON.stringify({
          success: true,
          url: publicUrl,
          message: 'Imagem salva em disco temporário (GITHUB_TOKEN não configurado).',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const githubUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${relativeFilePath}`;
    const body = {
      message: `chore(media): upload da imagem ${safeFileName} via Admin Visual`,
      content: buffer.toString('base64'),
      branch: DEFAULT_BRANCH,
    };

    const res = await fetch(githubUrl, {
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
      return new Response(
        JSON.stringify({ success: false, message: `Erro ao enviar imagem ao GitHub: ${errorData.message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        url: publicUrl,
        message: 'Imagem enviada ao repositório GitHub com sucesso!',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, message: `Erro ao processar upload: ${err.message}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
