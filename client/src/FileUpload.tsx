import {useState} from 'react';
import {
    type FileRejection,
    type FileWithPath,
    useDropzone,
} from 'react-dropzone';
import toast from 'react-hot-toast';
import DeleteIcon from './assets/delete.svg?react';
import FileIcon from './assets/file.svg?react';
import UploadIcon from './assets/upload.svg?react';
import WarningIcon from './assets/warning.svg?react';
import Button from './components/Button';
import PasteInput from './components/PasteInput';
import RecordButton from './components/RecordButton';
import {useFileContext} from './contexts/FileContext';

function FileUpload({demo, splitTestVersion}: {demo: boolean, splitTestVersion?: string}) {
    const {setFile} = useFileContext();

    const browserSupportsRecording = Boolean(
        navigator.mediaDevices && navigator.mediaDevices.getUserMedia,
    );

    const [localFile, setLocalFile] = useState<FileWithPath>();
    const [recording, setRecording] = useState<boolean>(false);

    const {getInputProps, getRootProps, isDragActive} = useDropzone({
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

    function handleSubmitText(text: string) {
        const blob = new Blob([text], {type: 'text/plain'});
        const file = new File([blob], 'transcript.txt', {type: 'text/plain'});
        setFile(file);
    }

    return (
        <>
            <div className="w-full flex flex-col items-center justify-center gap-4">
                {localFile ? (
                    <>
                        {/* File Uploaded */}
                        {localFile && (
                            <div
                                className="w-full flex gap-6 justify-between items-center rounded-md bg-gray-700 pl-4 pr-3 py-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <FileIcon className="w-6 h-6 fill-white"/>
                                    <span className="text-left">{localFile.name}</span>
                                </div>
                                <button
                                    onClick={() => setLocalFile(undefined)}
                                    className="rounded-full hover:bg-white/10 cursor-pointer p-1"
                                >
                                    <DeleteIcon className="fill-white w-6 h-6"/>
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
                        {!demo && (<><PasteInput handleSubmit={handleSubmitText} /><p className='text-gray-600 font-medium'>OR</p></>)}
                        <div className="w-full flex flex-col md:flex-row items-center justify-center gap-4">
                            <div className="w-full flex flex-col gap-4">
                                {demo && recording && (<p className='text-xl text-center px-2 py-4 rounded-sm bg-gray-900 border border-gray-800'>Try saying <span className='text-emerald-300'>"Create me a task called try out SnapLinear"</span></p>)}
                                {browserSupportsRecording && (
                                    <RecordButton
                                        isRecording={recording}
                                        setIsRecording={setRecording}
                                        handleRecordingComplete={demo ? setFile : setLocalFile}
                                        splitTestVersion={splitTestVersion}
                                    />
                                )}
                            </div>
                            {!demo && (
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
                                </div>)}
                        </div>
                        {/* Recording disclaimer */}
                        {!demo && browserSupportsRecording &&
                            !window.navigator.platform.includes('Win') && (
                            <div
                                className={`w-full flex items-center gap-4 p-4 bg-yellow-500/10 rounded-md text-white ${demo ? 'text-center': 'text-left'}`}>
                                <WarningIcon className="min-w-5 w-5 min-h-5 h-5 fill-yellow-500"/>
                                <p className='text-sm text-gray-300 w-full'>
                                        Only records microphone audio. To capture system audio, record with
                                        another tool (e.g., Zoom, OBS) and upload the file here.
                                </p>
                            </div>
                        )}
                        {demo && <p className='text-gray-300'>Want to upload an existing audio file or transcript? <a href="/" className="text-primary hover:text-primary-dark">Click here</a></p>}
                    </>
                )}
            </div>
        </>
    );
}

export default FileUpload;
