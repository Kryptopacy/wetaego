/**
 * WebMCP (Web Model Context Protocol) Type Definitions
 * Specification: https://github.com/webmachinelearning/webmcp
 * Chrome Docs: https://developer.chrome.com/docs/ai/webmcp
 */

export interface JSONSchemaProperty {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
  description?: string;
  enum?: string[] | number[];
  items?: JSONSchemaProperty;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  default?: any;
}

export interface JSONSchema {
  type: 'object';
  properties: Record<string, JSONSchemaProperty>;
  required?: string[];
}

export interface WebMCPTool<TInput = any, TOutput = any> {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  execute: (input: TInput) => Promise<TOutput> | TOutput;
}

export interface WebMCPRegisteredTool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  unregister: () => void;
}

export interface ModelContext {
  registerTool: <TInput = any, TOutput = any>(tool: WebMCPTool<TInput, TOutput>) => WebMCPRegisteredTool | void;
  unregisterTool?: (name: string) => void;
  getTools?: () => WebMCPTool[];
  executeTool?: (name: string, input: any) => Promise<any>;
  readonly registeredTools?: Map<string, WebMCPTool>;
}

declare global {
  interface Document {
    modelContext?: ModelContext;
  }
  interface Window {
    modelContext?: ModelContext;
  }
}
