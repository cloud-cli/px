import { Documentation, Gateway } from '@cloud-cli/gw';
import { createServer, Server } from 'node:http';
import { dirname, join } from 'node:path';
import { URL } from 'node:url';
import { CertificateApi } from './certificate-api.js';
import { ProxyApi } from './proxy-api.js';
import { Certificate, DomainOption, Proxy, ProxyManager } from './proxy-manager.js';

export interface ProxyConfiguration {
  host?: string;
  port: number;
}

export class CommandLineInterface {
  private manager = new ProxyManager();

  addProxy(proxy: Proxy) {
    this.manager.addProxy(proxy);
  }

  removeProxy(options: DomainOption) {
    this.manager.removeProxy(options);
  }

  addCertificate(certificate: Certificate) {
    this.manager.addCertificate(certificate);
  }

  removeCertificate(options: DomainOption) {
    this.manager.removeCertificate(options);
  }

  listProxies() {
    this.manager.getProxyList();
  }

  listDomains() {
    return this.manager.getDomainList();
  }

  start(configuration: ProxyConfiguration): Server {
    const gw = new Gateway();
    const proxies = new ProxyApi(this.manager);
    const certificates = new CertificateApi(this.manager);
    const { port, host = '127.0.0.1' } = configuration;
    const cwd = join(dirname(new URL(import.meta.url).pathname), '..');

    gw.add('docs', new Documentation(cwd));
    gw.add(proxies.apiName, proxies);
    gw.add(certificates.apiName, certificates);

    this.manager.reloadProxies();

    console.log(`Proxy running at http://${host}:${port}`);
    return createServer((request, response) => gw.dispatch(request, response)).listen(port, host);
  }
}
