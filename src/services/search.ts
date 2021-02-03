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

export interface IOpenSlot {
    date: string;
    time: string;
    dose: string;
}

export interface ISearchResponse {
    status: boolean;
    id: string;
    name: string;
    description: string;
    openSlots: IOpenSlot[];
}

const moduleName = 'Search';

@service('search')
export class SearchService {
    @inject('$server')
    private server: Server;

    private config: any = {};
    private searchEndpoints: ISearchEndpoint[];

    public async init(): Promise<void> {
        this.server.log([moduleName, 'info'], 'initialize');

        this.server.method({ name: 'search.startSearch', method: this.startSearch });

        this.config = await fse.readJson(pathJoin((this.server.settings.app as any).appStorageDirectory, 'config.json'));

        this.searchEndpoints = this.config.searchEndpoints || [];
    }

    @bind
    public async startSearch(): Promise<void> {
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
        let openSlots: IOpenSlot[] = [];

        const searchEndpoint = this.searchEndpoints.find(endpoint => endpoint.id === searchEndpointId);
        if (!searchEndpoint) {
            return {
                status: false,
                id: searchEndpointId,
                name: 'Unknown',
                description: 'Unknown',
                openSlots
            };
        }

        try {
            const sqPageData = await this.sqRequest(searchEndpoint.endpoint);

            openSlots = await this.parseOpenAppointments(sqPageData);
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
            openSlots
        };
    }

    @bind
    private async searchEndpoint(searchEndpointId: string): Promise<void> {
        const searchEndpoint = this.searchEndpoints.find(endpoint => endpoint.id === searchEndpointId);
        if (!searchEndpoint) {
            return;
        }

        try {
            const searchResponse = await this.search(searchEndpointId);

            this.server.log([moduleName, 'info'], chalk.yellow(`Searching: ${searchResponse.name}`));

            if (searchResponse.openSlots.length > 0) {
                for (const openSlot of searchResponse.openSlots) {
                    const message = `\n\n#### ${searchResponse.name}\n#### ${searchResponse.openSlots.length} appointments available\n#### ${openSlot.date} ${openSlot.time} for ${openSlot.dose}\n`;
                    this.server.log([moduleName, 'info'], chalk.greenBright(message));
                }
            }
            else {
                this.server.log([moduleName, 'info'], chalk.yellow(`No appointments available\n`));
            }
        }
        catch (ex) {
            this.server.log([moduleName, 'error'], chalk.red(`Error while processing request\n`));
        }

        setTimeout(this.searchEndpoint, 1000, searchEndpointId);
    }

    private async parseOpenAppointments(sqPageData: any): Promise<IOpenSlot[]> {
        const $ = cheerio.load(Buffer.from(sqPageData, 'base64'));

        const openSlots: IOpenSlot[] = [];

        let date: string;

        // @ts-ignore
        $('table.SUGtableouter tbody tr').each((iRow, rowElement) => {
            const cells = $(rowElement).children('td.SUGtable').toArray();

            let doseRowOffset = 0;
            const doseRowIndex = 1;

            switch (cells.length) {
                case 2:
                    doseRowOffset = 0;

                    break;

                case 4:
                    date = $(cells[0]).find('span.SUGbigbold').text();
                    doseRowOffset = 2;

                    break;

                default:
                    return;
            }

            const doseRows = $(cells[doseRowIndex + doseRowOffset]).find('table tbody').children('tr').toArray();
            const time = $(cells[doseRowOffset]).find('span.SUGbigbold').text().trim();
            const firstDoseAvailable = ($($(doseRows[0]).children('td').toArray()[2]).find('span.SUGbutton').length || 0) > 0;
            const secondDoseAvailable = ($($(doseRows[1]).children('td').toArray()[2]).find('span.SUGbutton').length || 0) > 0;

            if (firstDoseAvailable) {
                openSlots.push({
                    date,
                    time,
                    dose: 'First Dose'
                });
            }

            if (secondDoseAvailable) {
                openSlots.push({
                    date,
                    time,
                    dose: 'Second Dose'
                });
            }
        });

        return openSlots;
    }

    private async sqRequest(uri: string): Promise<any> {
        const options = {
            json: true
        };

        try {
            const { res, payload } = await Wreck.get(uri, options);

            if (res.statusCode < 200 || res.statusCode > 299) {
                this.server.log([moduleName, 'error'], `Response status code = ${res.statusCode}`);

                throw new Error((payload as any)?.message || (payload as any)?.error?.message || payload || 'An error occurred');
            }

            return payload;
        }
        catch (ex) {
            this.server.log([moduleName, 'error'], `Request error: ${ex.message}`);
            throw ex;
        }
    }
}
