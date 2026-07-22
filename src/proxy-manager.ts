import { getStorage, getConfig } from '@cloud-cli/cli';
import { ProxyEntry, ProxyServer, ProxySettings } from '@cloud-cli/proxy';
import type { DockerContainer, DomainAndTarget, DomainName, Proxy, WithOptionalProps } from './types.js';
import { exec } from '@cloud-cli/exec';

const defaultOptions = {
  httpPort: 80,
  httpsPort: 443,
  certsFolder: process.env.PX_CERTS_FOLDER || '/etc/letsencrypt/live',
};

const domainNotSpecifiedError = new Error('Domain not specified');
const targetNotSpecifiedError = new Error('Target not specified');
const moduleConfig = await getConfig('px', defaultOptions);
const { set, get, has, remove, getAll } = getStorage<Proxy>('px');
const settings = new ProxySettings({
  certificatesFolder: moduleConfig.certsFolder,
  certificateFile: 'fullchain.pem',
  keyFile: 'privkey.pem',
  httpPort: moduleConfig.httpPort,
  httpsPort: moduleConfig.httpsPort,
});

const px = new ProxyServer(settings);

const emptyProxy: Proxy = {
  domain: '',
  target: '',
  cors: false,
  preserveHost: false,
  redirect: false,
  redirectUrl: '',
  headers: '',
  authorization: '',
};

const readDomain = (options: WithOptionalProps<DomainName>) =>
  (options.domain = options.domain || options.host || options._[0]);

const numberRe = /^[0-9]+$/;
const readOption = value => {
  switch(true) {
    case value === 'true':
      return true;
    case value === 'false':
      return false;
    case numberRe.test(value):
      return Number(value);
    default:
      return value;
  }
}

function applyProperties(proxy: Proxy, options: Partial<Proxy>) {
  const properties = ['target', 'cors', 'redirect', 'redirectUrl', 'headers', 'authorization', 'preserveHost'];

  for ( const p of properties) {
    if (p in options) {
      proxy[p] = readOption(options[p]);
    }
  }
}

export class ProxyManager {
  server = px;

  async addProxy(properties: WithOptionalProps<Proxy>) {
    readDomain(properties);

    if (!properties.domain) {
      throw domainNotSpecifiedError;
    }

    if (!properties.target && !properties.redirectUrl) {
      throw targetNotSpecifiedError;
    }

    const proxy: Proxy = { ...emptyProxy, domain: properties.domain };
    applyProperties(proxy, properties);
    set(properties.domain, proxy);
    await this.reload();

    return proxy;
  }

  async updateProxy(options: WithOptionalProps<Proxy>) {
    readDomain(options);

    const domain = options.domain;
    let proxy: Proxy = get(domain);

    if (!domain) {
      throw domainNotSpecifiedError;
    }

    if (!proxy) {
      proxy = { ...emptyProxy, domain };
    }

    applyProperties(proxy, options);
    set(proxy.domain, proxy);

    await this.reload();

    return proxy;
  }

  async removeProxy(options: WithOptionalProps<DomainAndTarget>) {
    readDomain(options);
    const host = options.domain;

    if (!host) {
      throw domainNotSpecifiedError;
    }

    if (has(host)) {
      remove(host);
      await this.reload();
      return true;
    }

    return false;
  }

  async getDomainList() {
    const proxies = await this.getProxyList();
    return proxies.map((proxy) => proxy.domain);
  }

  async getProxyListWithContainers() {
    const staticRoutes = getAll();
    const containers = (await this.getRunningContainers() as any).map(readProxyFromContainer) as Proxy[];
    const containerDomains = containers.map(c => c.domain.split('/')[0]);
    const list = [
      ...staticRoutes.filter(t => !containerDomains.includes(t.domain)),
      ...containers,
    ] as Proxy[];

    return list;
  }

  async getProxyList(filters: Partial<Proxy> = {}): Promise<Proxy[]> {
    const list = await this.getProxyListWithContainers();
    const keys = Object.keys(filters) as Array<keyof Proxy>;

    if (!keys.length) {
      return list;
    }

    return keys.reduce((list, key) => {
      const filter = String(filters[key]).toLowerCase();
      return list.filter((p) => String(p[key]).toLowerCase().includes(filter));
    }, list);
  }

  async getProxyListForDomain(options: WithOptionalProps<DomainName>) {
    readDomain(options);
    const all = await this.getProxyList();
    return all.filter((p) => p.domain === options.domain);
  }

  async reload() {
    const all = await this.getProxyListWithContainers();
    px.reset();

    for (const t of all) {
      const [domain, path = ""] = t.domain.split("/");

      px.add(
        new ProxyEntry({
          domain: domain,
          path: path,
          target: t.target,
          redirectToHttps: t.redirect,
          redirectToUrl: t.redirectUrl,
          cors: t.cors,
          headers: t.headers,
          authorization: t.authorization,
          preserveHost: t.preserveHost,
        })
      );
    }

    px.start();
  }

  async getRunningContainers() {
    const ps = await exec("docker", ["ps", "-aq"]);
    const ids = ps.stdout.trim().split("\n");
    const state = await exec("docker", ["inspect", ...ids]);
    const json: any[] = JSON.parse(state.stdout);

    return json
      .map(readDockerContainer)
      .filter(d => d.ports.length && d.labels.host);
  }
}

function readProxyFromContainer(c: DockerContainer): Proxy {
  const domain = [c.labels.host, c.labels.path].join("/");
  const proxyOverrides = get(domain) || {};

  return {
    redirect: true,
    redirectUrl: "",
    cors: true,
    authorization: "",
    preserveHost: false,
    headers: "",
    ...proxyOverrides,
    domain,
    target: `http://localhost:${c.ports[0].host}`,
  } as Proxy;
}

function readDockerContainer(d): DockerContainer {
  const labels: Record<string, string> = Object.fromEntries<any>(
    Object.entries(d.Config.Labels || {})
      .filter(([key]) => key.startsWith("px:"))
      .map(([key, value]) => [key.replace("px:", ""), value])
  );

  return {
    id: d.Id,
    image: d.Image,
    state: d.State.Status,
    name: d.Name,
    labels: labels,
    ports: Object.entries(d.HostConfig.PortBindings || {}).map(([port, pb]) => ({
      container: Number(port.replace(/\D+/, "")),
      host: Number(pb[0].HostPort),
    })),
  };
}