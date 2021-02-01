import { service, inject } from 'spryly';
import { Server } from '@hapi/hapi';
import * as cheerio from 'cheerio';
import * as Wreck from '@hapi/wreck';
import * as fse from 'fs-extra';
import * as chalk from 'chalk';
import { join as pathJoin } from 'path';
import { bind } from '../utils';

export interface ISearchEndpoint {
    id: string;
    name: string;
    description: string;
    endpoint: string;
}

export interface ISearchEndpointRequest {
    id: string;
}

export interface ISearchResponse {
    status: boolean;
    id: string;
    name: string;
    description: string;
    available: number;
}

const moduleName = 'Search'

@service('search')
export class SearchService {
    @inject('$server')
    private server: Server;

    private config: any = {};
    private alertSoundPath: string = '/data/storage/alert.mp3';
    private requestInterval: number = 20;
    private searchEndpoints: ISearchEndpoint[];

    public async init(): Promise<void> {
        this.server.log([moduleName, 'info'], 'initialize');

        this.server.method({ name: 'search.startSearch', method: this.startSearch });

        this.config = await fse.readJson(pathJoin((this.server.settings.app as any).appStorageDirectory, 'storage', 'config.json'));
        this.alertSoundPath = pathJoin((this.server.settings.app as any).appStorageDirectory, 'storage', 'alert.mp3');

        this.requestInterval = Number(this.config.requestInterval || 20);
        this.searchEndpoints = this.config.searchEndpoints || [];
    }

    @bind
    public async startSearch() {
        if (!process.env.STAND_ALONE || process.env.STAND_ALONE !== '1') {
            return;
        }

        for (const searchEndpoint of this.searchEndpoints) {
            this.server.log(['startup', 'info'], chalk.green(`Starting search for: ${searchEndpoint.name}...\n`));
            setTimeout(this.searchEndpoint, 1000, searchEndpoint);
        }
    }

    public getEndpoints(): any[] {
        return this.searchEndpoints;
    }

    public async search(searchEndpointId: string): Promise<ISearchResponse> {
        let status = true;
        let available = 0;

        const searchEndpoint = this.searchEndpoints.find(endpoint => endpoint.id === searchEndpointId);
        if (!searchEndpoint) {
            return {
                status: false,
                id: searchEndpointId,
                name: 'Unknown',
                description: 'Unknown',
                available: 0
            };
        }

        try {
            const sqPageData = await this.sqRequest(searchEndpoint.endpoint);

            const searchResult = await this.parseOpenAppointments(sqPageData);

            available = searchResult.length;
        }
        catch (ex) {
            status = false;

            this.server.log([moduleName, 'error'], `Error while parsing endpoint: ${ex.message}`);
        }

        return {
            status,
            id: searchEndpoint.id,
            name: searchEndpoint.name,
            description: searchEndpoint.description,
            available
        };
    }

    @bind
    private async searchEndpoint(searchEndpointId: string): Promise<void> {
        const startTicks = Date.now();

        const searchEndpoint = this.searchEndpoints.find(endpoint => endpoint.id === searchEndpointId);
        if (!searchEndpoint) {
            return;
        }

        try {
            const searchResponse = await this.search(searchEndpointId);

            this.server.log([moduleName, 'info'], chalk.yellow(`Searching: ${searchResponse.name}`));

            if (searchResponse.available) {
                this.server.log([moduleName, 'info'], chalk.greenBright(`\n\n#### ${searchResponse.name}\n#### ${searchResponse.available} appointments available\n`));
            }
            else {
                this.server.log([moduleName, 'info'], chalk.yellow(`No appointments available\n`));
            }
        }
        catch (ex) {
            this.server.log([moduleName, 'error'], chalk.red(`Error while processing request\n`));
        }

        const timeout = (1000 * (this.requestInterval)) - (Date.now() - startTicks)

        setTimeout(this.searchEndpoint, timeout > 0 ? timeout : 1000, searchEndpointId);
    }

    private async parseOpenAppointments(sqPageData: any): Promise<any[]> {
        const openAppointments: any[] = [];

        const $ = cheerio.load(Buffer.from(sqPageData, 'base64'));

        // // @ts-ignore (idx)
        // $('.SUGtableouter tr > td > table > tbody > tr > td > div').each((ielem: any, elem: any) => {
        //     const result = elem;

        //     return result;
        // });

        // @ts-ignore (ielem, elem)
        $('span.SUGbutton').each((ielem: any, elem: any) => {
            openAppointments.push('test');
        });

        return openAppointments;
    }

    private async sqRequest(uri: string): Promise<any> {
        const options = {
            json: true
        };

        try {
            const { res, payload } = await Wreck.get(uri, options);

            if (res.statusCode < 200 || res.statusCode > 299) {
                this.server.log([moduleName, 'error'], `Response status code = ${res.statusCode}`);

                throw ({
                    message: (payload as any)?.message || (payload as any)?.error?.message || payload || 'An error occurred',
                    statusCode: res.statusCode
                });
            }

            return payload;
        }
        catch (ex) {
            this.server.log([moduleName, 'error'], `Request error: ${ex.message}`);
            throw ex;
        }
    }
}
