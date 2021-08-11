import { Certificate, DomainOption, Proxy, ProxyManager } from './proxy-manager.js';
import { Documentation, Gateway, Resource } from '@cloud-cli/gw';
import { createServer } from 'http';
import { CertificateApi } from './certificate-api.js';
import { ProxyApi } from './proxy-api.js';

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

  list() {
    return this.manager.getDomainList();
  }

  start(configuration: ProxyConfiguration): void {
    const gw = new Gateway();
    const proxies = new ProxyApi(this.manager);
    const certificates = new CertificateApi(this.manager);
    const { port, host = '127.0.0.1' } = configuration;

    gw.add(proxies.apiName, proxies);
    gw.add(certificates.apiName, certificates);
    gw.add('docs', new Documentation(process.cwd()) as unknown as Resource);

    this.manager.reloadProxies();

    createServer((request, response) => gw.dispatch(request, response)).listen(port, host);
    console.log(`Proxy running at http://${host}:${port}`);
  }
}
