import {OpenAI} from 'openai/client';
import type {ChatCompletionMessageToolCall} from 'openai/resources/index.mjs';
import {
    createContext,
    type ReactNode,
    useContext,
} from 'react';
import z from 'zod';
import {type CreateComment, CreateCommentSchema, type CreateIssue, CreateIssueSchema, type Project, ProjectSchema, type Team, TeamSchema, type UpdateIssue, type User, UserSchema} from '../linearTypes';

interface LocalStorageContextType {
    getLocalApprovedComments: () => Record<string, CreateComment> | undefined;
    getLocalApprovedIssues: () => Record<string, CreateIssue | UpdateIssue> | undefined;
    getLocalCommentToolCalls: () => ChatCompletionMessageToolCall[] | undefined;
    getLocalIncompleteToolCalls: () => OpenAI.ChatCompletionMessageToolCall[] | undefined;
    getLocalIssueToolCalls: () => ChatCompletionMessageToolCall[] | undefined;
    getLocalLinearProjects: () => Project[] | undefined;
    getLocalLinearTeams: () => Team[] | undefined;
    getLocalLinearUsers: () => User[] | undefined;
    getLocalMessages: () => OpenAI.ChatCompletionMessageParam[] | undefined;
    getLocalRejectedComments: () => Record<string, CreateComment> | undefined;
    getLocalRejectedIssues: () => Record<string, CreateIssue | UpdateIssue> | undefined;
    getLocalTranscript: () => string | undefined;
    hardReset: () => void;
    resetLocalStorage: () => void;
    setLocalApprovedComments: (comments: Record<string, CreateComment>) => void;
    setLocalApprovedIssues: (issues: Record<string, CreateIssue | UpdateIssue>) => void;
    setLocalCommentToolCalls: (commentToolCalls: ChatCompletionMessageToolCall[]) => void;
    setLocalIncompleteToolCalls: (toolCalls: OpenAI.ChatCompletionMessageToolCall[]) => void;
    setLocalIssueToolCalls: (issueToolCalls: ChatCompletionMessageToolCall[]) => void;
    setLocalLinearProjects: (projects: Project[]) => void;
    setLocalLinearTeams: (teams: Team[]) => void;
    setLocalLinearUsers: (users: User[]) => void;
    setLocalMessages: (messages: OpenAI.ChatCompletionMessageParam[]) => void;
    setLocalRejectedComments: (comments: Record<string, CreateComment>) => void;
    setLocalRejectedIssues: (issues: Record<string, CreateIssue | UpdateIssue>) => void;
    setLocalTranscript: (transcript: string) => void;
}

const LocalStorageContext = createContext<LocalStorageContextType>({
    getLocalApprovedComments: () => ({}),
    getLocalApprovedIssues: () => ({}),
    getLocalCommentToolCalls: () => undefined,
    getLocalIncompleteToolCalls: () => undefined,
    getLocalIssueToolCalls: () => undefined,
    getLocalLinearProjects: () => undefined,
    getLocalLinearTeams: () => undefined,
    getLocalLinearUsers: () => undefined,
    getLocalMessages: () => undefined,
    getLocalRejectedComments: () => ({}),
    getLocalRejectedIssues: () => ({}),
    getLocalTranscript: () => undefined,
    hardReset: () => {
        localStorage.clear();
        window.location.pathname = '/';
    },
    resetLocalStorage: () => {
        [
            'transcript',
            'messages',
            'incompleteToolCalls',
            'issueToolCalls',
            'approvedIssues',
            'rejectedIssues',
            'commentToolCalls',
            'approvedComments',
            'rejectedComments',
            'linearUsers',
            'linearProjects',
            'linearTeams',
        ].forEach((k) => localStorage.removeItem(k));

        window.location.pathname = '/';
    },
    setLocalApprovedComments: (comments: Record<string, CreateComment>) => {
        localStorage.setItem('approvedComments', JSON.stringify(comments));
    },
    setLocalApprovedIssues: (issues: Record<string, CreateIssue | UpdateIssue>) => {
        localStorage.setItem('approvedIssues', JSON.stringify(issues));
    },
    setLocalCommentToolCalls: (commentToolCalls: ChatCompletionMessageToolCall[]) => {
        localStorage.setItem('commentToolCalls', JSON.stringify(commentToolCalls));
    },
    setLocalIncompleteToolCalls: (toolCalls: OpenAI.ChatCompletionMessageToolCall[]) => {
        localStorage.setItem('incompleteToolCalls', JSON.stringify(toolCalls));
    },
    setLocalIssueToolCalls: (issueToolCalls: ChatCompletionMessageToolCall[]) => {
        localStorage.setItem('issueToolCalls', JSON.stringify(issueToolCalls));
    },
    setLocalLinearProjects: (projects: Project[]) => {
        localStorage.setItem('linearProjects', JSON.stringify(projects));
    },
    setLocalLinearTeams: (teams: Team[]) => {
        localStorage.setItem('linearTeams', JSON.stringify(teams));
    },
    setLocalLinearUsers: (users: User[]) => {
        localStorage.setItem('linearUsers', JSON.stringify(users));
    },
    setLocalMessages: (messages: OpenAI.ChatCompletionMessageParam[]) => {
        localStorage.setItem('messages', JSON.stringify(messages));
    },
    setLocalRejectedComments: (comments: Record<string, CreateComment>) => {
        localStorage.setItem('rejectedComments', JSON.stringify(comments));
    },
    setLocalRejectedIssues: (issues: Record<string, CreateIssue | UpdateIssue>) => {
        localStorage.setItem('rejectedIssues', JSON.stringify(issues));
    },
    setLocalTranscript: (transcript: string) => {
        localStorage.setItem('transcript', transcript);
    },
});

export const LocalStorageProvider = ({children}: { children: ReactNode }) => {
    const getLocalTranscript = () => {
        return localStorage.getItem('transcript') || undefined;
    };

    const setLocalTranscript = (transcript: string) => {
        localStorage.setItem('transcript', transcript);
    };

    const getLocalMessages = () => {
        const messages = localStorage.getItem('messages');
        try {
            if (!messages) return undefined;
            return JSON.parse(messages) as OpenAI.ChatCompletionMessageParam[];
        } catch (error) {
            console.error('Error parsing messages from localStorage:', error);
            return undefined;
        }
    };

    const setLocalMessages = (messages: OpenAI.ChatCompletionMessageParam[]) => {
        localStorage.setItem('messages', JSON.stringify(messages));
    };

    const getLocalIncompleteToolCalls = () => {
        const toolCalls = localStorage.getItem('incompleteToolCalls');
        try {
            if (!toolCalls) return undefined;
            return JSON.parse(toolCalls) as OpenAI.ChatCompletionMessageToolCall[];
        } catch (error) {
            console.error('Error parsing incompleteToolCalls from localStorage:', error);
            return undefined;
        }
    };

    const setLocalIncompleteToolCalls = (toolCalls: OpenAI.ChatCompletionMessageToolCall[]) => {
        localStorage.setItem('incompleteToolCalls', JSON.stringify(toolCalls));
    };

    const getLocalIssueToolCalls = () => {
        const issueToolCalls = localStorage.getItem('issueToolCalls');
        try {
            if (!issueToolCalls) return undefined;
            return JSON.parse(issueToolCalls) as ChatCompletionMessageToolCall[];
        } catch (error) {
            console.error('Error parsing issueToolCalls from localStorage:', error);
            return undefined;
        }
    };

    const setLocalIssueToolCalls = (issueToolCalls: ChatCompletionMessageToolCall[]) => {
        localStorage.setItem('issueToolCalls', JSON.stringify(issueToolCalls));
    };

    const getLocalApprovedIssues = () => {
        const approvedIssues = localStorage.getItem('approvedIssues');
        try {
            const parsedIssues = JSON.parse(approvedIssues || '{}');
            const approvedIssuesParseResult = z.record(CreateIssueSchema).safeParse(parsedIssues);
            return approvedIssuesParseResult.success ? approvedIssuesParseResult.data : undefined;
        } catch (error) {
            console.error('Error parsing approvedIssues from localStorage:', error);
            return undefined;
        }
    };

    const setLocalApprovedIssues = (issues: Record<string, CreateIssue | UpdateIssue>) => {
        localStorage.setItem('approvedIssues', JSON.stringify(issues));
    };

    const getLocalRejectedIssues = () => {
        const rejectedIssues = localStorage.getItem('rejectedIssues');
        try {
            const parsedIssues = JSON.parse(rejectedIssues || '{}');
            const rejectedIssuesParseResult = z.record(CreateIssueSchema).safeParse(parsedIssues);
            return rejectedIssuesParseResult.success ? rejectedIssuesParseResult.data : undefined;
        } catch (error) {
            console.error('Error parsing rejectedIssues from localStorage:', error);
            return undefined;
        }
    };

    const setLocalRejectedIssues = (issues: Record<string, CreateIssue | UpdateIssue>) => {
        localStorage.setItem('rejectedIssues', JSON.stringify(issues));
    };

    const getLocalCommentToolCalls = () => {
        const commentToolCalls = localStorage.getItem('commentToolCalls');
        try {
            if (!commentToolCalls) return undefined;
            return JSON.parse(commentToolCalls) as ChatCompletionMessageToolCall[];
        } catch (error) {
            console.error('Error parsing commentToolCalls from localStorage:', error);
            return undefined;
        }
    };

    const setLocalCommentToolCalls = (commentToolCalls: ChatCompletionMessageToolCall[]) => {
        localStorage.setItem('commentToolCalls', JSON.stringify(commentToolCalls));
    };

    const getLocalApprovedComments = () => {
        const approvedComments = localStorage.getItem('approvedComments');
        try {
            const parsedComments = JSON.parse(approvedComments || '{}');
            const approvedCommentsParseResult = z.record(CreateCommentSchema).safeParse(parsedComments);
            return approvedCommentsParseResult.success ? approvedCommentsParseResult.data : undefined;
        } catch (error) {
            console.error('Error parsing approvedComments from localStorage:', error);
            return undefined;
        }
    };

    const setLocalApprovedComments = (comments: Record<string, CreateComment>) => {
        localStorage.setItem('approvedComments', JSON.stringify(comments));
    };

    const getLocalRejectedComments = () => {
        const rejectedComments = localStorage.getItem('rejectedComments');
        try {
            const parsedComments = JSON.parse(rejectedComments || '{}');
            const rejectedCommentsParseResult = z.record(CreateCommentSchema).safeParse(parsedComments);
            return rejectedCommentsParseResult.success ? rejectedCommentsParseResult.data : undefined;
        } catch (error) {
            console.error('Error parsing rejectedComments from localStorage:', error);
            return undefined;
        }
    };

    const setLocalRejectedComments = (comments: Record<string, CreateComment>) => {
        localStorage.setItem('rejectedComments', JSON.stringify(comments));
    };

    const getLocalLinearUsers = () => {
        const linearUsers = localStorage.getItem('linearUsers');
        if (!linearUsers) return undefined;
        try {
            const parsedUsers = JSON.parse(linearUsers);
            const linearUsersParseResult = z.array(UserSchema).safeParse(parsedUsers);
            return linearUsersParseResult.success ? linearUsersParseResult.data : undefined;
        } catch (error) {
            console.error('Error parsing linearUsers from localStorage:', error);
            return undefined;
        }
    };

    const setLocalLinearUsers = (users: User[]) => {
        localStorage.setItem('linearUsers', JSON.stringify(users));
    };

    const getLocalLinearProjects = () => {
        const linearProjects = localStorage.getItem('linearProjects');
        if (!linearProjects) return undefined;
        try {
            const parsedProjects = JSON.parse(linearProjects);
            const linearProjectsParseResult = z.array(ProjectSchema).safeParse(parsedProjects);
            return linearProjectsParseResult.success ? linearProjectsParseResult.data : undefined;
        } catch (error) {
            console.error('Error parsing linearProjects from localStorage:', error);
            return undefined;
        }
    };

    const setLocalLinearProjects = (projects: Project[]) => {
        localStorage.setItem('linearProjects', JSON.stringify(projects));
    };

    const getLocalLinearTeams = () => {
        const linearTeams = localStorage.getItem('linearTeams');
        if (!linearTeams) return undefined;
        try {
            const parsedTeams = JSON.parse(linearTeams);
            const linearTeamsParseResult = z.array(TeamSchema).safeParse(parsedTeams);
            return linearTeamsParseResult.success ? linearTeamsParseResult.data : undefined;
        } catch (error) {
            console.error('Error parsing linearTeams from localStorage:', error);
            return undefined;
        }
    };

    const setLocalLinearTeams = (teams: Team[]) => {
        localStorage.setItem('linearTeams', JSON.stringify(teams));
    };

    const resetLocalStorage = () => {
        [
            'transcript',
            'messages',
            'incompleteToolCalls',
            'issueToolCalls',
            'approvedIssues',
            'rejectedIssues',
            'commentToolCalls',
            'approvedComments',
            'rejectedComments',
            'linearUsers',
            'linearProjects',
            'linearTeams',
        ].forEach((k) => localStorage.removeItem(k));

        window.location.pathname = '/';
    };

    const hardReset = () => {
        localStorage.clear();
        window.location.pathname = '/';
    };

    return (
        <LocalStorageContext.Provider
            value={{
                getLocalApprovedComments,
                getLocalApprovedIssues,
                getLocalCommentToolCalls,
                getLocalIncompleteToolCalls,
                getLocalIssueToolCalls,
                getLocalLinearProjects,
                getLocalLinearTeams,
                getLocalLinearUsers,
                getLocalMessages,
                getLocalRejectedComments,
                getLocalRejectedIssues,
                getLocalTranscript,
                hardReset,
                resetLocalStorage,
                setLocalApprovedComments,
                setLocalApprovedIssues,
                setLocalCommentToolCalls,
                setLocalIncompleteToolCalls,
                setLocalIssueToolCalls,
                setLocalLinearProjects,
                setLocalLinearTeams,
                setLocalLinearUsers,
                setLocalMessages,
                setLocalRejectedComments,
                setLocalRejectedIssues,
                setLocalTranscript,
            }}
        >
            {children}
        </LocalStorageContext.Provider>
    );
};

export const useLocalStorageContext = () => useContext(LocalStorageContext);
