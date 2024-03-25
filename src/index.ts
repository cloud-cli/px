import { init } from '@cloud-cli/cli';
import { Resource, SQLiteDriver } from '@cloud-cli/store';
import { ProxyManager, DomainAndTarget, Domain } from './proxy-manager.js';
import { loadTargets, Proxy } from './proxy.js';
import { ProxyServer, ProxySettings, ProxyEntry } from '@cloud-cli/proxy';

const settings = new ProxySettings({
  certificatesFolder: process.env.PX_CERTS_FOLDER || '/etc/letsencrypt/live',
  certificateFile: 'fullchain.pem',
  keyFile: 'privkey.pem',
});

const px = new ProxyServer(settings);
const manager = new ProxyManager();

async function reload() {
  const targets = await loadTargets();
  px.reset();

  targets.forEach((t) => {
    px.add(
      new ProxyEntry({
        domain: t.domain,
        target: t.target,
        path: t.path,
        redirectToHttps: t.redirect,
        redirectToUrl: t.redirectUrl,
        cors: t.cors,
        headers: t.headers,
        authorization: t.authorization,
      }),
    );
  });

  px.start();
}

async function add(options: Proxy) {
  const proxy = await manager.addProxy(options);
  await reload();
  return proxy;
}

async function remove(options: DomainAndTarget) {
  const removed = await manager.removeProxy(options);
  await reload();
  return removed;
}

async function update(options: Proxy) {
  const output = await manager.updateProxy(options);
  await reload();
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
  Resource.use(new SQLiteDriver());
  await Resource.create(Proxy);
  await reload();

  return px;
}

export default { add, remove, list, get, update, domains, reload, [init]: initServer };
