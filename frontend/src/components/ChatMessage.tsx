import React from 'react';

interface ChatMessageProps {
  text: string;
  author: string;
  isMe: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ text, author, isMe }) => {
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
        <span className="text-[15px] leading-relaxed break-words">{text}</span>
        <span className="text-xs text-slate-400 mt-1 text-right font-medium" style={{ fontSize: '12px' }}>{author}</span>
      </div>
    </div>
  );
};

export default ChatMessage;
