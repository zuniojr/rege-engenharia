export const prerender = false;
import type { APIRoute } from 'astro';
import { isRequestAuthenticated } from '../../../lib/admin/auth';
import { updatePageField, savePageData, savePost } from '../../../lib/admin/content';

export const POST: APIRoute = async ({ request }) => {
  if (!isRequestAuthenticated(request)) {
    return new Response(
      JSON.stringify({ success: false, message: 'Acesso não autorizado. Faça login primeiro.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json();
    const { type, page, fieldPath, value, data, slug, commitMessage } = body;

    if (type === 'page_field') {
      if (!page || !fieldPath) {
        return new Response(
          JSON.stringify({ success: false, message: 'Parâmetros "page" e "fieldPath" são obrigatórios.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      const result = await updatePageField(page, fieldPath, value, commitMessage);
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (type === 'page_full') {
      if (!page || !data) {
        return new Response(
          JSON.stringify({ success: false, message: 'Parâmetros "page" e "data" são obrigatórios.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      const result = await savePageData(page, data, commitMessage);
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (type === 'post') {
      if (!slug || !data) {
        return new Response(
          JSON.stringify({ success: false, message: 'Parâmetros "slug" e "data" são obrigatórios.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      const result = await savePost(slug, data, commitMessage);
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ success: false, message: 'Tipo de operação inválido ("type").' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, message: `Erro ao processar salvamento: ${err.message}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
