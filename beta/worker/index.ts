interface Env {
  ASSETS: Fetcher;
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404 || request.method !== "GET") return response;
    return env.ASSETS.fetch(new Request(new URL("/index.html", url), request));
  },
};

export default worker;
