import { Resource, Request, Response } from '@cloud-cli/gw';
import { Certificate, ServiceManager } from './service-manager.js';

export class CertificateApi extends Resource {
  body = { json: {} };

  constructor(private manager: ServiceManager) {
    super();
  }

  put(request: Request, response: Response): void | Promise<any> {
    const certificate = request.body as Certificate;

    this.manager.addCertificate(certificate);

    response.writeHead(200);
    response.end();
  }

  delete(request: Request, response: Response) {
    const domain = this.getIdFromUrl(request.url);

    this.manager.removeCertificate(domain);

    response.writeHead(200);
    response.end();
  }

  private getIdFromUrl(url: string) {
    return url.slice(13);
  }
}
