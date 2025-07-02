import { OpenAI } from 'openai/client';
import type { ChatCompletionAssistantMessageParam } from 'openai/resources/index.mjs';
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import toast from 'react-hot-toast';
import type { Tool, UseMcpResult } from 'use-mcp/react';
import { convertTools, respondToUser } from '../utils/openaiMcp';
import { useLinearContext } from './LinearContext';
import { useMcpContext } from './McpContext';
import { useTranscriptContext } from './TranscriptContext';

interface MessagesContextType {
  awaitingResponse: boolean;
  error?: Error;
  getResponse: (additionalUserMessage?: string) => void;
  incompleteToolCalls: OpenAI.ChatCompletionMessageToolCall[];
  loading: boolean;
  messages: OpenAI.ChatCompletionMessageParam[];
  readToolCallStack: OpenAI.ChatCompletionMessageToolCall[];
}

export const MessagesContext = createContext<MessagesContextType>({
  awaitingResponse: false,
  getResponse: async () => [],
  incompleteToolCalls: [],
  loading: false,
  messages: [],
  readToolCallStack: [],
});

export const MessagesProvider = ({ children }: { children: ReactNode }) => {
  const { transcript } = useTranscriptContext();
  const { callTool, tools } = useMcpContext();
  const { projects, teams, users } = useLinearContext();

  const [loading, setLoading] = useState<boolean>(false);

  const initialMessage: OpenAI.ChatCompletionMessageParam = {
    content: `You are SnapLinear, an AI teammate that turns stand-up discussion into tidy Linear issues.

Primary Objective:
Convert each actionable item from the user’s transcript into a well-scoped Linear issue (or a comment if a relevant issue exists) that lands in the correct team, project, status, and label.

Interaction Phases:
There are 2 interaction phases, they are the "LEARN phase" and the "CREATE phase".

LEARN Phase:
Before creating any issues, familiarize yourself with the project.
- ALWAYS learn before you do:
  - Call \`list_issues\` with different search queries and a limit to search for similar issues in the project.
  - Available users:
    \`\`\`
    ${JSON.stringify(users)}
    \`\`\`
  - Available projects:
    \`\`\`
    ${JSON.stringify(projects)}
    \`\`\`
  - Available teams:
    \`\`\`
    ${JSON.stringify(teams)}
    \`\`\`
  - Cache the responses in your working memory; cite them when choosing IDs or names.

CREATE phase:
You are now in the create phase.  This phase is triggered the moment you submit a tool that creates or updates any items. Be sure to ALWAYS submit ALL edits and updates together in the final tool calls. Your usage of any mutating tool will terminate the loop.


Arguments for \`create_issue\` or \`update_issue\`:
- \`title\`: ≤ 60 chars, start with a verb.
- \`description\`: You do not need to include a description for every issue.  Only include description if there are additional clarifying details needed. Linear philosophy says that descriptions are optionally read. 
- \`projectId\`: Options include id field of the following \`${JSON.stringify(
      projects,
    )}\`. Do not include this argument if not specified in the transcript.
- \`assigneeId\`: Options include id field of the following \`${JSON.stringify(
      users,
    )}\`. Do not include this argument if not specified in the transcript.
- \`teamId\`: Options include id field of the following \`${JSON.stringify(
      teams,
    )}\`.
- \`stateId\`: Use the \`id\` of the relevant team's \`issueStatuses\`. MUST BE A UUID. Do not include this argument if not specified in the transcript.
- \`labelIds\`: Use the \`id\`s of the relevant team's \`issueLabels\`. MUST BE A UUID. Do not include this argument if not specified in the transcript.
- \`priority\`: Use the \`value\` of the priority (0 = None, 1 = Urgent, 2 = High, 3 = Medium, 4 = Low). Do not include this argument if not specified in the transcript.
- \`parentId\`: Use the \`id\` of the parent issue if applicable. Do not include this argument if not specified in the transcript.
- \`dueDate\`: Use the \`dueDate\` in ISO format (YYYY-MM-DD) if applicable. Do not include this argument if not specified in the transcript.

Be Idempotent & Safe:
- Never create duplicate issues (check with \`list_issues\` filtered by title).

Tone:
- Brief, action-oriented, professional.

Extra Context:
- Today's date is ${new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })}.

Here is the transcript:

${transcript}`,
    role: 'user',
  };

  const [messages, setMessages] = useState<OpenAI.ChatCompletionMessageParam[]>(
    [],
  );
  const [incompleteToolCalls, setIncompleteToolCalls] = useState<
    OpenAI.ChatCompletionMessageToolCall[]
  >([]);
  const [readToolCallStack, setReadToolCallStack] = useState<
    OpenAI.ChatCompletionMessageToolCall[]
  >([]);
  const [error, setError] = useState<Error | undefined>(undefined);

  const lastMessage = messages[messages.length - 1];
  const awaitingResponse =
    (lastMessage?.role === 'assistant' && !lastMessage?.tool_calls) ||
    (lastMessage?.role === 'user' && messages.length > 1);

  useEffect(() => {
    if (transcript && messages.length === 0) {
      setMessages([initialMessage]);
      localStorage.setItem('messages', JSON.stringify([initialMessage]));
    }
  }, [transcript, messages.length]);

  useEffect(() => {
    const storedMessages = localStorage.getItem('messages');
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    }

    const storedToolCalls = localStorage.getItem('incompleteToolCalls');
    if (storedToolCalls) {
      setIncompleteToolCalls(JSON.parse(storedToolCalls));
    }
  }, []);

  async function getResponse(additionalUserMessage?: string): Promise<void> {
    setLoading(true);
    let messagesToSend = messages;
    if (additionalUserMessage) {
      const userMessage: OpenAI.ChatCompletionMessageParam = {
        content: additionalUserMessage,
        role: 'user',
      };
      messagesToSend = [...messages, userMessage];
    }
    setMessages(messagesToSend);
    respondToUser(
      messagesToSend,
      convertTools(tools as Tool[]),
      callTool as UseMcpResult['callTool'],
      (toolCall?: OpenAI.ChatCompletionMessageToolCall) => {
        if (toolCall) setReadToolCallStack((prev) => [...prev, toolCall]);
      },
    )
      .then((newMessages) => {
        if (newMessages.length === 0) return;
        localStorage.setItem(
          'messages',
          JSON.stringify([...messagesToSend, ...newMessages]),
        );
        setMessages([...messagesToSend, ...newMessages]);

        const assistantMessages: ChatCompletionAssistantMessageParam[] =
          newMessages.filter((msg) => msg.role === 'assistant');
        const toolCallMessages: ChatCompletionAssistantMessageParam[] =
          assistantMessages.filter((msg) => msg.tool_calls);
        const toolCalls: OpenAI.ChatCompletionMessageToolCall[] =
          toolCallMessages.flatMap((msg) => msg.tool_calls || []);
        const incompleteToolCalls = toolCalls.filter(
          (tc) =>
            !newMessages.some(
              (msg) => msg.role === 'tool' && msg.tool_call_id === tc?.id,
            ),
        );
        localStorage.setItem(
          'incompleteToolCalls',
          JSON.stringify(incompleteToolCalls || []),
        );
        setIncompleteToolCalls(incompleteToolCalls || []);
      })
      .catch((err) => {
        console.error(err);
        toast.error(err.message);
        setError(err);
      })
      .finally(() => setLoading(false));
  }

  return (
    <MessagesContext.Provider
      value={{
        awaitingResponse,
        error,
        getResponse,
        incompleteToolCalls,
        loading,
        messages,
        readToolCallStack,
      }}
    >
      {children}
    </MessagesContext.Provider>
  );
};

export const useMessagesContext = () => useContext(MessagesContext);
