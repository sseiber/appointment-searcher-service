import { manifest } from './manifest';
import { compose, ComposeOptions } from 'spryly';
import {
    platform as osPlatform,
    cpus as osCpus,
    freemem as osFreeMem,
    totalmem as osTotalMem
} from 'os';
import { forget } from './utils';

const composeOptions: ComposeOptions = {
    relativeTo: __dirname,
    logCompose: {
        serializers: {
            req: (req: any) => {
                return `${(req.method || '').toUpperCase()} ${req.headers?.host} ${req.url}`;
            },
            res: (res: any) => {
                return `${res.statusCode} ${res.raw?.statusMessage}`;
            },
            tags: (tags: any) => {
                return `[${tags}]`;
            },
            responseTime: (responseTime: any) => {
                return `${responseTime}ms`;
            },
            err: (error: any) => {
                return error;
            }
        },
        prettyPrint: {
            colorize: true,
            messageFormat: '{tags} {data} {req} {res} {responseTime}',
            translateTime: 'SYS:yyyy-mm-dd"T"HH:MM:sso',
            ignore: 'pid,hostname,tags,data,req,res,responseTime'
        }
    }
};

// process.on('unhandledRejection', (e: any) => {
/* eslint-disable */
//     console.log(['startup', 'error'], `Excepction on startup... ${e.message}`);
//     console.log(['startup', 'error'], e.stack);
/* eslint-enable */
// });

async function start() {
    try {
        const server = await compose(manifest(), composeOptions);

        const stopServer = async () => {
            server.log(['shutdown', 'info'], '☮︎ Stopping hapi server');
            await server.stop({ timeout: 10000 });

            server.log(['shutdown', 'info'], `⏏︎ Server stopped`);
            process.exit(0);
        };

        process.on('SIGINT', stopServer);
        process.on('SIGTERM', stopServer);

        server.log(['startup', 'info'], `🚀 Starting HAPI server instance...`);
        await server.start();

        server.log(['startup', 'info'], `✅ Appointment searcher started`);
        server.log(['startup', 'info'], `🌎 ${server.info.uri}`);
        server.log(['startup', 'info'], ` > Hapi version: ${server.version}`);
        server.log(['startup', 'info'], ` > Plugins: [${Object.keys(server.registrations).join(', ')}]`);
        server.log(['startup', 'info'], ` > Machine: ${osPlatform()}, ${osCpus().length} core, ` +
            `freemem=${(osFreeMem() / 1024 / 1024).toFixed(0)}mb, totalmem=${(osTotalMem() / 1024 / 1024).toFixed(0)}mb`);

        await (server.methods.search as any).startSearch();
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.log(`['startup', 'error'], 👹 Error starting server: ${error.message}`);
    }
}

forget(start);
