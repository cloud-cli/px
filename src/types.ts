
interface OptionalProps {
  host?: string;
  _: string[];
}

export interface DomainName extends OptionalProps {
  domain: string;
}

export interface DomainAndTarget extends DomainName {
  target: string;
}

export interface Proxy {
  domain: string;
  target: string;
  redirect: boolean;
  preserveHost: boolean;
  redirectUrl: string;
  headers: string;
  authorization: string;
  cors: boolean;
}

export type WithOptionalProps<T extends object> = T & OptionalProps;