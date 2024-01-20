import { Model, Primary, Property, Query, Resource } from '@cloud-cli/store';


@Model('proxyentry')
export class Proxy extends Resource {
  @Primary() @Property(Number) id: number;
  @Property(String) domain: string;
  @Property(String) path: string;
  @Property(String) target: string;
  @Property(Number) redirect: boolean;
  @Property(String) redirectUrl: string;
  @Property(String) headers: string;
  @Property(Number) cors: boolean;

  constructor(p: Partial<Proxy>) {
    super(p);
  }
}

export async function loadTargets(): Promise<Proxy[]> {
  return await Resource.find(Proxy, new Query());
}

