import * as amplitude from '@amplitude/analytics-browser';
import {sessionReplayPlugin} from '@amplitude/plugin-session-replay-browser';
import {Toaster} from 'react-hot-toast';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import Content from './Content.tsx';
import {FileProvider} from './contexts/FileContext.tsx';
import {LocalStorageProvider} from './contexts/LocalStorageContext.tsx';
import {TranscriptProvider} from './contexts/TranscriptContext.tsx';
import MenuBar from './MenuBar.tsx';
import OAuthCallback from './OAuthCallback.tsx';
import { useEffect } from 'react';

function App() {
    const sessionReplayTracking = sessionReplayPlugin({sampleRate: 1});
    amplitude.add(sessionReplayTracking);

    amplitude.init('5cc5c6e8863745ef94f222901951ead6', {
        autocapture: {
            elementInteractions: true,
        },
        serverUrl: `${import.meta.env.VITE_API_URL}/api/amplitude`,
    });

    useEffect(() => {
        const identify = new amplitude.Identify();
        identify.setOnce('source', new URL(document.location.toString()).searchParams.get('source') || "unknown");
        amplitude.identify(identify);
    }, []);

    return (
        <div className="flex flex-col h-screen w-screen">
            <LocalStorageProvider>
                <Router>
                    <Routes>
                        <Route path={'/oauth/callback'} element={<OAuthCallback/>}/>
                        <Route
                            path={'/'}
                            element={
                                <FileProvider>
                                    <TranscriptProvider>
                                        <MenuBar/>
                                        <Content demo={false} />
                                    </TranscriptProvider>
                                </FileProvider>
                            }
                        />
                        <Route path={'/demo'} element={<FileProvider>
                            <TranscriptProvider>
                                <Content demo={true} />
                            </TranscriptProvider>
                        </FileProvider>} />
                    </Routes>
                </Router>
            </LocalStorageProvider>
            <Toaster
                position="bottom-right"
                toastOptions={{
                    duration: 3000,
                }}
            />
        </div>
    );
}

export default App;
