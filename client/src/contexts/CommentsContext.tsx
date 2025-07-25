import * as amplitude from '@amplitude/analytics-browser';
import type {ChatCompletionMessageToolCall} from 'openai/resources/index.mjs';
import {
    createContext,
    type ReactNode,
    useContext,
    useEffect,
    useState,
} from 'react';
import toast from 'react-hot-toast';
import type {CreateComment} from '../linearTypes';
import {useLocalStorageContext} from './LocalStorageContext';
import {useMcpContext} from './McpContext';
import {useMessagesContext} from './MessagesContext';

interface CommentsContextType {
    approveComment: (toolCallId: string) => Promise<void>;
    approveLoading: string[];
    comments: Record<string, CreateComment>;
    commentsLoading: boolean;
    rejectComment: (toolCallId: string) => void;
    unreviewedComments: Record<string, CreateComment>;
}

const CommentsContext = createContext<CommentsContextType>({
    approveComment: async () => {
    },
    approveLoading: [],
    comments: {},
    commentsLoading: false,
    rejectComment: () => {
    },
    unreviewedComments: {},
});

export const CommentsProvider = ({children}: { children: ReactNode }) => {
    const {callTool} = useMcpContext();
    const {incompleteToolCalls} = useMessagesContext();
    const {getLocalApprovedComments, getLocalCommentToolCalls, getLocalRejectedComments, setLocalApprovedComments, setLocalCommentToolCalls, setLocalRejectedComments} = useLocalStorageContext();

    const [commentToolCalls, setCommentToolCalls] = useState<
        ChatCompletionMessageToolCall[]
    >([]);
    const [approvedComments, setApprovedComments] = useState<
        Record<string, CreateComment>
    >({});
    const [approveLoading, setApproveLoading] = useState<string[]>([]);
    const [rejectedComments, setRejectedComments] = useState<
        Record<string, CreateComment>
    >({});

    const [comments, setComments] = useState<Record<string, CreateComment>>({});
    const [commentsLoading, setCommentsLoading] = useState<boolean>(false);

    const unreviewedComments = Object.fromEntries(
        Object.entries(comments).filter(([toolCallId]) => {
            return !approvedComments[toolCallId] && !rejectedComments[toolCallId];
        }),
    );

    useEffect(() => {
        if (Object.keys(comments).length > 0 || commentToolCalls.length === 0) return;

        setCommentsLoading(true);

        async function fetchComments() {
            const resolvedComments = await Promise.all(
                commentToolCalls.map(async (toolCall) => {
                    const commentData = JSON.parse(toolCall.function.arguments);
                    const getIssueResponse = await callTool?.('get_issue', {
                        id: commentData.issueId,
                    });
                    if (getIssueResponse) {
                        commentData.issue = JSON.parse(getIssueResponse.content[0].text);
                    }
                    return {[toolCall.id]: commentData};
                }),
            );

            const commentsObject = Object.assign({}, ...resolvedComments);
            setComments(commentsObject);
        }

        fetchComments()
            .catch((error) => {
                console.error('Error fetching comments:', error);
                toast.error('Could not fetch comments');
            })
            .finally(() => {
                setCommentsLoading(false);
            });
    }, [commentToolCalls, callTool, comments]);

    useEffect(() => {
        if (incompleteToolCalls && Object.entries(comments).length === 0) {
            const commentToolCalls = incompleteToolCalls.filter(
                (toolCall) => toolCall.function.name === 'create_comment',
            );

            setCommentToolCalls(commentToolCalls);
            setLocalCommentToolCalls(commentToolCalls);
        }
    }, [incompleteToolCalls, comments, setLocalCommentToolCalls]);

    useEffect(() => {
        if (commentToolCalls.length === 0) {
            setCommentToolCalls(getLocalCommentToolCalls() || []);
        }
        if (Object.keys(approvedComments).length === 0) {
            setApprovedComments(getLocalApprovedComments() || {});
        }
        if (Object.keys(rejectedComments).length === 0) {
            setRejectedComments(getLocalRejectedComments() || {});
        }
    }, [getLocalCommentToolCalls, getLocalApprovedComments, getLocalRejectedComments, commentToolCalls, approvedComments, rejectedComments]);

    async function approveComment(toolCallId: string) {
        if (approveLoading.includes(toolCallId)) return;
        setApproveLoading((prev) => [...prev, toolCallId]);
        if (comments[toolCallId] && callTool) {
            const toolCall = commentToolCalls.find(
                (toolCall) => toolCall.id === toolCallId,
            );
            if (toolCall) {
                try {
                    const toolResponse = await callTool(
                        toolCall.function.name,
                        JSON.parse(toolCall.function.arguments),
                    );
                    if (toolResponse.isError) {
                        console.error('Error approving comment:', toolResponse.content[0].text);
                        toast.error('Could not approve comment');
                        return;
                    }
                    setApprovedComments((prev) => ({
                        ...prev,
                        [toolCallId]: comments[toolCallId],
                    }));
                    setLocalApprovedComments({
                        ...approvedComments,
                        [toolCallId]: comments[toolCallId],
                    });
                } catch (error) {
                    console.error('Error approving comment:', error);
                    toast.error('Could not approve comment');
                }
            }
            setApproveLoading((prev) => prev.filter((id) => id !== toolCallId));
            amplitude.track('Comment Approved', {
                comment: JSON.stringify(comments[toolCallId]),
            });
        }
    }

    function rejectComment(toolCallId: string) {
        if (comments[toolCallId]) {
            setRejectedComments((prev) => ({
                ...prev,
                [toolCallId]: comments[toolCallId],
            }));
            setLocalRejectedComments({
                ...rejectedComments,
                [toolCallId]: comments[toolCallId],
            });
            amplitude.track('Comment Rejected', {
                comment: JSON.stringify(comments[toolCallId]),
            });
        }
    }

    return (
        <CommentsContext.Provider
            value={{
                approveComment,
                approveLoading,
                comments,
                commentsLoading,
                rejectComment,
                unreviewedComments,
            }}
        >
            {children}
        </CommentsContext.Provider>
    );
};

export const useCommentsContext = () => useContext(CommentsContext);
