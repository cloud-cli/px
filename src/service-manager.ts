import { existsSync, mkdirSync, readFileSync, rmdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import redbird from 'redbird';

const certificatesFolder = join(process.cwd(), 'certs');
const configurationFile = join(process.cwd(), 'proxies.json');
const keyFileName = 'key';
const certificateFileName = 'cert';

export interface DomainOption {
  domain: string;
}

export interface Proxy {
  domain: string;
  target: string;
}

export interface Certificate {
  domain: string;
  certificate: string;
  key: string;
}

export class ServiceManager {
  private proxyConfiguration = new Map<string, Proxy>();
  private _proxy: any;

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

  constructor() {
    this.mkdir(certificatesFolder);
  }

  addProxy({ domain, target }: Proxy) {
    this.connectDomainToTarget(domain, target);
    this.proxyConfiguration.set(domain, { domain, target });
    this.saveProxies();
  }

  removeProxy(options: DomainOption) {
    const { domain } = options;
    const { target } = this.proxyConfiguration.get(domain);

    this.proxy.unregister(domain, target);
    this.proxyConfiguration.delete(domain);
    this.saveProxies();
  }

  addCertificate({ domain, certificate, key }: Certificate) {
    const basePath = join(certificatesFolder, domain);

    this.mkdir(basePath);
    this.writeFile(join(basePath, certificateFileName), certificate);
    this.writeFile(join(basePath, keyFileName), key);
  }

  removeCertificate(options: DomainOption) {
    const { domain } = options;
    const path = join(certificatesFolder, domain);

    if (!existsSync(path)) {
      rmdirSync(path, { recursive: true });
    }
  }

  getDomainList() {
    return Array.from(this.proxyConfiguration.keys() || []);
  }

  getProxyForDomain(domain: string) {
    return this.proxyConfiguration.get(domain);
  }

  reloadProxies() {
    this.closeProxy();
    this.proxyConfiguration.clear();

    if (!existsSync(configurationFile)) return;

    const json = readFileSync(configurationFile, 'utf8') || '[]';
    const entries = JSON.parse(json) as Array<[string, Proxy]>;

    entries.forEach(([key, proxy]) => {
      const { domain, target } = proxy;

      this.proxyConfiguration.set(key, proxy);
      this.connectDomainToTarget(domain, target);
    });
  }

  private connectDomainToTarget(domain: string, target: string) {
    this.proxy.register(domain, target, {
      ssl: {
        cert: join(certificatesFolder, domain, certificateFileName),
        key: join(certificatesFolder, domain, keyFileName),
      },
    });
  }

  private mkdir(path: string) {
    if (!existsSync(path)) {
      mkdirSync(path);
    }
  }

  private writeFile(path: string, content: string) {
    writeFileSync(path, content);
  }

  private saveProxies() {
    const proxies = Array.from(this.proxyConfiguration.entries());
    this.writeFile(configurationFile, JSON.stringify(proxies));
  }

  private closeProxy() {
    this.proxy.close();
    delete this._proxy;
  }
}
