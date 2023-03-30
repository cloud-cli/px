import { createServer as createHttpServer, request as httpRequest, IncomingMessage, ServerResponse } from 'http';
import { createServer as createHttpsServer, request as httpsRequest } from 'https';
import { createSecureContext } from 'tls';
import { Model, Property, Query, Resource } from '@cloud-cli/store';
import { readdir, readFile, stat } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

const certificatesFolder = process.env.PX_CERTS_FOLDER || '/etc/letsencrypt/live';
const certificateFile = 'fullchain.pem';
const keyFile = 'privkey.pem';

@Model('proxyentry')
export class ProxyEntry extends Resource {
  @Property(String) domain: string;
  @Property(String) target: string;
  @Property(Number) redirect: boolean;
  @Property(Number) cors: boolean;

  constructor(p: Partial<ProxyEntry>) {
    super(p);
  }
}

interface Certificates {
  key: string;
  cert: string;
}

export class ProxyServer {
  protected certs: Record<string, Certificates> = {};
  protected targets: Record<string, ProxyEntry> = {};
  protected servers: any = [];

  start() {
    this.reload();
    this.servers.forEach((server: any) => server.close());

    this.servers = [
      createHttpServer((req, res) => this.serveRequest(req, res)).listen(80),
      createHttpsServer(this.getSslOptions(), (req, res) => this.serveRequest(req, res)).listen(443),
    ];
  }

  reload() {
    this.loadCertificates();
    this.loadTargets();
  }

  protected async loadCertificates() {
    const certs = (this.certs = {});

    const localCerts = await readdir(certificatesFolder);
    const folders = await Promise.all(
      localCerts.map(async (dir) => {
        const status = await stat(join(certificatesFolder, dir));
        return status.isDirectory() ? dir : '';
      }),
    );

    folders.filter(Boolean).forEach(async (rootDomain) => {
      console.log(`Loading certificate for ${rootDomain}`);
      certs[rootDomain] = createSecureContext({
        cert: await readFile(join(certificatesFolder, rootDomain, certificateFile), 'utf8'),
        key: await readFile(join(certificatesFolder, rootDomain, keyFile), 'utf8'),
      });
    });
  }

  protected async loadTargets() {
    const targets = await Resource.find(ProxyEntry, new Query());
    this.targets = {};
    targets.forEach((entry) => (this.targets[entry.domain] = entry));
  }

  protected serveRequest(req: IncomingMessage, res: ServerResponse) {
    const origin = getOrigin(req);
    const proxyEntry = this.targets[origin?.hostname];

    if (!origin.hostname || !proxyEntry) {
      res.writeHead(404, 'Not found');
      res.end();
      return;
    }

    const target = proxyEntry.target;
    const url = new URL(req.url, target);

    const isCorsPreflight = req.method === 'OPTIONS' && proxyEntry.cors;
    if (isCorsPreflight) {
      res.writeHead(204, 'OK');
      res.setHeader('Access-Control-Allow-Origin', origin.hostname);
      res.end();
      return;
    }

    const proxyRequest = (url.protocol === 'https:' ? httpsRequest : httpRequest)(url, { method: req.method });
    setHeaders(req, proxyRequest);
    proxyRequest.setHeader('host', getHost(target));

    req.on('data', (chunk) => proxyRequest.write(chunk));
    req.on('end', () => proxyRequest.end());

    proxyRequest.on('error', (error) => handleError(error, res));
    proxyRequest.on('response', (proxyRes) => {
      setHeaders(proxyRes, res);
      const isCorsSimple = req.method !== 'OPTIONS' && proxyEntry.cors && req.headers.origin;
      if (isCorsSimple) {
        const corsOrigin = new URL(req.headers.origin);
        res.setHeader('Access-Control-Allow-Origin', corsOrigin.origin);
      }

      res.writeHead(proxyRes.statusCode, proxyRes.statusMessage);

      proxyRes.on('data', (chunk) => res.write(chunk));
      proxyRes.on('end', () => res.end());
    });
  }

  protected getSslOptions() {
    const server = this;
    return {
      SNICallback(domain: string, cb: Function) {
        // TODO sanitize string to avoid file navigation!
        const rootDomain = findRootDomain(domain);
        if (rootDomain in server.certs) {
          return cb(null, server.certs[rootDomain]);
        }

        throw new Error('Not found', { cause: 404 });
      },
    };
  }
}

function findRootDomain(domain: string) {
  let rootDomain: string = '';
  const parts = domain.split('/')[0].split('.');

  while (parts.length) {
    rootDomain = parts.join('.');

    if (existsSync(join(certificatesFolder, rootDomain, certificateFile))) {
      return rootDomain;
    }

    parts.shift();
  }

  return '';
}

function setHeaders(from, to) {
  const headers = Object.entries(from.headers);

  for (const header of headers) {
    to.setHeader(header[0], header[1]);
  }
}

function handleError(error, res) {
  console.log(error);

  if (error.code === 'ECONNREFUSED') {
    res.writeHead(502);
    res.end();
    return;
  }

  if (!res.headersSent) {
    res.writeHead(500);
    res.end();
  }
}

function getOrigin(req: IncomingMessage): URL {
  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
  return (host && new URL('http://' + host)) || null;
}

function getHost(string: string) {
  const url = new URL(string);
  return url.hostname + (url.port ? ':' + url.port : '');
}