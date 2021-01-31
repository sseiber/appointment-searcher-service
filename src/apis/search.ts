import { inject, RoutePlugin, route } from 'spryly';
import { Request, ResponseToolkit } from '@hapi/hapi';
import * as Boom from '@hapi/boom';
import { ISearchEndpoint, SearchService } from '../services/search';

export class SearchRoutes extends RoutePlugin {
    @inject('search')
    private search: SearchService;

    @route({
        method: 'GET',
        path: '/api/v1/search/endpoints',
        options: {
            tags: ['search'],
            description: 'Return list of configured appointments'
        }
    })
    // @ts-ignore (request)
    public async getSearchEndpoints(request: Request, h: ResponseToolkit) {
        try {
            const response = await this.search.getEndpoints();

            return h.response(response).code(200);
        }
        catch (error) {
            Boom.badRequest(error.message);
        }
    }

    @route({
        method: 'POST',
        path: '/api/v1/search/appointment',
        options: {
            tags: ['search'],
            description: 'Search for an open appointment'
        }
    })
    public async postSearchAppointment(request: Request, h: ResponseToolkit) {
        const searchEndpoint = request.payload as ISearchEndpoint;

        try {
            const searchResponse = await this.search.search(searchEndpoint);

            return h.response(searchResponse).code(201);
        }
        catch (error) {
            Boom.badRequest(error.message);
        }
    }
}
