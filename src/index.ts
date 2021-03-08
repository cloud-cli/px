import { Gateway } from '@cloud-cli/gw';
import { createServer } from 'http';
import { CertificateApi } from './certificate-api.js';
import { CommandLineInterface } from './cli.js';
import { ServiceApi } from './service-api.js';
import { Certificate, Proxy, ProxyManager } from './service-manager.js';

export { ProxyManager, Certificate, Proxy };

const manager = new ProxyManager();
const cli = new CommandLineInterface(manager);

export default cli;

export function startProxy(configuration: ProxyConfiguration) {
  const gw = new Gateway();
  const services = new ServiceApi(manager);
  const certificates = new CertificateApi(manager);

  gw.add('services', services);
  gw.add('certificates', certificates);

  manager.reloadProxies();

  createServer((request, response) => gw.dispatch(request, response)).listen(
    configuration.port,
    configuration.host || '127.0.0.1',
  );

  return manager;
}

export interface ProxyConfiguration {
  host?: string;
  port: number;
}
