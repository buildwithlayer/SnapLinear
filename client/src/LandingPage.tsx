import FileUpload from './FileUpload';

const LandingPage = () => {
  return (
    <>
      <div className="w-full h-full flex flex-col justify-start items-center overflow-auto">
        <div className="w-full flex flex-col justify-center items-center px-4 bg-gray-900 text-center md:text-left">
          <div className="max-w-content-max-width w-full flex flex-col gap-12 py-[72px]">
            {/* Hero Section */}
            <div className="flex flex-col gap-4">
              <h1 className="text-4xl font-bold">
                Convert Meetings to Actions With AI
              </h1>
              <h2 className="text-xl text-gray-300">
                Automatically extract action items from meetings and send them
                to Linear — no manual note-taking required.
              </h2>
            </div>
          </div>
        </div>
        <div className="w-full h-full flex flex-col items-center justify-center gap-12 bg-gray-950">
          <div className="w-full h-full flex flex-col justify-center items-center px-4">
            <div className="max-w-content-max-width w-full h-full flex flex-col items-center gap-16 text-center py-[56px]">
              <FileUpload />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-left pb-1">
                <div className="bg-gray-900 p-4 rounded flex flex-col gap-2">
                  <h3 className="font-semibold whitespace-pre">
                    🔍{'  '}Smart Action Item Detection
                  </h3>
                  <p className="text-gray-300">
                    Our AI listens to meetings or reads transcripts to identify
                    and extract clear, actionable tasks.
                  </p>
                </div>
                <div className="bg-gray-900 p-4 rounded flex flex-col gap-2">
                  <h3 className="font-semibold whitespace-pre">
                    🔄{'  '}Seamless Linear Integration
                  </h3>
                  <p className="text-gray-300">
                    Automatically create Linear issues or comments directly from
                    your meeting content — no copy-paste needed.
                  </p>
                </div>
                <div className="bg-gray-900 p-4 rounded flex flex-col gap-2">
                  <h3 className="font-semibold whitespace-pre">
                    🔐{'  '}Private & Secure
                  </h3>
                  <p className="text-gray-300">
                    Your audio and text data stay private. We never train on
                    your inputs, and everything is encrypted in transit.
                  </p>
                </div>
                <div className="bg-gray-900 p-4 rounded flex flex-col gap-2">
                  <h3 className="font-semibold whitespace-pre">
                    🎧{'  '}Flexible Input Options
                  </h3>
                  <p className="text-gray-300">
                    Record a meeting directly in your browser or upload your own
                    audio/transcript files (.mp3, .wav, .txt, and more).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LandingPage;
