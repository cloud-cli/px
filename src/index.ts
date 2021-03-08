import { Gateway } from '@cloud-cli/gw';
import { createServer } from 'http';
import { CertificateApi } from './certificate-api.js';
import { CommandLineInterface } from './cli.js';
import { ServiceApi } from './service-api.js';
import { Certificate, Proxy, ServiceManager } from './service-manager.js';

export { ServiceManager, Certificate, Proxy };

const manager = new ServiceManager();
const cli = new CommandLineInterface(manager);

export default cli;

export function startProxy() {
  const gw = new Gateway();
  const services = new ServiceApi(manager);
  const certificates = new CertificateApi(manager);

  gw.add('services', services);
  gw.add('certificates', certificates);

  manager.reloadProxies();

  return createServer((request, response) => gw.dispatch(request, response)).listen(
    Number(process.env.PX_PORT),
    process.env.PX_HOST || '127.0.0.1',
  );
}
