import { useEffect, useState } from 'react';
import {
  type FileRejection,
  type FileWithPath,
  useDropzone,
} from 'react-dropzone';
import toast from 'react-hot-toast';
import DeleteIcon from './assets/delete.svg?react';
import FileIcon from './assets/file.svg?react';
import MicrophoneIcon from './assets/microphone.svg?react';
import StopRecordingIcon from './assets/stop-recording.svg?react';
import UploadIcon from './assets/upload.svg?react';
import WarningIcon from './assets/warning.svg?react';
import Button from './components/Button';
import { useFileContext } from './contexts/FileContext';

function FileUpload() {
  const { setFile } = useFileContext();

  const browserSupportsRecording = Boolean(
    navigator.mediaDevices && navigator.mediaDevices.getUserMedia,
  );

  const [localFile, setLocalFile] = useState<FileWithPath>();
  const [recording, setRecording] = useState<boolean>(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );

  const { getInputProps, getRootProps, isDragActive } = useDropzone({
    accept: {
      'audio/aac': ['.aac'],
      'audio/mpeg': ['.mp3'],
      'audio/ogg': ['.oga', '.opus'],
      'audio/wav': ['.wav'],
      'audio/webm': ['.weba'],
      'text/markdown': ['.md'],
      'text/plain': ['.txt'],
    },
    disabled: localFile !== undefined || recording,
    maxFiles: 1,
    onDrop: (
      acceptedFiles: readonly FileWithPath[],
      fileRejections: FileRejection[],
    ) => {
      if (fileRejections.length > 0) {
        toast.error('Unsupported file type');
        return;
      }
      setLocalFile(acceptedFiles[0]);
    },
  });

  function handleSubmitTranscript() {
    if (!localFile) return;
    setFile(localFile);
  }

  async function handleRecord() {
    if (!browserSupportsRecording) {
      toast.error('Your browser does not support audio recording.');
      return;
    }

    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      audio: {
        // @ts-expect-error This isn't included in the type definition
        suppressLocalAudioPlayback: false,
      },
      systemAudio: 'include',
      video: true,
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
      console.log('Audio data available:', event);
      const audioBlob = new Blob([event.data], {
        type: 'audio/weba',
      });
      const audioFile = new File([audioBlob], 'recorded-audio.weba', {
        type: 'audio/weba',
      });
      setLocalFile(audioFile);
      toast.success('Audio recorded successfully!');
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
    <>
      <div className="w-full flex flex-col items-center justify-center gap-4">
        {localFile ? (
          <>
            {/* File Uploaded */}
            {localFile && (
              <div className="w-full flex gap-6 justify-between items-center rounded-md bg-gray-700 pl-4 pr-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <FileIcon className="w-6 h-6 fill-white" />
                  <span className="text-left">{localFile.name}</span>
                </div>
                <button
                  onClick={() => setLocalFile(undefined)}
                  className="rounded-full hover:bg-white/10 cursor-pointer p-1"
                >
                  <DeleteIcon className="fill-white w-6 h-6" />
                </button>
              </div>
            )}
            <Button
              disabled={!localFile}
              additionalClasses="w-full py-3"
              onClick={handleSubmitTranscript}
            >
              Generate Linear Action Items
            </Button>
          </>
        ) : (
          <>
            <div className="w-full flex flex-col md:flex-row items-center justify-center gap-4">
              {browserSupportsRecording && (
                <Button
                  additionalClasses="!gap-1.5 !py-3 w-full"
                  onClick={recording ? handleStopRecording : handleRecord}
                >
                  {recording ? (
                    <>
                      <StopRecordingIcon fill="white" />
                      <span>Recording</span>
                      <span className="ml-2 text-gray-200">
                        {String(Math.floor(elapsedTime / 60)).padStart(2, '0')}:
                        {String(elapsedTime % 60).padStart(2, '0')}
                      </span>
                    </>
                  ) : (
                    <>
                      <MicrophoneIcon fill="white" />
                      <span>Record Audio</span>
                    </>
                  )}
                </Button>
              )}
              <div
                {...getRootProps()}
                className="w-full flex items-center justify-center"
              >
                <input {...getInputProps()} />
                <Button
                  additionalClasses="!gap-1.5 !py-3 w-full"
                  disabled={recording}
                >
                  <UploadIcon
                    className={`w-6 h-6 ${
                      recording ? 'fill-gray-800' : 'fill-white'
                    }`}
                  />
                  <span>
                    {isDragActive
                      ? 'Drop the file here'
                      : 'Upload Audio or Transcript'}
                  </span>
                </Button>
              </div>
            </div>
            {/* Recording disclaimer */}
            {browserSupportsRecording &&
              !window.navigator.platform.includes('Win') && (
                <div className="flex items-center gap-4 p-4 bg-yellow-500/10 rounded-md text-white text-left">
                  <WarningIcon className="min-w-5 w-5 min-h-5 h-5 fill-yellow-500" />
                  <p className="text-sm text-gray-300">
                    Only Chrome tab audio is supported on Mac for direct
                    recording. To capture meetings in other apps, record with
                    another tool (e.g., Zoom, OBS) and upload the file here.
                  </p>
                </div>
              )}
          </>
        )}
      </div>
    </>
  );
}

export default FileUpload;
