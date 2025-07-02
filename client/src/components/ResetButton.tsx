import RestartIcon from '../assets/restart.svg?react';
import Button from './Button';

const ResetButton = () => {
  const handleReset = () => {
    [
      'transcript',
      'messages',
      'incompleteToolCalls',
      'issueToolCalls',
      'approvedIssues',
      'rejectedIssues',
      'commentToolCalls',
      'approvedComments',
      'rejectedComments',
      'linear_users',
      'linear_projects',
      'linear_teams',
    ].forEach((k) => localStorage.removeItem(k));

    window.location.reload();
  };

  return (
    <Button
      onClick={handleReset}
      style="outlined"
      additionalClasses="px-2 py-1 !gap-2"
    >
      <RestartIcon className="w-5 h-5 fill-primary" />
      <p className="hidden md:block">Restart</p>
    </Button>
  );
};

export default ResetButton;
