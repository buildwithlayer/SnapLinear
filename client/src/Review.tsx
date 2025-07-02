import { useState } from 'react';
import { ClipLoader } from 'react-spinners';
import CommentsIcon from './assets/comments.svg?react';
import IssuesIcon from './assets/issues.svg?react';
import Comments from './Comments';
import ResetButton from './components/ResetButton';
import { useCommentsContext } from './contexts/CommentsContext';
import { useIssuesContext } from './contexts/IssuesContext';
import Issues from './Issues';

const Review = () => {
  const { issuesLoading, unreviewedIssues } = useIssuesContext();
  const { commentsLoading, unreviewedComments } = useCommentsContext();

  const [activeTab, setActiveTab] = useState<'comments' | 'issues'>('issues');

  return (
    <div className="flex flex-col items-center w-full h-full max-h-full">
      <div className="flex justify-center items-center w-full border-b border-gray-900 px-4">
        <div className="flex justify-between gap-3 items-center w-full h-full max-w-content-max-width py-4">
          <div className="flex gap-3">
            <TabButton
              label="Issues"
              onClick={() => setActiveTab('issues')}
              active={activeTab === 'issues'}
              count={Object.keys(unreviewedIssues).length}
              icon={<IssuesIcon className="w-6 h-6 fill-gray-300" />}
              loading={issuesLoading}
            />
            <TabButton
              label="Comments"
              onClick={() => setActiveTab('comments')}
              active={activeTab === 'comments'}
              count={Object.keys(unreviewedComments).length}
              icon={<CommentsIcon className="w-6 h-6 fill-gray-300" />}
              loading={commentsLoading}
            />
          </div>
          <ResetButton />
        </div>
      </div>
      <div className="flex justify-center items-center w-full h-full max-h-full px-4 overflow-y-auto">
        <div className="flex w-full h-full max-h-full max-w-content-max-width py-8">
          {activeTab === 'issues' && <Issues />}
          {activeTab === 'comments' && <Comments />}
        </div>
      </div>
    </div>
  );
};

interface TabButtonProps {
  active: boolean;
  count: number;
  icon: React.ReactNode;
  label: string;
  loading: boolean;
  onClick: () => void;
}

const TabButton = ({
  active,
  count,
  icon,
  label,
  loading,
  onClick,
}: TabButtonProps) => {
  return (
    <div
      onClick={onClick}
      className={`w-fit cursor-pointer px-3 py-2 rounded-md flex items-center gap-3 md:gap-5 border border-gray-850 ${
        active ? 'bg-gray-900 text-white' : 'text-gray-300'
      }`}
    >
      <div className="flex gap-2 items-center">
        <div className="hidden md:block">{icon}</div>
        <p>{label}</p>
      </div>
      {loading ? (
        <ClipLoader size={12} color={'white'} />
      ) : (
        <p className="font-mono text-gray-500">{count}</p>
      )}
    </div>
  );
};

export default Review;
