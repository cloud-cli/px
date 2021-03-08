## PX

Reverse proxy

#### Usage

```ts
import { startProxy } from '@cloud-cli/px';

const px = startProxy({
  port: 4567,
});

px.removeProxy({ domain: 'example.com' });
px.addProxy({ domain: 'example.com', target: 'localhost:1234' });

px.removeCertificate({ domain: 'example.com' });
px.addCertificate({ domain: 'example.com', certificate: '...', key: '...' });

console.log(px.getDomainList());
console.log(px.getProxyForDomain('example.com'));
```

**startProxy() options**

| Property | Type   | Default     |
| -------- | ------ | ----------- |
| `host`   | String | '127.0.0.1' |
| `port`   | Number |             |

#### HTTP API

**Add a certificate**

```
PUT /certificates

{
  "domain": "example.com",
  "certificate": "...",
  "key": "...",
}

```

**Add a certificate**

```
DELETE /certificates/example.com
```

**Add a service**

```
POST /services
{
  "domain": "example.com",
  "target": "localhost:1234"
}
```

**Remove a service**

```
DELETE /services/example.com
```
