import { Certificate, DomainOption, Proxy, ProxyManager } from './proxy-manager.js';

export class CommandLineInterface {
  constructor(private manager: ProxyManager) {}
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
}
