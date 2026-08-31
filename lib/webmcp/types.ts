/**
 * WebMCP (Web Model Context Protocol) Type Definitions
 * Specification: https://github.com/webmachinelearning/webmcp
 * Chrome Docs: https://developer.chrome.com/docs/ai/webmcp
 */

export interface JSONSchemaProperty {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
  description?: string;
  enum?: (string | number)[];
  items?: JSONSchemaProperty;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  default?: unknown;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  format?: string;
  additionalProperties?: boolean | JSONSchemaProperty;
  const?: unknown;
}

export interface JSONSchema {
  type: 'object';
  properties: Record<string, JSONSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean | JSONSchemaProperty;
}

export interface WebMCPTool<TInput = any, TOutput = any> {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  outputSchema?: JSONSchema;
  /** Mirror of outputSchema — explicit field the WebMCP scanner reads for result type inference. */
  resultSchema?: JSONSchema;
  /** Additional alias for response schema */
  responseSchema?: JSONSchema;
  /** The page path this tool is registered on (e.g. '/', '/m/{slug}', '/m/{slug}/checkout'). Used by WebMCP directory for per-page tool attribution. */
  page?: string;
  execute: (input: TInput) => Promise<TOutput> | TOutput;
}

export interface WebMCPRegisteredTool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  outputSchema?: JSONSchema;
  resultSchema?: JSONSchema;
  responseSchema?: JSONSchema;
  page?: string;
  unregister: () => void;
}

export interface ProvideContextOptions {
  tools?: WebMCPTool[];
  signal?: AbortSignal;
  [key: string]: any;
}

export interface ModelContext {
  registerTool: <TInput = any, TOutput = any>(tool: WebMCPTool<TInput, TOutput>) => WebMCPRegisteredTool | void;
  provideContext?: (options: ProvideContextOptions | WebMCPTool[]) => { unregister: () => void } | void;
  unregisterTool?: (name: string) => void;
  getTools?: () => WebMCPTool[];
  executeTool?: (name: string, input: any) => Promise<any>;
  readonly registeredTools?: Map<string, WebMCPTool>;
  tools?: WebMCPTool[];
}

declare global {
  interface Document {
    modelContext?: ModelContext;
  }
  interface Window {
    modelContext?: ModelContext;
  }
  interface Navigator {
    modelContext?: ModelContext;
  }
}
