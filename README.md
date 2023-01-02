## PX

Reverse proxy to map local services to http(s) subdomains

#### Usage

```ts
// cloudy.conf.mjs

import proxy from '@cloud-cli/px';

export default { proxy };

```

#### API

**Add a certificate**

```
cy proxy.addCertificate --domain="example.com" --certificate @path/to/cert --key @path/to/key
```

**Remove a certificate**

```
cy proxy.removeCertificate --domain example.com
```

**Add a proxy to a local service**

```
cy proxy.addProxy --domain "foo.example.com" --target "localhost:1234"
```

**Remove a proxy**

```
cy proxy.removeProxy --domain "foo.example.com"
```

**List proxies**

```
cy proxy.getProxyList
```

**List registered domains**

```
cy proxy.getDomainList
```

**Reload all configurations**

```
cy proxy.reload
```
