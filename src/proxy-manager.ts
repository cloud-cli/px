import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import redbird from "redbird";

const certificatesFolder = join(process.cwd(), "certs");
const configurationFile = join(process.cwd(), "data", "px.json");
const keyExtension = ".key";
const certificateExtension = ".cert";

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

export class ProxyManager {
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
    if (!existsSync(certificatesFolder)) {
      mkdirSync(certificatesFolder, { recursive: true });
    }
  }

  addProxy({ domain, target }: Proxy) {
    this.connectDomainToTarget(domain, target);
    this.proxyConfiguration.set(domain, { domain, target });
    this.saveProxies();
  }

  removeProxy(options: DomainOption) {
    const { domain } = options;

    if (!this.proxyConfiguration.has(domain)) {
      return;
    }

    const { target } = this.proxyConfiguration.get(domain);

    this.proxy.unregister(domain, target);
    this.proxyConfiguration.delete(domain);
    this.saveProxies();
  }

  addCertificate({ domain, certificate, key }: Certificate) {
    const basePath = join(certificatesFolder, domain);

    this.writeFile(basePath + certificateExtension, certificate);
    this.writeFile(basePath + keyExtension, key);
  }

  removeCertificate(options: DomainOption) {
    const basePath = join(certificatesFolder, options.domain);

    rmSync(basePath + certificateExtension, { force: true });
    rmSync(basePath + keyExtension, { force: true });
  }

  getDomainList() {
    return Array.from(this.proxyConfiguration.keys() || []);
  }

  getProxyForDomain(options: DomainOption) {
    return this.proxyConfiguration.get(options.domain);
  }

  reloadProxies() {
    this.closeProxy();
    this.proxyConfiguration.clear();

    const proxyList = this.getProxyList();

    proxyList.forEach(([key, proxy]) => {
      const { domain, target } = proxy;

      this.proxyConfiguration.set(key, proxy);
      this.connectDomainToTarget(domain, target);
    });
  }

  getProxyList() {
    if (!existsSync(configurationFile)) return [];

    const json = readFileSync(configurationFile, "utf8") || "[]";
    const entries = JSON.parse(json) as Array<[string, Proxy]>;

    return entries;
  }

  private connectDomainToTarget(domain: string, target: string) {
    const parts = domain.split(".");
    let rootDomain: string = "";

    while (parts.length) {
      rootDomain = parts.join(".");

      if (existsSync(join(certificatesFolder, rootDomain) + keyExtension))
        break;

      parts.shift();
    }

    if (!rootDomain) {
      throw new Error("Certificate not found for " + domain);
    }

    this.proxy.register(domain, target, {
      ssl: {
        cert: join(certificatesFolder, rootDomain) + certificateExtension,
        key: join(certificatesFolder, rootDomain) + keyExtension,
      },
    });
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
