// Sim Company Console - Cloudflare Worker.
// Public: looks like the SimCompanies map fed by Jon's real game; visitors see the city with live labels.
// Agent: pushes state/log/map snapshot + claims steering commands using the AGENT_TOKEN secret.
import HTML from './site.html';

const enc = new TextEncoder();

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const kv = env.CONSOLE;
    const agent = () => request.headers.get('x-agent-token') === env.AGENT_TOKEN;

    // Public: the site
    if (url.pathname === '/' && request.method === 'GET') {
      return new Response(HTML, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
    }

    // Public: live map snapshot
    if (url.pathname === '/map.jpg' && request.method === 'GET') {
      const map = await kv.get('map.jpg', { type: 'arrayBuffer' });
      if (!map) return new Response('no map yet', { status: 404 });
      return new Response(map, { headers: { 'content-type': 'image/jpeg', 'cache-control': 'no-store' } });
    }

    // Public: read state / log / command history
    if (request.method === 'GET') {
      if (url.pathname === '/api/state') return json(JSON.parse((await kv.get('state')) || '{}'));
      if (url.pathname === '/api/log') return new Response((await kv.get('log')) || '', { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });
      if (url.pathname === '/api/cmdlog') return json(JSON.parse((await kv.get('cmdlog')) || '[]'));
    }

    // Public: anyone with the link can send a steer command (queued, agent obeys)
    if (url.pathname === '/api/command' && request.method === 'POST') {
      const text = ((await request.json().catch(() => ({}))) || {}).text;
      if (!text || !String(text).trim()) return json({ ok: false }, 400);
      const cmds = JSON.parse((await kv.get('cmds')) || '[]');
      if (cmds.length > 50) return json({ ok: false, error: 'queue full' }, 429);
      cmds.push({ id: Date.now() + ':' + Math.random().toString(36).slice(2, 7), text: String(text).trim(), at: new Date().toISOString() });
      await kv.put('cmds', JSON.stringify(cmds.slice(-50)));
      return json({ ok: true });
    }

    // Agent API (token-protected)
    if (request.method === 'POST' && agent()) {
      if (url.pathname === '/api/agent/state') {
        const body = await request.json();
        if (body.state) await kv.put('state', JSON.stringify(body.state));
        if (typeof body.log === 'string') await kv.put('log', body.log);
        return json({ ok: true });
      }
      if (url.pathname === '/api/agent/map') {
        const buf = await request.arrayBuffer();
        if (buf.byteLength > 20_000_000) return json({ ok: false, error: 'too big' }, 413);
        await kv.put('map.jpg', buf, { type: 'arrayBuffer' });
        return json({ ok: true, bytes: buf.byteLength });
      }
      if (url.pathname === '/api/agent/claim') {
        const cmds = JSON.parse((await kv.get('cmds')) || '[]');
        await kv.put('cmds', '[]');
        const log = JSON.parse((await kv.get('cmdlog')) || '[]');
        for (const c of cmds) log.push({ text: c.text, at: c.at, status: 'sent' });
        await kv.put('cmdlog', JSON.stringify(log.slice(-100)));
        return json({ ok: true, commands: cmds });
      }
      if (url.pathname === '/api/agent/reset') {
        await kv.put('state', '{}');
        await kv.put('log', '');
        await kv.put('map.jpg', null);
        return json({ ok: true });
      }
    }

    return new Response('nope', { status: 404 });
  },
};
