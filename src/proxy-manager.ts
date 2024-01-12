import { Query, Resource } from '@cloud-cli/store';
import { Proxy } from './proxy.js';

const domainNotSpecifiedError = new Error('Domain not specified');
const targetNotSpecifiedError = new Error('Target not specified');

export interface Domain {
  domain: string;
  host?: string;
}

export interface DomainAndTarget extends Domain {
  target: string;
}

type KeysOf<T> = {
  [K in keyof T]: T[K] extends () => any ? never : K;
}[keyof T];

type ClassProperties<T> = {
  [K in KeysOf<T>]: T[K] extends never ? never : T[K];
};

export class ProxyManager {
  addProxy(proxy: ClassProperties<Proxy> & { host?: string }) {
    return new Promise(async (resolve, reject) => {
      if (!proxy.domain && !proxy.host) {
        return reject(domainNotSpecifiedError);
      }

      if (!proxy.target && !proxy.redirectUrl) {
        return reject(targetNotSpecifiedError);
      }

      const [domain, path = ''] = (proxy.domain || proxy.host).split('/');

      const entry = new Proxy({
        domain: domain,
        path: path,
        target: proxy.target,
        cors: !!proxy.cors,
        redirect: !!proxy.redirect,
        redirectUrl: proxy.redirectUrl || '',
      });

      try {
        const id = await entry.save();
        entry.id = id;
        resolve(entry);
      } catch (error) {
        reject(error);
      }
    });
  }

  async updateProxy(options: ClassProperties<Proxy> & { host?: string }) {
    const host = options.domain || options.host;
    const proxies = await this.findByDomainAndPath(host);

    if (!proxies.length) {
      const [domain, path = ''] = host.split('/');
      proxies.push(new Proxy({ domain, path }));
    }

    for (const proxy of proxies) {
      ['target', 'cors', 'redirect', 'redirectUrl'].forEach((p) => p in options && (proxy[p] = options[p]));
      await proxy.save();
    }

    return true;
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
          await p.remove();
        }
        resolve({ found: proxies.length });
      } catch (error) {
        reject(error);
      }
    });
  }

  async getDomainList() {
    const proxies = await Resource.find(Proxy, new Query<Proxy>());
    const list = proxies.map((proxy) => proxy.domain);
    return [...new Set(list)];
  }

  async getProxyList() {
    return Resource.find(Proxy, new Query<Proxy>());
  }

  getProxyListForDomain(options: Domain) {
    return this.findByDomainAndPath(options.domain || options.host);
  }

  private async findByDomainAndPath(string: string) {
    const [domain, path = ''] = string.split('/');
    const query = new Query<Proxy>().where('domain').is(domain);
    
    if (path) {
      query.where('path').is(path);
    }
    
    const proxies = await Resource.find(Proxy, query);

    return proxies;
  }
}
