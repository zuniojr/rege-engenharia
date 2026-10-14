export const prerender = false;
import type { APIRoute } from 'astro';
import {
  getAdminPassword,
  createSessionToken,
  buildAuthCookie,
  buildClearCookie,
  isRequestAuthenticated,
} from '../../../lib/admin/auth';

export const GET: APIRoute = async ({ request }) => {
  const authenticated = isRequestAuthenticated(request);
  return new Response(JSON.stringify({ authenticated }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get('content-type') || '';
    let password = '';

    if (contentType.includes('application/json')) {
      const data = await request.json();
      password = data.password || '';
    } else {
      const formData = await request.formData();
      password = (formData.get('password') as string) || '';
    }

    const expectedPassword = getAdminPassword();

    if (password !== expectedPassword) {
      return new Response(
        JSON.stringify({ success: false, message: 'Senha incorreta. Tente novamente.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = createSessionToken();
    const cookieHeader = buildAuthCookie(token);

    return new Response(
      JSON.stringify({ success: true, message: 'Autenticado com sucesso!' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': cookieHeader,
        },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, message: `Erro no servidor: ${err.message}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const DELETE: APIRoute = async () => {
  return new Response(
    JSON.stringify({ success: true, message: 'Logout efetuado com sucesso.' }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': buildClearCookie(),
      },
    }
  );
};
