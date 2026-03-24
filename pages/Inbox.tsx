import React from 'react';
import InboxView from '../components/Inbox/InboxView';

const InboxPage: React.FC = () => {
  return (
    <div className="flex-1 w-full relative h-full bg-gray-50 dark:bg-[#13111C]">
      <div className="absolute inset-0">
        <InboxView />
      </div>
    </div>
  );
};

export default InboxPage;
