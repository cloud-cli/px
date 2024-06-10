import { getStorage, getConfig } from '@cloud-cli/cli';
import { ProxyEntry, ProxyServer, ProxySettings } from '@cloud-cli/proxy';
import type { DomainAndTarget, DomainName, Proxy, WithOptionalProps } from './types.js';

const defaultOptions = {
  httpPort: 80,
  httpsPort: 443,
  certsFolder: process.env.PX_CERTS_FOLDER || '/etc/letsencrypt/live',
};

const domainNotSpecifiedError = new Error('Domain not specified');
const targetNotSpecifiedError = new Error('Target not specified');
const moduleConfig = await getConfig('px', defaultOptions);
const { set, get, has, remove, getAll } = getStorage<Proxy>('px');
const settings = new ProxySettings({
  certificatesFolder: moduleConfig.certsFolder,
  certificateFile: 'fullchain.pem',
  keyFile: 'privkey.pem',
  httpPort: moduleConfig.httpPort,
  httpsPort: moduleConfig.httpsPort,
});

const px = new ProxyServer(settings);

const emptyProxy: Proxy = {
  domain: '',
  target: '',
  cors: false,
  redirect: false,
  redirectUrl: '',
  headers: '',
  authorization: '',
};

const readDomain = (options: WithOptionalProps<DomainName>) =>
  (options.domain = options.domain || options.host || options._[0]);

const numberRe = /^[0-9]+$/;
const readOption = value => {
  switch(true) {
    case value === 'true':
      return true;
    case value === 'false':
      return false;
    case numberRe.test(value):
      return Number(value);
    default:
      return value;
  }
}

function applyProperties(proxy: Proxy, options: Partial<Proxy>) {
  const properties = ['target', 'cors', 'redirect', 'redirectUrl', 'headers', 'authorization'];

  properties.forEach((p) => {
    if (p in options) {
      proxy[p] = readOption(options[p]);
    }
  });
}

export class ProxyManager {
  server = px;

  async addProxy(proxy: WithOptionalProps<Proxy>) {
    readDomain(proxy);

    if (!proxy.domain) {
      throw domainNotSpecifiedError;
    }

    if (!proxy.target && !proxy.redirectUrl) {
      throw targetNotSpecifiedError;
    }

    const entry: Proxy = { ...emptyProxy };
    applyProperties(entry, proxy);
    set(proxy.domain, entry);
    await this.reload();

    return entry;
  }

  async updateProxy(options: WithOptionalProps<Proxy>) {
    readDomain(options);

    const domain = options.domain;
    let proxy: Proxy = get(domain);

    if (!domain) {
      throw domainNotSpecifiedError;
    }

    if (!proxy) {
      proxy = { ...emptyProxy, domain };
    }

    applyProperties(proxy, options);
    set(proxy.domain, proxy);

    await this.reload();

    return proxy;
  }

  async removeProxy(options: WithOptionalProps<DomainAndTarget>) {
    readDomain(options);
    const host = options.domain;

    if (!host) {
      throw domainNotSpecifiedError;
    }

    if (has(host)) {
      remove(host);
      await this.reload();
      return true;
    }

    return false;
  }

  async getDomainList() {
    const proxies = getAll();
    return proxies.map((proxy) => proxy.domain);
  }

  async getProxyList(filters: Partial<Proxy> = {}): Promise<Proxy[]> {
    const list = getAll();
    const keys = Object.keys(filters) as Array<keyof Proxy>;

    if (!keys.length) {
      return list;
    }

    return keys.reduce((list, key) => {
      const filter = String(filters[key]).toLowerCase();
      return list.filter((p) => String(p[key]).toLowerCase().includes(filter));
    }, list);
  }

  getProxyListForDomain(options: WithOptionalProps<DomainName>) {
    readDomain(options);
    const all = getAll();
    return all.filter((p) => p.domain === options.domain);
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
}
