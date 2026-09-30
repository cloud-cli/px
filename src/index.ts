import { help, init, logInfo } from "@cloud-cli/cli";
import { ProxyManager } from "./proxy-manager.js";
import { DomainAndTarget, DomainName, Proxy, WithOptionalProps } from "./types.js";

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
    logInfo("Reloading proxy server");
    return await manager.reload();
  },

  async [init]() {
    await manager.reload();
    return manager.server;
  },

  [help](): string {
    return `Manages reverse proxy entries

Available commands:
  px.add --domain <domain> --target <url> [--cors] [--redirect] [--preserveHost] [--redirectUrl <url>] [--headers <headers>] [--authorization <value>] - Add an entry
  px.remove --domain <domain> - Remove an entry
  px.update --domain <domain> [proxy options] - Update an entry
  px.list [--domain <domain>] [--target <url>] [proxy options] - List matching entries
  px.get --domain <domain> - Get entries for a domain
  px.domains - List configured domains
  px.reload - Reload all proxy entries

Proxy options: domain, target, cors, redirect, preserveHost, redirectUrl, headers, authorization`;
  },
};
