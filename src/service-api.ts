import { Resource, Request, Response } from '@cloud-cli/gw';
import { json } from './helpers.js';
import { Proxy, ProxyManager } from './service-manager.js';

export class ServiceApi extends Resource {
  body = { json: {} };

  constructor(private manager: ProxyManager) {
    super();
  }

  get(request: Request, response: Response): void | Promise<any> {
    if (request.url === '/services') {
      return this.listAllServices(request, response);
    }

    return this.getServiceById(request, response);
  }

  post(request: Request, response: Response): void | Promise<any> {
    const { domain, target } = request.body as Proxy;

    if (!(domain && target)) {
      response.writeHead(400);
      response.end();
      return;
    }

    this.manager.addProxy({ domain, target });

    response.writeHead(201);
    response.end(`${domain} => ${target}`);
  }

  delete(request: Request, response: Response) {
    const domain = this.getDomainFromUrl(request.url);

    this.manager.removeProxy({ domain });

    response.writeHead(200);
    response.end();
  }

  private listAllServices(_: Request, response: Response) {
    const list = this.manager.getDomainList();

    response.writeHead(200);
    response.end(json(list));
  }

  private getServiceById(request: Request, response: Response) {
    const domain = this.getDomainFromUrl(request.url);
    const proxy = this.manager.getProxyForDomain(domain);

    if (proxy) {
      response.writeHead(200);
      response.end(json(proxy));
      return;
    }

    response.writeHead(404);
    response.end();
  }

  private getDomainFromUrl(url: string) {
    return url.slice(10);
  }
}
