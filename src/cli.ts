import { Certificate, DomainOption, Proxy, ServiceManager } from './service-manager.js';

export class CommandLineInterface {
  constructor(private manager: ServiceManager) {}
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
