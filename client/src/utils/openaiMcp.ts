import {
  type CallToolResult,
  McpError,
  type TextContent,
} from '@modelcontextprotocol/sdk/types.js';
import { OpenAI } from 'openai/client';
import { type Tool, type UseMcpResult } from 'use-mcp/react';

export function convertTools(tools: Tool[]): OpenAI.ChatCompletionTool[] {
  return tools.map((tool) => {
    const openAITool: OpenAI.ChatCompletionTool = {
      function: {
        description: tool.description,
        name: tool.name,
        parameters: tool.inputSchema,
      },
      type: 'function',
    };
    if (openAITool.function?.parameters?.type === 'object') {
      if (!('properties' in openAITool.function.parameters)) {
        openAITool.function.parameters['properties'] = {};
      }
    }
    return openAITool;
  });
}

export async function getCompletion(
  messages: OpenAI.ChatCompletionMessageParam[],
  tools: OpenAI.ChatCompletionTool[],
): Promise<OpenAI.ChatCompletionAssistantMessageParam> {
  return fetch(`${import.meta.env.VITE_API_URL}/api/chat`, {
    body: JSON.stringify({
      messages,
      model: 'gpt-4o',
      tools: tools,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })
    .then(async (resp) => {
      if (resp.ok) {
        const completion = await resp.json();
        return completion.choices[0].message;
      } else {
        console.error(await resp.text());
        return {
          content: 'There was an error processing your message.',
          role: 'assistant',
        };
      }
    })
    .catch((err) => {
      console.error(err);
      return {
        content: 'There was an error processing your message.',
        role: 'assistant',
      };
    });
}

export async function callTools(
  message: OpenAI.ChatCompletionMessageParam,
  callTool: UseMcpResult['callTool'],
  updateReadToolCallStack?: (
    toolCall?: OpenAI.ChatCompletionMessageToolCall
  ) => void,
): Promise<OpenAI.ChatCompletionMessageParam[]> {
  if (
    message.role !== 'assistant' ||
    message.tool_calls === undefined ||
    message.tool_calls.length === 0
  )
    return [];

  const toolMessages: OpenAI.ChatCompletionToolMessageParam[] = [];
  for (const tool_call of message.tool_calls) {
    if (
      tool_call.function.name.startsWith('list') ||
      tool_call.function.name.startsWith('get') ||
      tool_call.function.name.startsWith('search')
    ) {
      updateReadToolCallStack?.(tool_call);
      const result = await callTool(
        tool_call.function.name,
        JSON.parse(tool_call.function.arguments),
      )
        .then((res) => res as CallToolResult)
        .catch((err) => {
          console.error(err);
          return {
            content: [
              {
                text: err instanceof McpError ? err.message : (err as string),
                type: 'text',
              } as TextContent,
            ],
            isError: true,
          } as CallToolResult;
        });
      toolMessages.push({
        content: result.content
          .filter((block) => block.type === 'text')
          .map((block) => block.text)
          .join('\n'),
        role: 'tool',
        tool_call_id: tool_call.id,
      });
    }
  }
  return toolMessages;
}

export async function respondToUser(
  messages: OpenAI.ChatCompletionMessageParam[],
  tools: OpenAI.ChatCompletionTool[],
  callTool: UseMcpResult['callTool'],
  updateReadToolCallStack?: (
    toolCall?: OpenAI.ChatCompletionMessageToolCall
  ) => void,
): Promise<OpenAI.ChatCompletionMessageParam[]> {
  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role !== 'user') return [];

  let lastAssistantMessage: OpenAI.ChatCompletionAssistantMessageParam =
    await getCompletion(messages, tools);
  const newMessages: OpenAI.ChatCompletionMessageParam[] = [
    lastAssistantMessage,
  ];

  while (true) {
    if (
      lastAssistantMessage.tool_calls === undefined ||
      lastAssistantMessage.tool_calls.length === 0
    )
      break;

    const toolMessages = await callTools(
      lastAssistantMessage,
      callTool,
      updateReadToolCallStack,
    );
    newMessages.push(...toolMessages);

    if (toolMessages.length !== lastAssistantMessage.tool_calls.length) break;

    lastAssistantMessage = await getCompletion(
      [...messages, ...newMessages],
      tools,
    );
    newMessages.push(lastAssistantMessage);
  }

  return newMessages;
}
