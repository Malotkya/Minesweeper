import { handleAction, getAction } from "./game";
import { ErrorResponse, GameResponse } from "./util";

async function handleGet(req:Request, store:Fetcher):Promise<Response> {
    const resp = await store.fetch(req);
    if(resp.status < 400)
        return resp;
    
    return await store.fetch(new URL("/", req.url));
}

export default {
    async fetch(req, env):Promise<Response> {
        switch (req.method){
        case "GET":
            try {
                return await handleGet(req, env.ASSETS);
            } catch (e) {
                console.error(e);
                return new Response("An unknown server error occured!", {status: 500});
            }
            

        case "POST":
            try {
                const action = await getAction(req);
                if(action instanceof Response)
                    return action;

                const state = await handleAction(action, req.headers.get("Cookie"), env.KV);
                if(state instanceof Response)
                    return state;

                return new GameResponse(state);
            } catch (e) {
                console.error(e);
                return new ErrorResponse(500, "An unknown server error occured!");
            }
        }

        return new ErrorResponse(405, `Invalid method '${req.method}'!`);
    }
} satisfies ExportedHandler<ENV>