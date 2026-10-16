// This separate origin never uses the app's authentication or progress storage.
import { createServer } from 'node:http';
const expoPort = Number(process.env.EXPO_PORT || 8082);
const previewPort = Number(process.env.PREVIEW_PORT || 8085);
const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Prochoro Design Preview</title><style>html,body,#root{height:100%;margin:0}body{overflow:hidden}#root{display:flex;flex:1}</style></head><body><div id="root"></div><script src="/scripts/design-preview.bundle?platform=web&dev=true&hot=false&lazy=false"></script></body></html>`;
createServer(async (req,res) => {
  if (req.url === '/phone' || req.url === '/small-phone' || req.url === '/capture') {
    const small = req.url === '/small-phone';
    const width = small ? 320 : 390;
    const height = small ? 568 : 844;
    res.writeHead(200, {'content-type':'text/html'});
    res.end(`<!doctype html><html><head><title>Prochoro phone layout</title><style>html,body{margin:0;background:#808080}iframe{display:block;margin:${req.url === '/capture' ? '0' : '16px auto'};border:0;width:${width}px;height:${height}px;max-width:100vw}</style></head><body><iframe title="Prochoro phone preview" src="/"></iframe></body></html>`);
    return;
  }
  if (req.url === '/') { res.writeHead(200,{'content-type':'text/html'}); res.end(html); return; }
  try {
    const target = new URL(req.url, `http://127.0.0.1:${expoPort}`);
    if (target.origin !== `http://127.0.0.1:${expoPort}`) { res.writeHead(400); res.end(); return; }
    const upstream = await fetch(target);
    res.writeHead(upstream.status,{'content-type':upstream.headers.get('content-type') ?? 'application/octet-stream'});
    res.end(Buffer.from(await upstream.arrayBuffer()));
  } catch { res.writeHead(502); res.end(`Start Expo web on port ${expoPort} first.`); }
}).listen(previewPort,'127.0.0.1',()=>console.log(`Isolated component preview: http://localhost:${previewPort}/`));
