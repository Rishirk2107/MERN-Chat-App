import React from 'react';

interface ChatMessageProps {
  text?: string;
  file?: {
    url?: string;
    originalName?: string;
    resourceType?: string;
    format?: string;
    bytes?: number;
  };
  author: string;
  isMe: boolean;
  deliveredAt?: string | null;
  readAt?: string | null;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ text, file, author, isMe, deliveredAt, readAt }) => {
  return (
    <div className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-[60%] rounded-xl px-4 py-2 shadow-sm flex flex-col ${
          isMe
            ? 'bg-cyan-900/80 text-white self-end'
            : 'bg-slate-800 text-slate-100 self-start'
        }`}
        style={{ borderRadius: '16px', borderBottomRightRadius: isMe ? '6px' : '16px', borderBottomLeftRadius: !isMe ? '6px' : '16px' }}
      >
        {file ? (
          <div className="break-words">
            {file.resourceType === 'image' ? (
              <img src={file.url} alt={file.originalName} className="max-w-full rounded-md" />
            ) : file.resourceType === 'video' ? (
              <video controls className="max-w-full rounded-md">
                <source src={file.url} type={`video/${file.format || 'mp4'}`} />
                Your browser does not support the video tag.
              </video>
            ) : (
              <a href={file.url} target="_blank" rel="noreferrer" className="underline text-cyan-200">{file.originalName || 'Download file'}</a>
            )}
            {file.bytes ? <div className="text-xs text-slate-400 mt-1">{(file.bytes / 1024).toFixed(1)} KB</div> : null}
          </div>
        ) : (
          <span className="text-[15px] leading-relaxed break-words">{text}</span>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-slate-400 font-medium" style={{ fontSize: '12px' }}>{author}</span>
          {isMe ? (
            <div className="text-xs text-slate-300" style={{ fontSize: '11px' }}>
              {readAt ? (
                <span title={`Read at ${new Date(readAt).toLocaleString()}`}>✓✓</span>
              ) : deliveredAt ? (
                <span title={`Delivered at ${new Date(deliveredAt).toLocaleString()}`}>✓</span>
              ) : (
                <span>⏳</span>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
