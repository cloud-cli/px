import { init, logInfo } from '@cloud-cli/cli';
import { ProxyManager, DomainAndTarget, Domain, Proxy } from './proxy-manager.js';

type ExtraProps = { _: string[] };
const manager = new ProxyManager();

export default {
  async add(options: Proxy & ExtraProps) {
    return manager.addProxy(options);
  },

  async remove(options: DomainAndTarget) {
    return manager.removeProxy(options);
  },

  async update(options: Proxy & ExtraProps) {
    return await manager.updateProxy(options);
  },

  list() {
    return manager.getProxyList();
  },

  get(options: Domain) {
    return manager.getProxyListForDomain(options);
  },

  domains() {
    return manager.getDomainList();
  },

  async [init]() {
    await manager.reload();
    return manager.server;
  },

  async reload() {
    logInfo('Reloading proxy server');
    return await manager.reload();
  },
};
