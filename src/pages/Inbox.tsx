import React from 'react';
import InboxView from '../components/Inbox/InboxView';

const InboxPage: React.FC = () => {
  return (
    <div className="flex-1 w-full h-full flex flex-col min-h-0 bg-gray-50 dark:bg-[#13111C] overflow-hidden">
      <InboxView />
    </div>
  );
};

export default InboxPage;
