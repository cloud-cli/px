import { getStorage, getConfig } from '@cloud-cli/cli';
import { ProxyEntry, ProxyServer, ProxySettings } from '@cloud-cli/proxy';

const defaultOptions = {
  httpPort: 80,
  httpsPort: 443,
  certsFolder: process.env.PX_CERTS_FOLDER || '/etc/letsencrypt/live',
};

const domainNotSpecifiedError = new Error('Domain not specified');
const targetNotSpecifiedError = new Error('Target not specified');
const moduleConfig = await getConfig('px', defaultOptions);
const { set, get, remove, getAll } = getStorage<Proxy>('px');

const settings = new ProxySettings({
  certificatesFolder: moduleConfig.certsFolder,
  certificateFile: 'fullchain.pem',
  keyFile: 'privkey.pem',
  httpPort: moduleConfig.httpPort,
  httpsPort: moduleConfig.httpsPort,
});

const px = new ProxyServer(settings);

interface OptionalProps {
  host?: string;
  _: string[];
}

export interface Domain extends OptionalProps {
  domain: string;
}

export interface DomainAndTarget extends Domain {
  target: string;
}

export interface Proxy {
  domain: string;
  target: string;
  redirect: boolean;
  redirectUrl: string;
  headers: string;
  authorization: string;
  cors: boolean;
}

const emptyProxy: Proxy = {
  domain: '',
  target: '',
  cors: false,
  redirect: false,
  redirectUrl: '',
  headers: '',
  authorization: '',
};

type KeysOf<T> = {
  [K in keyof T]: T[K] extends () => any ? never : K;
}[keyof T];

type ClassProperties<T> = {
  [K in KeysOf<T>]: T[K] extends never ? never : T[K];
};

export class ProxyManager {
  server = px;

  async addProxy(proxy: ClassProperties<Proxy> & OptionalProps) {
    if (!proxy.domain && !proxy.host) {
      throw domainNotSpecifiedError;
    }

    if (!proxy.target && !proxy.redirectUrl) {
      throw targetNotSpecifiedError;
    }

    const domainAndPath = proxy.domain || proxy.host || proxy._[0];
    const entry: Proxy = {
      domain: domainAndPath,
      target: proxy.target,
      cors: !!proxy.cors,
      redirect: !!proxy.redirect,
      redirectUrl: proxy.redirectUrl || '',
      headers: proxy.headers || '',
      authorization: proxy.authorization,
    };

    await set(domainAndPath, entry);
    await this.reload();

    return entry;
  }

  async updateProxy(options: ClassProperties<Proxy> & OptionalProps) {
    const host = options.domain || options.host || options._[0];
    let proxy = await get(host);

    if (!proxy) {
      proxy = { ...emptyProxy, domain: host };
    }

    const properties = ['target', 'cors', 'redirect', 'redirectUrl', 'headers', 'authorization'];
    properties.forEach((p) => p in options && (proxy[p] = options[p]));
    set(proxy.domain, proxy);

    await this.reload();

    return proxy;
  }

  removeProxy(options: DomainAndTarget) {
    return new Promise(async (resolve, reject) => {
      const host = options.domain || options.host;

      if (!host) {
        return reject(domainNotSpecifiedError);
      }

      const proxies = await this.findByDomainAndPath(host);

      try {
        for (const p of proxies) {
          await remove(p.domain);
        }

        await this.reload();

        resolve({ found: proxies.length });
      } catch (error) {
        reject(error);
      }
    });
  }

  async getDomainList() {
    const proxies = await getAll();
    return proxies.map((proxy) => proxy.domain);
  }

  async getProxyList() {
    return await getAll();
  }

  getProxyListForDomain(options: Domain) {
    return this.findByDomainAndPath(options.domain || options.host);
  }

  async reload() {
    const targets = await getAll();
    px.reset();

    targets.forEach((t) => {
      const [domain, path = ''] = t.domain.split('/');

      px.add(
        new ProxyEntry({
          domain: domain,
          path: path,
          target: t.target,
          redirectToHttps: t.redirect,
          redirectToUrl: t.redirectUrl,
          cors: t.cors,
          headers: t.headers,
          authorization: t.authorization,
        }),
      );
    });

    px.start();
  }

  private async findByDomainAndPath(string: string) {
    const [domain, path = ''] = string.split('/');
    const proxies = await getAll();

    return proxies.filter((p) => p.domain === domain);
  }
}
