import { ComposeManifest } from 'spryly';
import { pjson } from './utils';

const pkg = pjson();

const DefaultPort = 8084;
const PORT = process.env.PORT || process.env.port || process.env.PORT0 || process.env.port0 || DefaultPort;

// @ts-ignore
export function manifest(config?: any): ComposeManifest {
    return {
        server: {
            port: PORT,
            app: {
                version: pkg.version,
                appStorageDirectory: process.env.APP_STORAGE || '/data'
            }
        },
        services: [
            './services'
        ],
        plugins: [
            ...[
                {
                    plugin: '@hapi/inert'
                }
            ],
            // ...[
            //     {
            //         plugin: './plugins'
            //     }
            // ],
            ...[
                {
                    plugin: './apis'
                }
            ]
        ]
    };
}
