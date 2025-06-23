import {useEffect, useRef, useState} from 'react';
import AssemblyClient from './AssemblyClient';
import {createMicrophone, type Microphone} from './microphone';
import {Settings} from './Settings';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://hono-mcp-production.up.railway.app';
const SETTINGS_STORAGE_KEY = 'mcp-flow-settings';

interface ToolCall {
    function: {
        arguments: string;
        name: string;
    };
    id: string;
    type: 'function';
}

interface ChatMessage {
    content: any;
    role: 'assistant' | 'system' | 'tool' | 'user';
}

interface SettingsState {
    apiKey: string;
    serverUrl: string;
}

const defaultSettings: SettingsState = {
    apiKey: '',
    serverUrl: '',
};

function MyApp() {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('Click start to begin recording!');
    const [error, setError] = useState<string | null>(null);
    const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
    const [isProcessingChat, setIsProcessingChat] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [showSettings, setShowSettings] = useState(false);
    const [settings, setSettings] = useState<SettingsState>(defaultSettings);

    const assemblyClientRef = useRef<AssemblyClient | null>(null);
    const microphoneRef = useRef<Microphone | null>(null);

    useEffect(() => {
        try {
            const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
            if (savedSettings) {
                const parsedSettings = JSON.parse(savedSettings);
                setSettings({...defaultSettings, ...parsedSettings});
            }
        } catch (error) {
            console.error('Failed to load settings from localStorage:', error);
            // If there's an error, use default settings
            setSettings(defaultSettings);
        }
    }, []);

    const handleSettingsChange = (newSettings: SettingsState) => {
        console.log('Settings saved:', newSettings);
        setSettings(newSettings);

        // Save to localStorage
        try {
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
            console.log('Settings saved to localStorage');
        } catch (error) {
            console.error('Failed to save settings to localStorage:', error);
            setError('Failed to save settings to local storage');
        }

        setError(null);
    };

    const startRecording = async () => {

        setChatMessages([]);

        try {
            setError(null);

            // Create microphone
            microphoneRef.current = createMicrophone();
            await microphoneRef.current.requestPermission();

            // Create AssemblyAI client with API key from settings
            assemblyClientRef.current = new AssemblyClient({
                apiKey: settings.apiKey,
                onConnected: () => {
                    console.log('Connected to AssemblyAI!');
                    // Start recording audio once connected
                    microphoneRef.current?.startRecording((audioChunk) => {
                        assemblyClientRef.current?.sendAudio(audioChunk);
                    });
                },
                onDisconnected: () => {
                    console.log('Disconnected from AssemblyAI');
                },
                onError: (error) => {
                    setError(error);
                    setIsRecording(false);
                },
                onTranscription: (transcript) => {
                    setTranscript(transcript);
                },
            });

            await assemblyClientRef.current.connect();
            setIsRecording(true);
            setTranscript('Connected! Speak now...');

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            console.error('Failed to start recording:', errorMessage);
        }
    };

    const stopRecording = () => {
        if (assemblyClientRef.current) {
            assemblyClientRef.current.stop();
            assemblyClientRef.current = null;
        }

        if (microphoneRef.current) {
            microphoneRef.current.stopRecording();
            microphoneRef.current = null;
        }

        setIsRecording(false);
    };

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const sendToChat = async () => {
        if (!transcript || transcript === 'Click start to begin recording!' || transcript === 'Connected! Speak now...') {
            setError('No transcript available to send');
            return;
        }

        setIsProcessingChat(true);
        setError(null);
        setToolCalls([]);

        try {
            const messages: ChatMessage[] = [
                ...chatMessages,
                {content: transcript, role: 'user'},
            ];

            setChatMessages(messages);

            const response = await fetch(`${BASE_URL}/api/chat`, {
                body: JSON.stringify({
                    messages,
                    serverConfig: {
                        // Use serverUrl from settings
                        headers: {}, url: settings.serverUrl,
                    },
                }),
                headers: {
                    'Content-Type': 'application/json',
                },
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('No response body');
            }

            const chunks: string[] = [];

            while (true) {
                const {done, value} = await reader.read();
                if (done) break;

                const string = new TextDecoder().decode(value);
                chunks.push(string);

                console.log('Received chunk:', string);
            }

            // Parse the final response to extract tool calls
            try {
                const finalResponse = JSON.parse(chunks[chunks.length - 1]);
                console.log('Final response:', finalResponse);

                if (finalResponse.messages) {
                    // Look for tool calls in the assistant messages
                    finalResponse.messages.forEach((message: ChatMessage) => {

                        setChatMessages(prev => [...prev, message]);

                        if (message.role === 'assistant' && Array.isArray(message.content)) {
                            const toolCallItems = message.content.filter((item: any) => item.type === 'tool-call');
                            if (toolCallItems.length > 0) {
                                console.log('Tool calls detected:', toolCallItems);
                                const newToolCalls = toolCallItems.map((item: any) => ({
                                    function: {
                                        arguments: JSON.stringify(item.args),
                                        name: item.toolName,
                                    },
                                    id: item.toolCallId,
                                    type: 'function' as const,
                                }));

                                setToolCalls(newToolCalls);
                                console.log('Updated tool calls:', newToolCalls);
                            }
                        }
                    });
                }
            } catch (error) {
                console.error('Failed to parse final response:', error);
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(`Failed to send to chat: ${errorMessage}`);
            console.error('Failed to send to chat:', errorMessage);
        } finally {
            setIsProcessingChat(false);
        }
    };

    const approveToolCalls = async (approvedIds: string[]) => {
        setIsProcessingChat(true);
        setError(null);

        try {
            const reader = await fetch(`${BASE_URL}/api/chat/tool-call-approvals`, {
                body: JSON.stringify({
                    approvedToolCallIds: approvedIds,
                    messages: chatMessages,
                    serverConfig: {
                        headers: {},
                        url: settings.serverUrl,
                    },
                }),
                headers: {
                    'Content-Type': 'application/json',
                },
                method: 'POST',
            })
                .then((res) => {
                    if (!res.ok) {
                        throw new Error('Failed to fetch response');
                    }
                    return res.body?.getReader();
                })
                .catch((error) => {
                    console.error('Error fetching response:', error);
                    return null;
                });

            if (!reader) {
                console.error('Failed to get reader from response');
                return;
            }

            const chunks: string[] = [];

            while (true) {
                const {done, value} = await reader.read();
                if (done) break;

                const string = new TextDecoder().decode(value);
                chunks.push(string);

                console.log('Received chunk:', string);
            }

            try {
                const finalResponse = JSON.parse(chunks[chunks.length - 1]);
                console.log('Tool approval final response:', finalResponse);

                // Update chat messages with the response
                if (finalResponse.messages) {
                    setChatMessages(prev => [...prev, ...finalResponse.messages]);
                }
            } catch (error) {
                console.error('Failed to parse final response:', error);
                return;
            }

            // Clear tool calls after approval
            setToolCalls([]);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(`Failed to execute tool calls: ${errorMessage}`);
            console.error('Failed to execute tool calls:', errorMessage);
        } finally {
            setIsProcessingChat(false);
        }
    };

    return (
        <div className="App" style={{
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            justifyContent: 'center',
            width: '100vw',
        }}>
            <h1 style={{color: 'white'}}>🎤 MCP Flow</h1>

            <div style={{display: 'flex', gap: '10px', justifyContent: 'center', margin: '20px 0'}}>
                <button
                    onClick={toggleRecording}
                    style={{
                        backgroundColor: isRecording ? '#f44336' : '#4CAF50',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '18px',
                        padding: '20px 40px',
                    }}
                >
                    {isRecording ? 'Stop Recording' : 'Start Recording'}
                </button>

                <button
                    onClick={sendToChat}
                    disabled={isProcessingChat || !transcript || transcript === 'Click start to begin recording!' || transcript === 'Connected! Speak now...'}
                    style={{
                        backgroundColor: isProcessingChat ? '#757575' : '#2196F3',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        cursor: isProcessingChat ? 'not-allowed' : 'pointer',
                        fontSize: '18px',
                        opacity: isProcessingChat ? 0.6 : 1,
                        padding: '20px 40px',
                    }}
                >
                    {isProcessingChat ? 'Processing...' : 'Send to Chat'}
                </button>

                <button
                    onClick={() => setShowSettings(!showSettings)}
                    style={{
                        backgroundColor: '#FF9800',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '18px',
                        padding: '20px 40px',
                    }}
                >
                    ⚙️ Settings
                </button>
            </div>

            {showSettings && (
                <>
                    <div style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                        bottom: 0,
                        left: 0,
                        position: 'fixed',
                        right: 0,
                        top: 0,
                        zIndex: 999,
                    }} onClick={() => setShowSettings(false)}/>
                    <div style={{
                        backgroundColor: '#1a1a1a',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
                        left: '50%',
                        maxWidth: '600px',
                        padding: '20px',
                        position: 'fixed',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '50%',
                        zIndex: 1000,
                    }}>
                        <button
                            onClick={() => setShowSettings(false)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '20px',
                                position: 'absolute',
                                right: '10px',
                                top: '10px',
                            }}
                        >
                            ✕
                        </button>
                        <Settings onChange={handleSettingsChange} settings={settings}/>
                    </div>
                </>
            )}

            {error && (
                <div style={{
                    backgroundColor: '#ffebee',
                    border: '1px solid #f8bbd9',
                    borderRadius: '4px',
                    color: '#c62828',
                    margin: '10px 0',
                    padding: '10px',
                }}>
                    Error: {error}
                </div>
            )}

            <div style={{
                backgroundColor: '#000000',
                borderRadius: '8px',
                margin: '20px 0',
                minHeight: '100px',
                padding: '20px',
                textAlign: 'left',
                width: '50%',
            }}>
                <h3>Transcript:</h3>

                <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    style={{
                        backgroundColor: '#000000',
                        border: '1px solid #333',
                        borderRadius: '4px',
                        color: 'white',
                        fontSize: '16px',
                        lineHeight: '1.5',
                        margin: '10px 0',
                        padding: '10px',
                        width: '100%',
                    }}
                />
                <p style={{fontSize: '16px', lineHeight: '1.5'}}>
                    {transcript}
                </p>
            </div>

            {toolCalls.length > 0 && (
                <div style={{
                    backgroundColor: '#1a1a1a',
                    border: '2px solid #4CAF50',
                    borderRadius: '8px',
                    margin: '20px 0',
                    padding: '20px',
                }}>
                    <h3 style={{color: 'white', marginBottom: '15px'}}>🔧 Tool Calls Detected:</h3>
                    {toolCalls.map((toolCall) => (
                        <div key={toolCall.id} style={{
                            backgroundColor: '#2a2a2a',
                            border: '1px solid #444',
                            borderRadius: '6px',
                            marginBottom: '10px',
                            padding: '15px',
                        }}>
                            <div style={{color: '#4CAF50', fontWeight: 'bold', marginBottom: '8px'}}>
                                Function: {toolCall.function.name}
                            </div>
                            <div style={{color: '#ccc', fontFamily: 'monospace', fontSize: '14px'}}>
                                Arguments: {toolCall.function.arguments || '{}'}
                            </div>
                        </div>
                    ))}

                    <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
                        <button
                            onClick={() => approveToolCalls(toolCalls.map(tc => tc.id))}
                            disabled={isProcessingChat}
                            style={{
                                backgroundColor: '#4CAF50',
                                border: 'none',
                                borderRadius: '4px',
                                color: 'white',
                                cursor: isProcessingChat ? 'not-allowed' : 'pointer',
                                opacity: isProcessingChat ? 0.6 : 1,
                                padding: '10px 20px',
                            }}
                        >
                            ✅ Approve All
                        </button>

                        <button
                            onClick={() => setToolCalls([])}
                            disabled={isProcessingChat}
                            style={{
                                backgroundColor: '#f44336',
                                border: 'none',
                                borderRadius: '4px',
                                color: 'white',
                                cursor: isProcessingChat ? 'not-allowed' : 'pointer',
                                opacity: isProcessingChat ? 0.6 : 1,
                                padding: '10px 20px',
                            }}
                        >
                            ❌ Reject All
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MyApp;