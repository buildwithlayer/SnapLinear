import { CommentsProvider } from "./contexts/CommentsContext";
import { useFileContext } from "./contexts/FileContext";
import { IssuesProvider } from "./contexts/IssuesContext";
import { LinearProvider } from "./contexts/LinearContext";
import { McpProvider } from "./contexts/McpContext";
import { MessagesContext, MessagesProvider } from "./contexts/MessagesContext";
import { useTranscriptContext } from "./contexts/TranscriptContext";
import LandingPage from "./LandingPage";
import Progress from "./Progress";
import Review from "./Review";

const Content = () => {
  const { file } = useFileContext();
  const { transcript } = useTranscriptContext();

  return (
    <div className="w-full h-full flex justify-center bg-gray-950 text-white overflow-hidden">
      {!file && !transcript && <LandingPage />}
      {(file || transcript) && (
        <McpProvider>
          <LinearProvider>
            <MessagesProvider>
              <MessagesContext.Consumer>
                {({ incompleteToolCalls }) => (
                  <>
                    {incompleteToolCalls.length > 0 ? (
                      <IssuesProvider>
                        <CommentsProvider>
                          <Review />
                        </CommentsProvider>
                      </IssuesProvider>
                    ) : (
                      <Progress />
                    )}
                  </>
                )}
              </MessagesContext.Consumer>
            </MessagesProvider>
          </LinearProvider>
        </McpProvider>
      )}
    </div>
  );
};

export default Content;
