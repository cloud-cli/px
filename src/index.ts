import { init, logInfo } from '@cloud-cli/cli';
import { ProxyManager, DomainAndTarget, Domain, Proxy } from './proxy-manager.js';

type ExtraProps = { _: string[] };
const manager = new ProxyManager();
async function add(options: Proxy & ExtraProps) {
  const proxy = await manager.addProxy(options);
  await manager.reload();
  return proxy;
}

async function remove(options: DomainAndTarget) {
  const removed = await manager.removeProxy(options);
  await manager.reload();
  return removed;
}

async function update(options: Proxy & ExtraProps) {
  const output = await manager.updateProxy(options);
  await manager.reload();
  return output;
}

function list() {
  return manager.getProxyList();
}

function get(options: Domain) {
  return manager.getProxyListForDomain(options);
}

function domains() {
  return manager.getDomainList();
}

async function initServer() {
  await manager.reload();
  return manager.server;
}

async function reload() {
  logInfo('Reloading proxy server');
  return await manager.reload();
}

export default { add, remove, list, get, update, domains, reload, [init]: initServer };
