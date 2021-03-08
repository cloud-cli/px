import { Certificate, DomainOption, Proxy, ProxyManager } from './service-manager.js';

export class CommandLineInterface {
  constructor(private manager: ProxyManager) {}
  'add-proxy'(proxy: Proxy) {
    this.manager.addProxy(proxy);
  }

  'remove-proxy'(options: DomainOption) {
    this.manager.removeProxy(options);
  }

  'add-certificate'(certificate: Certificate) {
    this.manager.addCertificate(certificate);
  }

  'remove-certificate'(options: DomainOption) {
    this.manager.removeCertificate(options);
  }
}
