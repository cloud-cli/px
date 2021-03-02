import { Gateway } from '@cloud-cli/gw';
import { createServer } from 'http';
import { CertificateApi } from './certificate-api.js';
import { ServiceApi } from './service-api.js';
import { Certificate, Proxy, ServiceManager } from './service-manager.js';

export { ServiceManager, Certificate, Proxy };

export default function (host?: string, port?: number): ServiceManager {
  const gw = new Gateway();
  const manager = new ServiceManager();
  const services = new ServiceApi(manager);
  const certificates = new CertificateApi(manager);

  gw.add('services', services);
  gw.add('certificates', certificates);

  createServer((request, response) => gw.dispatch(request, response)).listen(
    port || Number(process.env.PORT),
    host || process.env.HOST,
  );

  return manager;
}
