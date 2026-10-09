import { help, init, logInfo } from '@cloud-cli/cli';
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

  async reload() {
    logInfo('Reloading proxy configuration');
    return await manager.reload();
  },

  async restart() {
    logInfo('Restarting server');
    return await manager.restart();
  },

  async [init]() {
    await manager.restart();
    return manager.server;
  },

  [help](): string {
    return `Manages reverse proxy entries

Available commands:
  px.add
  px.update
    --domain <domain> <proxy options>
  px.remove
    --domain <domain>
  px.list
    [--domain <domain>] <proxy options>
  px.get
    --domain <domain>
  px.domains
  px.reload
  px.restart

Proxy options:
  --target <url> [--cors] [--redirect] [--preserveHost] [--redirectUrl <url>] [--headers <headers>] [--authorization <value>]`;
  },
};
