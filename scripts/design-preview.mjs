// This separate origin never uses the app's authentication or progress storage.
import { createServer } from 'node:http';
const expoPort = Number(process.env.EXPO_PORT || 8082);
const previewPort = Number(process.env.PREVIEW_PORT || 8085);
const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Prochoro Design Preview</title><style>html,body,#root{height:100%;margin:0}body{overflow:hidden}#root{display:flex;flex:1}</style></head><body><div id="root"></div><script src="/scripts/design-preview.bundle?platform=web&dev=true&hot=false&lazy=false"></script></body></html>`;
createServer(async (req,res) => {
  if (req.url === '/') { res.writeHead(200,{'content-type':'text/html'}); res.end(html); return; }
  try {
    const target = new URL(req.url, `http://127.0.0.1:${expoPort}`);
    if (target.origin !== `http://127.0.0.1:${expoPort}`) { res.writeHead(400); res.end(); return; }
    const upstream = await fetch(target);
    res.writeHead(upstream.status,{'content-type':upstream.headers.get('content-type') ?? 'application/octet-stream'});
    res.end(Buffer.from(await upstream.arrayBuffer()));
  } catch { res.writeHead(502); res.end(`Start Expo web on port ${expoPort} first.`); }
}).listen(previewPort,'127.0.0.1',()=>console.log(`Isolated component preview: http://localhost:${previewPort}/`));
