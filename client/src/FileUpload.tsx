import { useEffect, useState } from "react";
import {
  type FileRejection,
  type FileWithPath,
  useDropzone,
} from "react-dropzone";
import Button from "./components/Button";
import toast from "react-hot-toast";
import { useFileContext } from "./contexts/FileContext";
import UploadIcon from "./assets/upload.svg?react";
import CloseIcon from "./assets/close.svg?react";
import MicrophoneIcon from "./assets/microphone.svg?react";
import StopRecordingIcon from "./assets/stop-recording.svg?react";
import WarningIcon from "./assets/warning.svg?react";

function FileUpload() {
  const { setFile } = useFileContext();

  const browserSupportsRecording = Boolean(
    navigator.mediaDevices && navigator.mediaDevices.getUserMedia
  );

  const [localFile, setLocalFile] = useState<FileWithPath>();
  const [recording, setRecording] = useState<boolean>(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );

  const { getInputProps, getRootProps, isDragActive } = useDropzone({
    accept: {
      "audio/aac": [".aac"],
      "audio/mpeg": [".mp3"],
      "audio/ogg": [".oga", ".opus"],
      "audio/wav": [".wav"],
      "audio/webm": [".weba"],
      "text/markdown": [".md"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
    onDrop: (
      acceptedFiles: readonly FileWithPath[],
      fileRejections: FileRejection[]
    ) => {
      if (fileRejections.length > 0) {
        toast.error(`Unsupported file type`);
        return;
      }
      setLocalFile(acceptedFiles[0]);
    },
    disabled: localFile !== undefined || recording,
  });

  function handleSubmitTranscript() {
    if (!localFile) return;
    setFile(localFile);
  }

  async function handleRecord() {
    if (!browserSupportsRecording) {
      toast.error("Your browser does not support audio recording.");
      return;
    }

    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: {
        // @ts-ignore
        suppressLocalAudioPlayback: false,
      },
      systemAudio: "include",
    });

    const audioStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });

    const audioContext = new AudioContext();
    const screenSource = audioContext.createMediaStreamSource(screenStream);
    const audioSource = audioContext.createMediaStreamSource(audioStream);
    const destination = audioContext.createMediaStreamDestination();
    screenSource.connect(destination);
    audioSource.connect(destination);

    const combinedStream = new MediaStream([
      ...destination.stream.getAudioTracks(),
    ]);

    const mediaRecorder = new MediaRecorder(combinedStream);

    mediaRecorder.ondataavailable = (event) => {
      console.log("Audio data available:", event);
      const audioBlob = new Blob([event.data], {
        type: "audio/weba",
      });
      const audioFile = new File([audioBlob], "recorded-audio.weba", {
        type: "audio/weba",
      });
      setLocalFile(audioFile);
      toast.success("Audio recorded successfully!");
    };

    setMediaRecorder(mediaRecorder);
    setRecording(true);
    mediaRecorder.start();
  }

  async function handleStopRecording() {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setRecording(false);
      setMediaRecorder(null);
    }
  }

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (recording) {
      timer = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedTime(0);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [recording]);

  return (
    <div className="w-full h-full flex justify-center items-center px-4">
      <div className="max-w-content-max-width w-full h-full flex flex-col items-center justify-center gap-15 text-center">
        <h1 className="text-4xl underline decoration-primary">
          Convert a meeting into tasks with AI
        </h1>
        <div className="w-full flex flex-col items-center gap-8">
          {browserSupportsRecording && (
            <>
              <div className="flex flex-col items-center gap-4 w-full">
                <Button
                  additionalClasses="!gap-1.5 !py-3 w-fit"
                  onClick={recording ? handleStopRecording : handleRecord}
                >
                  {recording ? (
                    <>
                      <StopRecordingIcon fill="white" />
                      <span>Recording</span>
                      <span className="ml-2 text-gray-200">
                        {String(Math.floor(elapsedTime / 60)).padStart(2, "0")}:
                        {String(elapsedTime % 60).padStart(2, "0")}
                      </span>
                    </>
                  ) : (
                    <>
                      <MicrophoneIcon fill="white" />
                      <span>Record Audio</span>
                    </>
                  )}
                </Button>
                {!window.navigator.platform.includes("Win") && (
                  <div className="max-w-[500px] flex items-center gap-4 p-4 bg-yellow-500/10 rounded-md text-white text-left">
                    <WarningIcon className="min-w-5 w-5 min-h-5 h-5 fill-yellow-500" />
                    <p className="text-sm">
                      Only supports system audio from a single Chrome tab on
                      Mac. If you'd like to record another app, consider using
                      another recording tool and uploading the file.
                    </p>
                  </div>
                )}
              </div>
              <p className="text-gray-500">OR</p>
            </>
          )}
          <div
            {...getRootProps()}
            className={`w-full p-10 flex flex-col items-center gap-10 border-2 border-dashed border-gray-300 rounded-md transition-all duration-100 ${
              !localFile && !recording && "hover:bg-gray-800 cursor-pointer"
            }`}
          >
            <input {...getInputProps()} />
            {/* TODO: Add upload icon */}
            <UploadIcon fill="white" scale={72} />
            {!localFile && (
              <div className="flex flex-col gap-2">
                <h3 className="text-xl text-gray-200">
                  {isDragActive
                    ? "Drop the file here"
                    : "Upload Audio or Transcription file"}
                </h3>
                <p className="text-gray-400 text-sm">
                  Supported file types: .aac, .mp3, .oga, .opus, .wav, .weba,
                  .md, .txt
                </p>
              </div>
            )}
            {localFile && (
              <div className="flex gap-5 items-center rounded-full bg-gray-700 pl-4 pr-3 py-2 text-sm">
                {localFile.name}
                <button
                  onClick={() => setLocalFile(undefined)}
                  className="rounded-full bg-white cursor-pointer hover:bg-gray-200 p-0.5"
                >
                  <CloseIcon className="fill-gray-800 w-5 h-5" />
                </button>
              </div>
            )}
          </div>
          <Button
            disabled={!localFile}
            additionalClasses="w-full py-3"
            onClick={handleSubmitTranscript}
          >
            Generate Linear Action Items
          </Button>
        </div>
      </div>
    </div>
  );
}

export default FileUpload;
