import { init, logInfo } from '@cloud-cli/cli';
import { ProxyManager } from './proxy-manager.js';
import { DomainAndTarget, DomainName, Proxy, WithOptionalProps } from './types.js';

const manager = new ProxyManager();

export default {
  async add(options: WithOptionalProps<Proxy>) {
    return manager.addProxy(options);
  },

  async remove(options: WithOptionalProps<DomainAndTarget>) {
    return manager.removeProxy(options);
  },

  async update(options: WithOptionalProps<Proxy>) {
    return await manager.updateProxy(options);
  },

  list(filters: Partial<Proxy>) {
    return manager.getProxyList(filters);
  },

  get(options: DomainName) {
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
