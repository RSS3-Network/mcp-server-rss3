#!/usr/bin/env node
import "tsx";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
const { HttpClient, OpenAPIToMCPConverter } = await import(
	"openapi-mcp-server"
);

/**
 * Error thrown by HttpClient when a request fails
 * @extends Error
 */
class HttpClientError extends Error {
	constructor(
		/** @param {string} message - Error message */
		message,
		/** @param {number} status - HTTP status code */
		status,
		/** @param {*} data - Response data */
		data,
		/** @param {Headers} [headers] - Response headers */
		headers,
	) {
		super(`${status} ${message}`);
		this.name = "HttpClientError";
		this.status = status;
		this.data = data;
		this.headers = headers;
	}
}

/**
 * @typedef {import("openapi-mcp-server").OpenAPIV3.Document} OpenApiSpec
 * @type {{ client: HttpClient, spec: OpenApiSpec }[]}
 */
const openApiSpecs = (
	await Promise.allSettled([
		fetch("https://gi.rss3.io/docs/openapi.json").then(async (res) => {
			if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
			return res.json();
		}),
		fetch("https://ai.rss3.io/openapi.json").then(async (res) => {
			if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
			return res.json();
		}),
	]).then((results) => {
		return results.map((result) => {
			if (result.status === "fulfilled") {
				const client = new HttpClient(
					{
						baseUrl: result.value.servers[0].url,
					},
					result.value,
				);
				return {
					spec: result.value,
					client,
				};
			}

			console.error("Failed to fetch openapi spec", result.reason);
			return null;
		});
	})
).filter(Boolean);

const converterWithClients = openApiSpecs.map((o) => {
	const converter = new OpenAPIToMCPConverter(o.spec);
	return {
		converter,
		client: o.client,
	};
});
const mcpToolWithClients = converterWithClients.map((cwc) => {
	const mcpTools = cwc.converter.convertToMCPTools();
	return {
		mcpTools,
		client: cwc.client,
	};
});

// implement server
const server = new Server(
	{
		name: "rss3",
		version: "0.1.0",
	},
	{
		capabilities: {
			tools: {},
		},
	},
);

// handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
	console.error("list tools");
	/**
	 * @typedef {import("@modelcontextprotocol/sdk/types.js").Tool} Tool
	 * @type {Tool[]}
	 */
	const tools = [];

	for (const mcpToolWithClient of mcpToolWithClients) {
		for (const [toolName, def] of Object.entries(
			mcpToolWithClient.mcpTools.tools,
		)) {
			for (const method of def.methods) {
				console.error("method", method);
				const toolNameWithMethod = `${toolName}-${method.name}`;
				const truncatedToolName = toolNameWithMethod.slice(0, 64);
				const trimmedDescription = method.description.split("Error")[0].trim();
				tools.push({
					name: truncatedToolName,
					description: trimmedDescription,
					inputSchema: {
						type: "object",
						properties: {},
					},
				});
			}
		}
	}

	tools.unshift({
		name: "API-get-input-schema",
		description:
			"Get the input schema for a given API. We should always use this tool to get the input schema for a given API before calling the API.",
		inputSchema: {
			type: "object",
			properties: {
				toolName: {
					type: "string",
					description: "The name of the tool to get the input schema for",
				},
			},
		},
	});

	console.error("tools", tools);

	return { tools };
});

// handle tool calling
server.setRequestHandler(CallToolRequestSchema, async (request) => {
	// console.error("call tool", request.params);
	const { name, arguments: params } = request.params;

	console.error("name", name);

	if (name === "API-get-input-schema") {
		for (const mcpToolWithClient of mcpToolWithClients) {
			for (const [toolName, def] of Object.entries(
				mcpToolWithClient.mcpTools.tools,
			)) {
				for (const method of def.methods) {
					const toolNameWithMethod = `${toolName}-${method.name}`;
					const truncatedToolName = toolNameWithMethod.slice(0, 64);
					if (truncatedToolName === params.toolName) {
						return {
							content: [
								{ type: "text", text: JSON.stringify(method.inputSchema) },
							],
						};
					}
				}
			}
		}
		throw new Error(`Method ${params.toolName} not found`);
	}

	// find operation
	const mcpToolWithClient = mcpToolWithClients.find(
		(t) => t.mcpTools.openApiLookup[name],
	);
	if (!mcpToolWithClient) {
		throw new Error(`Method ${name} not found`);
	}

	const operation = mcpToolWithClient.mcpTools.openApiLookup[name];

	// execute
	try {
		const response = await mcpToolWithClient.client.executeOperation(
			operation,
			params,
		);
		return {
			content: [
				{
					type: "text", // currently this is the only type that seems to be used by mcp server
					text: JSON.stringify(response.data), // TODO: pass through the http status code text?
				},
			],
		};
	} catch (error) {
		console.error("Error in tool call", error);
		if (error instanceof HttpClientError) {
			console.error(
				"HttpClientError encountered, returning structured error",
				error,
			);
			const data = error.data?.response?.data ?? error.data ?? {};
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify({
							status: "error", // TODO: get this from http status code?
							...(typeof data === "object" ? data : { data: data }),
						}),
					},
				],
			};
		}
		throw error;
	}
});

// run server
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("RSS3 MCP Server running on stdio");
