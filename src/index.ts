import { ProxyManager, Proxy, DomainOption, Certificate } from './proxy-manager.js';

const manager = new ProxyManager();

export default {
  addProxy(options: Proxy) {
    return manager.addProxy(options);
  },

  removeProxy(options: DomainOption) {
    return manager.removeProxy(options);
  },

  addCertificate(options: Certificate) {
    return manager.addCertificate(options);
  },

  removeCertificate(options: DomainOption) {
    return manager.removeCertificate(options);
  },

  reload() {
    return manager.reloadProxies();
  },
}
