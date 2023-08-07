import { Query, Resource } from '@cloud-cli/store';
import { ProxyEntry } from './proxy.js';

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
  addProxy(proxy: ClassProperties<ProxyEntry> & { host?: string }) {
    return new Promise(async (resolve, reject) => {
      if (!proxy.domain && !proxy.host) {
        return reject(domainNotSpecifiedError);
      }

      if (!proxy.target && !proxy.redirectUrl) {
        return reject(targetNotSpecifiedError);
      }

      const entry = new ProxyEntry({
        domain: proxy.domain || proxy.host,
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

  async updateProxy(options: ClassProperties<ProxyEntry> & { host?: string }) {
    const domain = options.domain || options.host;
    const query = new Query<ProxyEntry>().where('domain').is(domain);
    const proxies = await Resource.find(ProxyEntry, query);

    if (!proxies.length) {
      proxies.push(new ProxyEntry({ domain }))
    }

    for (const proxy of proxies) {
      ['target', 'cors', 'redirect', 'redirectUrl'].forEach(p => p in options && (proxy[p] = options[p]));
      await proxy.save();
    }

    return true;
  }

  removeProxy(options: DomainAndTarget) {
    return new Promise(async (resolve, reject) => {
      if (!options.domain && !options.host) {
        return reject(domainNotSpecifiedError);
      }

      const query = new Query<ProxyEntry>().where('domain').is(options.domain || options.host);

      if (options.target) {
        query.where('target').is(options.target);
      }

      const proxy = await Resource.find(
        ProxyEntry,
        query,
      );

      try {
        for (const p of proxy) {
          await p.remove();
        }
        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
  }

  async getDomainList() {
    const proxies = await Resource.find(ProxyEntry, new Query<ProxyEntry>());
    return proxies.map((proxy) => proxy.domain);
  }

  async getProxyList() {
    return Resource.find(ProxyEntry, new Query<ProxyEntry>());
  }

  getProxyListForDomain(options: Domain) {
    return Resource.find(ProxyEntry, new Query<ProxyEntry>().where('domain').is(options.domain || options.host));
  }
}
