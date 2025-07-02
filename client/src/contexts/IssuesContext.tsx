import type { ChatCompletionMessageToolCall } from 'openai/resources/index.mjs';
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import toast from 'react-hot-toast';
import {
  type CreateIssue,
  isUpdateIssue,
  type UpdateIssue,
} from '../linearTypes';
import { useLinearContext } from './LinearContext';
import { useMcpContext } from './McpContext';
import { useMessagesContext } from './MessagesContext';

interface IssuesContextType {
  approveIssue: (toolCallId: string) => Promise<void>;
  approveLoading: string[];
  issues: Record<string, CreateIssue | UpdateIssue>;
  issuesLoading: boolean;
  rejectIssue: (toolCallId: string) => void;
  unreviewedIssues: Record<string, CreateIssue | UpdateIssue>;
}

const IssuesContext = createContext<IssuesContextType>({
  approveIssue: async () => {},
  approveLoading: [],
  issues: {},
  issuesLoading: false,
  rejectIssue: () => {},
  unreviewedIssues: {},
});

export const IssuesProvider = ({ children }: { children: ReactNode }) => {
  const { callTool } = useMcpContext();
  const { incompleteToolCalls } = useMessagesContext();
  const { teams } = useLinearContext();

  const [issueToolCalls, setIssueToolCalls] = useState<
    ChatCompletionMessageToolCall[]
  >([]);
  const [approvedIssues, setApprovedIssues] = useState<
    Record<string, CreateIssue | UpdateIssue>
  >({});
  const [approveLoading, setApproveLoading] = useState<string[]>([]);
  const [rejectedIssues, setRejectedIssues] = useState<
    Record<string, CreateIssue | UpdateIssue>
  >({});

  const [issues, setIssues] = useState<
    Record<string, CreateIssue | UpdateIssue>
  >({});
  const [issuesLoading, setIssuesLoading] = useState<boolean>(false);

  useEffect(() => {
    if (Object.keys(issues).length > 0) return;

    setIssuesLoading(true);

    async function fetchIssues() {
      const resolvedIssues = await Promise.all(
        issueToolCalls.map(async (toolCall) => {
          const issueData = JSON.parse(toolCall.function.arguments);
          if (isUpdateIssue(issueData)) {
            const getIssueResponse = await callTool?.('get_issue', {
              id: issueData.id,
            });
            if (getIssueResponse) {
              issueData.originalIssue = JSON.parse(
                getIssueResponse.content[0].text,
              );
            }
          }
          return { [toolCall.id]: issueData };
        }),
      );

      const issuesObject = Object.assign({}, ...resolvedIssues);
      setIssues(issuesObject);
    }

    fetchIssues()
      .catch((error) => {
        console.error('Error fetching issues:', error);
        toast.error('Could not fetch issues');
      })
      .finally(() => {
        setIssuesLoading(false);
      });
  }, [issueToolCalls, callTool, issues]);

  const unreviewedIssues = Object.fromEntries(
    Object.entries(issues).filter(([toolCallId]) => {
      return !approvedIssues[toolCallId] && !rejectedIssues[toolCallId];
    }),
  );

  useEffect(() => {
    if (incompleteToolCalls && Object.entries(issues).length === 0) {
      const issueToolCalls = incompleteToolCalls.filter(
        (toolCall) =>
          toolCall.function.name === 'create_issue' ||
          toolCall.function.name === 'update_issue',
      );

      setIssueToolCalls(issueToolCalls);
      localStorage.setItem('issueToolCalls', JSON.stringify(issueToolCalls));
    }
  }, [incompleteToolCalls, issues]);

  useEffect(() => {
    const storedIssueToolCalls = localStorage.getItem('issueToolCalls');
    const storedApprovedIssues = localStorage.getItem('approvedIssues');
    const storedRejectedIssues = localStorage.getItem('rejectedIssues');

    if (storedIssueToolCalls) {
      const parsedIssues = JSON.parse(storedIssueToolCalls);
      setIssueToolCalls(parsedIssues);
    }
    if (storedApprovedIssues) {
      setApprovedIssues(JSON.parse(storedApprovedIssues));
    }
    if (storedRejectedIssues) {
      setRejectedIssues(JSON.parse(storedRejectedIssues));
    }
  }, []);

  async function approveIssue(toolCallId: string) {
    if (approveLoading.includes(toolCallId)) return;
    setApproveLoading((prev) => [...prev, toolCallId]);
    if (issues[toolCallId] && callTool) {
      const toolCall = issueToolCalls.find(
        (toolCall) => toolCall.id === toolCallId,
      );
      if (toolCall) {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          const toolResponse = await callTool(toolCall.function.name, {
            ...args,
            description:
              args.description +
              '\n\nCreated with [SnapLinear](https://www.snaplinear.app/?utm_source=snaplinear-tasklink&utm_medium=linear+task&utm_campaign=snaplinear)',
            labelIds: args.labelIds
              ? args.labelIds.map(
                  (labelId: string) =>
                    teams
                      ?.find((team) => team.id === args.teamId)
                      ?.issueLabels.find((label) => label.id === labelId)?.id,
                )
              : [],
            stateId: args.stateId
              ? teams
                  ?.find((team) => team.id === args.teamId)
                  ?.issueStatuses?.find((status) => status.id === args.stateId)
                ? args.stateId
                : undefined
              : undefined,
          });
          if (toolResponse.isError) {
            throw new Error(toolResponse.content[0].text);
          }
          setApprovedIssues((prev) => ({
            ...prev,
            [toolCallId]: issues[toolCallId],
          }));
          localStorage.setItem(
            'approvedIssues',
            JSON.stringify({
              ...approvedIssues,
              [toolCallId]: issues[toolCallId],
            }),
          );
        } catch (error) {
          console.error('Error approving issue:', error);
          toast.error('Could not approve issue');
        }
      }
      setApproveLoading((prev) => prev.filter((id) => id !== toolCallId));
    }
  }

  function rejectIssue(toolCallId: string) {
    if (issues[toolCallId]) {
      setRejectedIssues((prev) => ({
        ...prev,
        [toolCallId]: issues[toolCallId],
      }));
      localStorage.setItem(
        'rejectedIssues',
        JSON.stringify({
          ...rejectedIssues,
          [toolCallId]: issues[toolCallId],
        }),
      );
    }
  }

  return (
    <IssuesContext.Provider
      value={{
        approveIssue,
        approveLoading,
        issues,
        issuesLoading,
        rejectIssue,
        unreviewedIssues,
      }}
    >
      {children}
    </IssuesContext.Provider>
  );
};

export const useIssuesContext = () => useContext(IssuesContext);
