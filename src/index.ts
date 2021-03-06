import { Gateway, Documentation, Resource } from '@cloud-cli/gw';
import { createServer } from 'http';
import { CertificateApi } from './certificate-api.js';
import { CommandLineInterface } from './cli.js';
import { ProxyApi } from './proxy-api.js';
import { Certificate, Proxy, ProxyManager } from './proxy-manager.js';

export { ProxyManager, Certificate, Proxy };

const manager = new ProxyManager();
const cli = new CommandLineInterface(manager);

export default cli;

export function startProxy(configuration: ProxyConfiguration) {
  const gw = new Gateway();
  const proxies = new ProxyApi(manager);
  const certificates = new CertificateApi(manager);

  gw.add(proxies.apiName, proxies);
  gw.add(certificates.apiName, certificates);
  gw.add('docs', (new Documentation(import.meta.url) as unknown) as Resource);

  manager.reloadProxies();

  const { port, host = '127.0.0.1' } = configuration;
  createServer((request, response) => gw.dispatch(request, response)).listen(port, host);

  return manager;
}

export interface ProxyConfiguration {
  host?: string;
  port: number;
}
