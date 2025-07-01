import { useEffect, useState } from "react";
import { useFileContext } from "./contexts/FileContext";
import { ClipLoader } from "react-spinners";
import { useTranscriptContext } from "./contexts/TranscriptContext";
import { useMessagesContext } from "./contexts/MessagesContext";
import Button from "./components/Button";
import UpArrowIcon from "./assets/uparrow.svg?react";
import { useLinearContext } from "./contexts/LinearContext";
import ResetButton from "./components/ResetButton";

interface Step {
  label: string;
  start: boolean;
  loading: boolean;
  fn: () => void;
  error?: Error;
  complete: boolean;
  additionalMessage?: string;
}

const Progress = () => {
  const { file } = useFileContext();
  const {
    transcribeFile,
    transcript,
    loading: transcriptLoading,
    error: transcriptError,
  } = useTranscriptContext();
  const {
    users,
    projects,
    teams,
    fetchLinearData,
    loading: linearLoading,
    error: linearError,
  } = useLinearContext();
  const {
    messages,
    getResponse,
    loading: messagesLoading,
    error: messagesError,
    awaitingResponse,
    readToolCallStack,
  } = useMessagesContext();

  const currentlyCallingTool = readToolCallStack?.length
    ? readToolCallStack[readToolCallStack.length - 1]
    : undefined;
  const currentlyCallingToolArguments = currentlyCallingTool?.function.arguments
    ? JSON.parse(currentlyCallingTool.function.arguments)
    : undefined;
  const currentlyCallingString = currentlyCallingTool
    ? `Calling ${currentlyCallingTool.function.name}${
        currentlyCallingTool.function.name === "list_issues" &&
        currentlyCallingToolArguments &&
        "query" in currentlyCallingToolArguments
          ? ` with query "${currentlyCallingToolArguments.query}"`
          : ""
      }...`
    : "Thinking...";

  const [userMessage, setUserMessage] = useState<string>("");
  const [inputFocused, setInputFocused] = useState<boolean>(false);

  const sendDisabled =
    userMessage.trim() === "" || messages[messages.length - 1]?.role === "user";

  function handleSendMessage() {
    if (!sendDisabled) {
      getResponse(userMessage);
      setUserMessage("");
    }
  }

  return (
    <div className="w-full h-full max-w-content-max-width px-4">
      <div className="flex flex-col gap-4 items-center justify-center w-full h-full py-10">
        <ResetButton />
        <Step
          label={"Transcribing File"}
          loading={transcriptLoading}
          start={
            file !== undefined &&
            !transcript &&
            !localStorage.getItem("transcript")
          }
          error={transcriptError}
          fn={transcribeFile}
          complete={transcript !== undefined && !transcriptError}
        />
        <Step
          label={"Getting Linear Workspace Data"}
          loading={linearLoading}
          start={transcript !== undefined && messages.length === 1}
          error={linearError}
          fn={fetchLinearData}
          complete={
            users !== undefined &&
            projects !== undefined &&
            teams !== undefined &&
            !linearError
          }
        />
        <Step
          label={"Generating Linear Action Items"}
          loading={messagesLoading}
          start={
            users !== undefined &&
            projects !== undefined &&
            teams !== undefined &&
            messages.length === 1
          }
          error={messagesError}
          fn={getResponse}
          complete={messages.length > 1 && !messagesError}
          additionalMessage={
            messages.length > 1 ? undefined : currentlyCallingString
          }
        />
        {awaitingResponse && (
          <div className="flex flex-col h-full w-full justify-between pt-4">
            <div className="flex flex-col gap-4 w-full max-h-full overflow-y-auto">
              {messages
                .filter(
                  (message, index) =>
                    index > 0 &&
                    (typeof message.content === "string" ||
                      message.content?.some(
                        (content) => content.type === "text"
                      )) &&
                    (message.role === "assistant" || message.role === "user")
                )
                .map((message, index) => {
                  return (
                    <div
                      className={`max-w-full w-fit overflow-y-auto rounded-md p-4 ${
                        message.role === "assistant"
                          ? "bg-gray-800 self-start"
                          : "bg-primary self-end"
                      }`}
                      key={index}
                    >
                      {typeof message.content === "string" ? (
                        <p key={index}>{message.content}</p>
                      ) : (
                        message.content
                          ?.filter((content) => content.type === "text")
                          .map((content, idx) => (
                            <p key={idx}>{content.text}</p>
                          ))
                      )}
                    </div>
                  );
                })}
            </div>
            <div
              className={`flex items-center p-2 pr-3 rounded-full bg-gray-900 border ${
                inputFocused ? "border-primary" : "border-gray-700"
              }`}
            >
              <input
                type="text"
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                className="w-full text-white px-4 outline-none"
                placeholder="Send Message..."
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSendMessage();
                  }
                }}
              />
              <Button
                onClick={handleSendMessage}
                additionalClasses="!p-2 rounded-full"
                disabled={sendDisabled}
              >
                <UpArrowIcon className="w-6 h-6 fill-white" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Step = ({
  label,
  start,
  loading,
  fn,
  error,
  complete,
  additionalMessage,
}: Step) => {
  useEffect(() => {
    if (start && !loading && !error && !complete) {
      fn();
    }
  }, [start, loading, error]);

  return (
    <>
      {(loading || complete || error) && (
        <div className="flex flex-col gap-2 items-center text-center">
          <div className="flex gap-2 items-center">
            {loading && <ClipLoader color="white" size={16} />}
            {/* TODO: Switch to icons */}
            {complete && <p className="text-gray-500">✓</p>}
            {error && <p className="text-red-500">❌</p>}
            <p className={`${complete ? "text-gray-500" : "text-white"}`}>
              {label}
            </p>
          </div>
          {error && <p className="text-red-500">{error.message}</p>}
          {additionalMessage && (
            <p className="text-gray-500">{additionalMessage}</p>
          )}
        </div>
      )}
    </>
  );
};

export default Progress;
