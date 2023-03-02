import { ProxyManager, HttpProxy, Domain } from './proxy-manager.js';

const manager = new ProxyManager();

export default {
  add(options: HttpProxy) {
    return manager.addProxy(options);
  },

  remove(options: HttpProxy) {
    return manager.removeProxy(options);
  },

  get(options: Domain) {
    return manager.getProxyListForDomain(options);
  },

  reload() {
    return manager.reloadProxies();
  },

  domains() {
    return manager.getDomainList();
  },

  list() {
    return manager.getProxyList();
  },
};
