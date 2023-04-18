import { init } from '@cloud-cli/cli';
import { Resource, SQLiteDriver } from '@cloud-cli/store';
import { ProxyManager, DomainAndTarget, Domain } from './proxy-manager.js';
import { ProxyEntry, ProxyServer } from './proxy.js';

const px = new ProxyServer();
const manager = new ProxyManager();

async function add(options: ProxyEntry) {
  const proxy = await manager.addProxy(options);
  px.reload();
  return proxy;
}

async function remove(options: DomainAndTarget) {
  const removed = await manager.removeProxy(options);
  px.reload();
  return removed;
}

async function update(options: ProxyEntry) {
  const output = await manager.updateProxy(options);
  px.reload();
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

async function reload() {
  Resource.use(new SQLiteDriver());
  await Resource.create(ProxyEntry);
  return px.start();
}

export default { add, remove, list, get, update, domains, reload, [init]: reload };
