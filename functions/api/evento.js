// API de Conversões do Meta para os eventos da página (PageView, ViewContent, AddToCart).
// O navegador manda o evento para cá com o mesmo event_id do pixel, e o Meta descarta a cópia repetida.
// O token fica só no Cloudflare: Configurações → Variáveis e segredos → META_CAPI_TOKEN (tipo Segredo).
// InitiateCheckout e Purchase NÃO passam por aqui: quem envia é a integração da Hotmart.
const PIXEL = '4240403222689302';
const API = 'https://graph.facebook.com/v24.0';
const DOMINIO = 'https://sidineiaboiko.com.br';
const PRODUTO = 'Sem Medo de Ser Mãe de Primeira Viagem';
const EVENTOS = {
  PageView: null,
  ViewContent: { content_name: PRODUTO, content_type: 'product' },
  AddToCart: { content_name: PRODUTO, content_type: 'product', currency: 'BRL', value: 197 },
};

async function sha256(texto) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto.trim().toLowerCase()));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost({ request, env, waitUntil }) {
  const token = env.META_CAPI_TOKEN;
  if (!token) return new Response(null, { status: 204 });
  if (request.headers.get('Origin') !== DOMINIO) return new Response(null, { status: 403 });

  let b;
  try { b = await request.json(); } catch { return new Response(null, { status: 400 }); }
  if (!b || !(b.event_name in EVENTOS) || typeof b.event_id !== 'string' || b.event_id.length > 80) {
    return new Response(null, { status: 400 });
  }

  const ud = {
    client_ip_address: request.headers.get('CF-Connecting-IP') || undefined,
    client_user_agent: request.headers.get('User-Agent') || undefined,
  };
  if (typeof b.fbp === 'string' && /^fb\.\d\.\d+\.\d+$/.test(b.fbp)) ud.fbp = b.fbp;
  if (typeof b.fbc === 'string' && /^fb\.\d\.\d+\.[\w-]{1,500}$/.test(b.fbc)) ud.fbc = b.fbc;
  if (typeof b.external_id === 'string' && /^[\w.-]{8,80}$/.test(b.external_id)) ud.external_id = await sha256(b.external_id);

  const url = typeof b.url === 'string' && b.url.startsWith(DOMINIO + '/') ? b.url.slice(0, 1000) : DOMINIO + '/';
  const evento = {
    event_name: b.event_name,
    event_time: Math.floor(Date.now() / 1000),
    event_id: b.event_id,
    action_source: 'website',
    event_source_url: url,
    user_data: ud,
  };
  if (EVENTOS[b.event_name]) evento.custom_data = EVENTOS[b.event_name];

  const corpo = { data: [evento], access_token: token };
  if (env.META_TEST_CODE) corpo.test_event_code = env.META_TEST_CODE;

  waitUntil(
    fetch(`${API}/${PIXEL}/events`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) })
      .then(async (r) => { if (!r.ok) console.log('CAPI erro', r.status, await r.text()); })
      .catch((e) => console.log('CAPI falhou', e.message))
  );
  return new Response(null, { status: 204 });
}
