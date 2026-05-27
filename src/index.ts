export default {
    async fetch(req, env):Promise<Response> {
        return env.ASSETS.fetch(req);
    }
} satisfies ExportedHandler<any>