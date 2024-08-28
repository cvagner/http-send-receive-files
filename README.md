# Http Send Receive files

Simply send or receive files from a remote server to your local PC via HTTP.
It is useful when you don't have an easy access to a remote server (ie a linux provided via a citrix on windows).

> [!CAUTION]
> use it with precaution, in a short period of time and don't share any sensitive files

## Quickstart

Needed tools : `node`

Default storage directory is `storage` relative to current directory and is used both for uploaded files and downloadable files.
You can override it witj `STORAGE_DIR` environment variable which could be relative or absolute.

```sh
# Get dependencies
npm ci

# Start server
npm run start
```

Open http://localhost:3000/

Or with `curl` on your remote server:
```sh
# Upload to your PC
curl \
  -F "file=@/path/to/example.txt" \
  http://mycomputername:3000/upload

# Download from your PC
curl \
  --remote-name --remote-header-name \
  "http://mycomputername:3000/download?filename=example.txt"
```

## Install and usage

Global installation:
```sh
npm install -g .
```

```sh
# With default values
hsrf

# Override values
HOSTNAME=0.0.0.0 PORT=3000 DIR=storage hsrf
```

## Tunneling

If you want to enable remote access when your server and your PC is not a the same network, use a tunneling system.

Localtunnel is embedded and you can activate it with `LT_ENABLED` environment variable :
```sh
LT_ENABLED=true hsrf
```

It logs the tunnel URL and password which is your public IP. Open the provided link in a browser on the remote system if you are able to and provide tunnel password.

Or with `curl` on your remote server (here bypassing localtunnel reminder and with a virtual `mysubdomain` subdomain):
```sh
# Upload to your PC
curl \
  -H "bypass-tunnel-reminder: yes" \
  -F "file=@/path/to/example.txt" \
  https://mysubdomain.loca.lt/upload

# Download from your PC
curl \
  -H "bypass-tunnel-reminder: yes" \
  --remote-name --remote-header-name \
  "https://mysubdomain.loca.lt/download?filename=example.txt"
```

## Improvement (TODO)

- config subdomain (`subdomain` option of localtunnel)
- config (`host` option of localtunnel) custom localtunnel server