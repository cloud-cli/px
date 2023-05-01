# PX

Reverse proxy to map local services and external http(s) domains

## Usage

Use it with [Cloudy](https://github.com/cloud-cli/cli)

```ts
// cloudy.conf.mjs

import proxy from '@cloud-cli/px';

export default { proxy };
```

## API

**Add a proxy to a local service**

```bash
cy proxy.add --domain "foo.example.com" --target "http://localhost:1234"
```

All available options:

- `domain`: entrypoint for reverse proxy
- `target`: any target for requests, can be local or remote
- `cors`: handle CORS request on proxy level. See notes below!
- `redirect`: if request comes as http, redirect to https
- `redirectUrl`: if provided, issues a `Location` header and terminates with status 302 instead of proxying a request

**Remove a proxy**

```bash
cy proxy.remove --domain "foo.example.com"
```

**Get details of a proxy**

```bash
cy proxy.get --domain "foo.example.com"
```

**List proxies**

```bash
cy proxy.list
```

**List registered domains**

```bash
cy proxy.domains
```

**Reload all configurations**

```bash
cy proxy.reload
```

## Certificate file resolution

```bash
certificatesFolder  = '/etc/letsencrypt/live' or process.env.PX_CERTS_FOLDER
rootDomain          = 'example.com' in 'xyz.example.com'
cert                = certificatesFolder + '/' + rootDomain + '/' + certificateFile
key                 = certificatesFolder + '/' + rootDomain + '/' + keyFile
```

So xyz.example.com points to:

```bash
/etc/letsencrypt/live/example.com/fullchain.pem   for certificate
/etc/letsencrypt/live/example.com/privkey.pem     for private key
```

## Notes

CORS handling on proxy level is convenient, **but a security risk**. Beware:

- All origins are allowed, all common methods and headers, and credentials are enabled.
- In case of an `OPTIONS` request, if coming via CORS (a preflight), an empty response will be send and the request ends before calling the proxied target.

Every request has 2 additional headers:

- x-forwarded-for: the host of the original request.
If a proxy is from 'https://foo.example.com' to 'http://localhost:1234', the header will be 'foo.example.com'
- x-forwarded-proto: 'http:' or 'https:', depends on the original request
