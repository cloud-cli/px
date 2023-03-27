import { init } from '@cloud-cli/cli';
import { Resource, SQLiteDriver } from '@cloud-cli/store';
import { ProxyManager, DomainAndTarget, Domain } from './proxy-manager.js';
import { ProxyEntry, ProxyServer } from './proxy.js';

const px = new ProxyServer();
const manager = new ProxyManager();

export default {
  async add(options: ProxyEntry) {
    const proxy = await manager.addProxy(options);
    px.reload();
    return proxy;
  },

  async remove(options: DomainAndTarget) {
    const removed = await manager.removeProxy(options);
    px.reload();
    return removed;
  },

  list() {
    return manager.getProxyList();
  },

  get(options: Domain) {
    return manager.getProxyListForDomain(options);
  },

  reload() {
    this[init]();
  },

  domains() {
    return manager.getDomainList();
  },

  [init]() {
    Resource.use(new SQLiteDriver());
    Resource.create(ProxyEntry);
    return px.start();
  },
};
