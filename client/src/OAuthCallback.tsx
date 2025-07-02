import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { onMcpAuthorization } from 'use-mcp';

function OAuthCallback() {
  useEffect(() => {
    onMcpAuthorization().catch((err) => {
      console.error(err);
      toast.error(err.message);
    });
  }, []);

  return (
    <div className="w-full h-full flex justify-center items-center px-4 bg-gray-900 text-white">
      <div className="w-full h-full max-w-content-max-width flex flex-col items-center justify-center gap-2">
        <h1>Authenticating...</h1>
        <p>This window should close automatically.</p>
      </div>
    </div>
  );
}

export default OAuthCallback;
