import { defineCloudflareConfig } from '@opennextjs/cloudflare';

const config: any = defineCloudflareConfig({});

// Externalize native Node C++ addons that cannot run inside Cloudflare Workers V8 isolates
config.edgeExternals = [
  ...(config.edgeExternals || []),
  'sharp',
  '@img/sharp-win32-x64',
  '@img/sharp-linux-x64',
];

export default config;
