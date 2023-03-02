import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import redbird from 'redbird';

const certificatesFolder = process.env.PX_CERTS_FOLDER || '/etc/letsencrypt/live';
const certificateFile = 'fullchain.pem';
const keyFile = 'privkey.pem';

const configurationFile = join(process.cwd(), 'data', 'px.json');

const domainNotSpecifiedError = new Error('Domain not specified');
const targetNotSpecifiedError = new Error('Target not specified');
const notFoundError = new Error('Proxy not found');

interface SslOptions {
  redirect: boolean;
  cert?: string;
  key?: string;
}

interface RedBird {
  register(domain: string, target: string, options?: { ssl: SslOptions }): void;
  unregister(domain: string, target: string): void;
  close(): void;
}

export interface Domain {
  domain: string;
}

export interface HttpProxy extends Domain {
  target: string;
}

const proxyKey = ({ domain, target }: HttpProxy) => `${domain} => ${target}`;

export class ProxyManager {
  private proxyList: HttpProxy[] = [];
  private _proxy: RedBird;

  private get proxy() {
    if (!this._proxy) {
      this._proxy = redbird({
        port: 80,
        ssl: {
          port: 443,
        },
        bunyan: false,
      });
    }

    return this._proxy;
  }

  addProxy(proxy: HttpProxy) {
    return new Promise((resolve, reject) => {
      if (!proxy.domain) {
        return reject(domainNotSpecifiedError);
      }

      if (!proxy.target) {
        return reject(targetNotSpecifiedError);
      }

      this.connectDomainToTarget(proxy);
      this.saveProxies();
      resolve(null);
    });
  }

  removeProxy(options: HttpProxy) {
    return new Promise((resolve, reject) => {
      if (!options.domain) {
        return reject(domainNotSpecifiedError);
      }

      if (!options.target) {
        return reject(targetNotSpecifiedError);
      }

      const proxy = this.proxyList.find((p) => proxyKey(p) === proxyKey(options));

      if (!proxy) {
        return reject(notFoundError);
      }

      this.disconnectDomainAndTarget(proxy);
      this.saveProxies();

      resolve(true);
    });
  }

  getDomainList() {
    return this.proxyList.map((p) => p.domain);
  }

  getProxyList() {
    return this.proxyList.map(proxyKey);
  }

  getProxyListForDomain(options: Domain) {
    return this.proxyList.filter((p) => p.domain === options.domain);
  }

  reloadProxies() {
    this.closeProxy();
    this.proxyList = [];

    this.readProxyList().forEach((proxy) => this.connectDomainToTarget(proxy));
  }

  private readProxyList() {
    if (!existsSync(configurationFile)) {
      return [];
    }

    const json = readFileSync(configurationFile, 'utf8') || '[]';
    return JSON.parse(json) as Array<HttpProxy>;
  }

  private disconnectDomainAndTarget(proxy: HttpProxy) {
    const { domain, target } = proxy;

    this.proxy.unregister(domain, target);
    this.proxyList = this.proxyList.filter((p) => proxyKey(p) !== proxyKey(proxy));
  }

  private connectDomainToTarget(proxy: HttpProxy) {
    const { domain, target } = proxy;
    const rootDomain = this.findRootDomain(domain);
    const ssl = { redirect: false };

    if (rootDomain) {
      Object.assign(ssl, {
        redirect: true,
        cert: join(certificatesFolder, rootDomain, certificateFile),
        key: join(certificatesFolder, rootDomain, keyFile),
      });
    }

    this.proxy.register(domain, target, { ssl });
    this.proxyList = this.proxyList.filter((p) => proxyKey(p) !== proxyKey(proxy)).concat(proxy);
  }

  private findRootDomain(domain: string) {
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

  private saveProxies() {
    const proxies = Array.from(this.proxyList.entries());
    writeFileSync(configurationFile, JSON.stringify(proxies));
  }

  private closeProxy() {
    this.proxy.close();
    delete this._proxy;
  }
}
