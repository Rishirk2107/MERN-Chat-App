import React from 'react';
import { useSocket } from '../contexts/SocketContext';

const IncomingCallModal: React.FC = () => {
    const { incomingCall, acceptCall, declineCall } = useSocket();

    if (!incomingCall) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[9999]">
            <div className="absolute inset-0 bg-black/50" onClick={declineCall} />
            <div className="relative bg-white dark:bg-slate-800 text-black dark:text-white rounded-lg p-6 shadow-lg w-full max-w-sm z-10">
                <div className="text-lg font-semibold mb-3">Incoming call</div>
                <div className="mb-4">📞 {incomingCall.name} is calling you</div>
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={declineCall}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                    >
                        Decline
                    </button>
                    <button
                        onClick={acceptCall}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                    >
                        Accept
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IncomingCallModal;
