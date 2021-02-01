import { inject, RoutePlugin, route } from 'spryly';
import { Request, ResponseObject, ResponseToolkit } from '@hapi/hapi';
import * as Boom from '@hapi/boom';
import { ISearchEndpointRequest, SearchService } from '../services/search';

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
    public async getSearchEndpoints(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
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
    public async postSearchAppointment(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
        const searchEndpointRequest = request.payload as ISearchEndpointRequest;

        try {
            const searchResponse = await this.search.search(searchEndpointRequest.id);

            return h.response(searchResponse).code(201);
        }
        catch (error) {
            Boom.badRequest(error.message);
        }
    }
}
