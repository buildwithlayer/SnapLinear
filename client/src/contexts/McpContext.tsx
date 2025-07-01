import { createContext, useContext, type ReactNode } from "react";
import { useMcp, type Tool, type UseMcpResult } from "use-mcp/react";
import { ClipLoader } from "react-spinners";
import Button from "../components/Button";

interface McpContextType {
  callTool?: UseMcpResult["callTool"];
  tools?: Tool[];
  state?: UseMcpResult["state"];
}

const McpContext = createContext<McpContextType>({});

export const McpProvider = ({ children }: { children: ReactNode }) => {
  const { callTool, state, tools, error, retry, authenticate } = useMcp({
    autoReconnect: true,
    // callbackUrl: import.meta.env.VITE_CALLBACK_URL,
    callbackUrl: "https://1b03-185-199-103-83.ngrok-free.app/oauth/callback",
    clientName: "SnapLinear",
    url: "https://mcp.linear.app/sse",
  });

  const includedTools = [
    "list_comments",
    "create_comment",
    "get_issue",
    "list_issues",
    "create_issue",
    "update_issue",
    "get_issue_status",
    "list_my_issues",
    "search_documentation",
  ];

  const filteredTools = tools?.filter((tool) => {
    return includedTools.includes(tool.name);
  });

  return (
    <McpContext.Provider value={{ callTool, tools: filteredTools, state }}>
      {state === "failed" && (
        <div className="flex flex-col items-center justify-center text-center h-full w-full gap-8">
          <div className="flex flex-col items-center gap-1">
            <p>Connection failed:</p>
            <p className="text-red-500">{error}</p>
          </div>
          <div className="flex gap-4">
            <Button onClick={retry}>Retry</Button>
            <Button onClick={authenticate}>Authenticate Manually</Button>
          </div>
        </div>
      )}
      {state !== "failed" && state !== "ready" && (
        <div className="flex h-full w-full items-center justify-center">
          <ClipLoader size={56} color="white" />
        </div>
      )}
      {state === "ready" && children}
    </McpContext.Provider>
  );
};

export const useMcpContext = () => useContext(McpContext);
