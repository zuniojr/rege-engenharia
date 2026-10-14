export const prerender = false;
import type { APIRoute } from 'astro';
import { isRequestAuthenticated } from '../../../lib/admin/auth';
import { getPostBySlug, savePost } from '../../../lib/admin/content';

export const GET: APIRoute = async ({ request }) => {
  if (!isRequestAuthenticated(request)) {
    return new Response(JSON.stringify({ success: false, message: 'Não autorizado.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');

  if (!slug) {
    return new Response(JSON.stringify({ success: false, message: 'Slug não informado.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const post = await getPostBySlug(slug);
  if (!post) {
    return new Response(JSON.stringify({ success: false, message: 'Artigo não encontrado.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true, post }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  if (!isRequestAuthenticated(request)) {
    return new Response(JSON.stringify({ success: false, message: 'Não autorizado.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { slug, postData, commitMessage } = body;

    if (!slug || !postData) {
      return new Response(JSON.stringify({ success: false, message: 'Slug e postData são obrigatórios.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await savePost(slug, postData, commitMessage);
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, message: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
