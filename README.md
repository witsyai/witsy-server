# llm-server

LLM Server is a nodejs server that exposes a number of endpoints to access LLM models from various providers in a consistent way.

It is based on [multi-llm-ts](https://github.com/nbonamy/multi-llm-ts) and therefore supports all the providers and models that the library support.

## Setup

LLM Server needs API keys to access the different LLM providers. There are two ways to do this:
- Define the keys on the server, available to everyone who accesses the server
- Let each user specify their own API keys

### Server configuration

You need to provide API keys for every provider you want to support. To do so, copy the `.env.sample` file as `.env` and enter your API keys. Delete the lines you do not have API keys for.

It is also recommended to define a custom value for `AUTHORIZED_CLIENT_ID` to that your server cannot be accessed by anyone.

If you want to enable Ollama (locally), just add `OLLAMA_ENABLED=true` to the `.env` file.

### Per-user configuration

You can skip the whole process above and let the user provides its own API keys. In that case, callers should provide their API keys in the HTTP POST request body in the `{providerKey}` e.g. `openaiKey`, `anthropicKey`... For the `llm/engines` endpoint, the client should provide all its API keys. For the other calls, only the API key for the provider requested is needed.

## Execution

`npm install` followed by `npm run dev` should be enough to start the server. You can try to access your server with the following `curl` command (make sure to replace `your-client-id` if needed):

```sh
curl -X POST -H 'X-ClientId: your-client-id' http://localhost:3000/llm/engines
```

If you use per-user configuration, the same call would be:

```sh
curl -X POST -H 'Content-Type: application/json' -d '{"openaiKey":"your-openai-api-key"}' http://localhost:3000/llm/engines
```

## Endpoints

To access any endpoint you need to add a specific HTTP header to your request: `X-ClientId` equal to the value you have defined for `AUTHORIZED_CLIENT_ID`.

### `GET llm/engines`

Will return a list of engines for which an API key has been defined. Each engine is defined by an `id` to use in other API calls and a descriptive `name`.

### `GET llm/models/:engine`

Will return a list of models provided by engine. Each model is defined by an `id` to use in other API calls and a descriptive `name`. You also get a `meta` attribute which is the original description returned by the provider.

Example: `GET llm/models/openai`

### `POST llm/chat`

Used to chat in streaming mode with a model. A JSON payload is expected with the following information:

```typescript
{
  engine: string,         // provider/engine id (e.g. openai)
  model: string,          // model id (e.g. gpt-4o)
  messages?: Message[],   // conversation history
  prompt: string,         // user prompt
  attachment?: {          // attachment
    mimeType: string,     
    contents: string      // base64 encoded for binary data
  }
}
```

Each `Message` should be:

```typescript
{
  role: string,           // 'user' or 'assistant'
  content: string         // text of message
}
```

## Reverse-proxy

If you want to expose `llm-server` behind a proxy such as `nginx`, make sure that chunked response is supported and buffering disabled.

A `nginx` configuration could look like:

```nginx
location @llm {
  include fastcgi_params;
  proxy_pass http://127.0.0.1:3000;
  proxy_pass_request_headers on;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header Host $http_host;
  proxy_set_header Connection '';
  proxy_buffering off;
  proxy_http_version 1.1;
  proxy_redirect off;
}
location / {
  try_files /this_file_does_not_exist.html @llm;
}
```
