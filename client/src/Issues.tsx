import { ClipLoader } from 'react-spinners';
import CalendarIcon from './assets/calendar.svg?react';
import CheckIcon from './assets/check.svg?react';
import DeleteIcon from './assets/delete.svg?react';
import GroupIcon from './assets/group.svg?react';
import PersonIcon from './assets/person.svg?react';
import PriorityHighIcon from './assets/priority-high.svg?react';
import PriorityLowIcon from './assets/priority-low.svg?react';
import PriorityMediumIcon from './assets/priority-medium.svg?react';
import PriorityNoneIcon from './assets/priority-none.svg?react';
import PriorityUrgentIcon from './assets/priority-urgent.svg?react';
import ProjectIcon from './assets/project.svg?react';
import StatusBacklogIcon from './assets/status-backlog.svg?react';
import StatusCancelledIcon from './assets/status-cancelled.svg?react';
import StatusCompletedIcon from './assets/status-completed.svg?react';
import StatusStartedIcon from './assets/status-started.svg?react';
import StatusUnstartedIcon from './assets/status-unstarted.svg?react';
import Button from './components/Button';
import ToolTypeBadge from './components/ToolTypeBadge';
import { useIssuesContext } from './contexts/IssuesContext';
import { useLinearContext } from './contexts/LinearContext';
import {
  baseIssueToCreateIssue,
  type CreateIssue,
  isUpdateIssue,
  type UpdateIssue,
} from './linearTypes';

const Issues = () => {
  const { issuesLoading, unreviewedIssues } = useIssuesContext();
  const { teams } = useLinearContext();

  return (
    <div className="flex flex-col gap-4 items-center w-full h-full">
      {Object.entries(unreviewedIssues).length > 0 ? (
        Object.entries(unreviewedIssues).map(([toolCallId, issue]) => (
          <Issue
            key={toolCallId}
            toolCallId={toolCallId}
            issue={
              isUpdateIssue(issue)
                ? baseIssueToCreateIssue(issue.originalIssue, teams || [])
                : issue
            }
            changes={isUpdateIssue(issue) ? issue : undefined}
          />
        ))
      ) : issuesLoading ? (
        <div className="flex items-center justify-center w-full h-full">
          <ClipLoader size={56} color="white" />
        </div>
      ) : (
        <div className="flex flex-col gap-8 items-center justify-center w-full h-full">
          <p>All issues reviewed</p>
        </div>
      )}
    </div>
  );
};

interface IssueProps {
  changes?: UpdateIssue;
  issue: CreateIssue;
  toolCallId: string;
}

const Issue = ({ changes, issue, toolCallId }: IssueProps) => {
  const { approveIssue, approveLoading, rejectIssue } = useIssuesContext();
  const { projects, teams, users } = useLinearContext();

  const assignee = users?.find((user) => user.id === issue.assigneeId);
  const updatedAssignee = changes
    ? users?.find((user) => user.id === changes.assigneeId)
    : undefined;
  const project = projects?.find((proj) => proj.id === issue.projectId);
  const updatedProject = changes
    ? projects?.find((proj) => proj.id === changes.projectId)
    : undefined;
  const team = teams?.find((team) => team.id === issue.teamId);

  const state =
    team && team.issueStatuses
      ? team.issueStatuses.find((status) => status.id === issue.stateId)
      : undefined;
  const updatedState =
    changes && team && team.issueStatuses
      ? team.issueStatuses.find((status) => status.id === changes.stateId)
      : undefined;
  const labels =
    team && team.issueLabels
      ? team.issueLabels.filter((label) => issue.labelIds?.includes(label.id))
      : [];
  const updatedLabels =
    changes && team && team.issueLabels
      ? team.issueLabels.filter((label) => changes.labelIds?.includes(label.id))
      : [];
  const dueDate = issue.dueDate
    ? new Date(issue.dueDate + 'T00:00:00').toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
      })
    : undefined;
  const updatedDueDate = changes?.dueDate
    ? new Date(changes.dueDate + 'T00:00:00').toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
      })
    : undefined;

  return (
    <div className="bg-gray-900 border border-gray-850 p-4 rounded-lg w-full flex flex-col gap-4">
      <div className="flex justify-between items-center">
        {changes ? (
          <ToolTypeBadge type="Updated" />
        ) : (
          <ToolTypeBadge type="New" />
        )}
        <div className="flex gap-3">
          <Button
            onClick={() => {
              rejectIssue(toolCallId);
            }}
            style="outlined"
            additionalClasses="border-red-500 hover:bg-red-500/10 text-red-500 !p-2"
          >
            <DeleteIcon className="w-5 h-5 fill-red-500" />
          </Button>
          <Button
            onClick={() => {
              approveIssue(toolCallId);
            }}
            loading={approveLoading.includes(toolCallId)}
            additionalClasses="!p-2"
          >
            <CheckIcon className="w-5 h-5 fill-white" />
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        {/* Title */}
        <div className="inline gap-2">
          <span
            className={`text-xl font-medium ${
              changes?.title && 'line-through'
            }`}
          >
            {issue.title}
          </span>
          {changes?.title && (
            <span className={'text-xl font-medium text-yellow-600'}>
              {changes.title}
            </span>
          )}
        </div>
        {/* Description */}
        <div className="inline gap-2">
          {issue.description && issue.description.length > 0 && (
            <span
              className={`text-gray-300 ${
                changes?.description && 'line-through'
              }`}
            >
              {issue.description}
            </span>
          )}
          {changes?.description && (
            <span className={'text-yellow-600'}>{changes.description}</span>
          )}
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {/* Priority */}
        {!issue.priority && !changes?.priority && (
          <AttributeTag
            icon={<PriorityNoneIcon className="fill-gray-200 w-5 h-5" />}
          />
        )}
        {issue.priority && !changes?.priority && (
          <AttributeTag
            icon={
              <>
                {issue.priority === 0 && (
                  <PriorityNoneIcon className="fill-gray-200 w-5 h-5" />
                )}
                {issue.priority === 1 && (
                  <PriorityUrgentIcon className="fill-gray-200 w-5 h-5" />
                )}
                {issue.priority === 2 && (
                  <PriorityHighIcon className="fill-gray-200 w-5 h-5" />
                )}
                {issue.priority === 3 && (
                  <PriorityMediumIcon className="fill-gray-200 w-5 h-5" />
                )}
                {issue.priority === 4 && (
                  <PriorityLowIcon className="fill-gray-200 w-5 h-5" />
                )}
              </>
            }
          />
        )}
        {changes?.priority && (
          <AttributeTag
            icon={
              <>
                <>
                  {changes.priority === 0 && (
                    <PriorityNoneIcon className="fill-yellow-600 w-5 h-5" />
                  )}
                  {changes.priority === 1 && (
                    <PriorityUrgentIcon className="fill-yellow-600 w-5 h-5" />
                  )}
                  {changes.priority === 2 && (
                    <PriorityHighIcon className="fill-yellow-600 w-5 h-5" />
                  )}
                  {changes.priority === 3 && (
                    <PriorityMediumIcon className="fill-yellow-600 w-5 h-5" />
                  )}
                  {changes.priority === 4 && (
                    <PriorityLowIcon className="fill-yellow-600 w-5 h-5" />
                  )}
                </>
              </>
            }
            updated
          />
        )}
        {/* State */}
        {state && !updatedState && (
          <AttributeTag
            label={state.name}
            icon={
              <>
                {state.type === 'backlog' && (
                  <StatusBacklogIcon className="fill-gray-200 w-4 h-4" />
                )}
                {state.type === 'unstarted' && (
                  <StatusUnstartedIcon className="fill-gray-200 w-4 h-4" />
                )}
                {state.type === 'started' && (
                  <StatusStartedIcon className="fill-gray-200 w-4 h-4" />
                )}
                {state.type === 'completed' && (
                  <StatusCompletedIcon className="fill-gray-200 w-4 h-4" />
                )}
                {state.type === 'cancelled' && (
                  <StatusCancelledIcon className="fill-gray-200 w-4 h-4" />
                )}
              </>
            }
          />
        )}
        {updatedState && (
          <AttributeTag
            label={updatedState.name}
            icon={
              <>
                {updatedState.type === 'backlog' && (
                  <StatusBacklogIcon className="fill-yellow-600 w-4 h-4" />
                )}
                {updatedState.type === 'unstarted' && (
                  <StatusUnstartedIcon className="fill-yellow-600 w-4 h-4" />
                )}
                {updatedState.type === 'started' && (
                  <StatusStartedIcon className="fill-yellow-600 w-4 h-4" />
                )}
                {updatedState.type === 'completed' && (
                  <StatusCompletedIcon className="fill-yellow-600 w-4 h-4" />
                )}
                {updatedState.type === 'cancelled' && (
                  <StatusCancelledIcon className="fill-yellow-600 w-4 h-4" />
                )}
              </>
            }
            updated
          />
        )}
        {/* Due Date */}
        {dueDate && !updatedDueDate && (
          <AttributeTag
            label={dueDate}
            icon={<CalendarIcon className="fill-gray-200 w-4 h-4" />}
          />
        )}
        {updatedDueDate && (
          <AttributeTag
            label={updatedDueDate}
            icon={<CalendarIcon className="fill-yellow-600 w-4 h-4" />}
            updated
          />
        )}
        {/* Team */}
        {team && (
          <AttributeTag
            label={team.name}
            icon={<GroupIcon className="fill-gray-200 w-4 h-4" />}
          />
        )}
        {/* Assignee */}
        {(assignee || updatedAssignee) && (
          <AttributeTag
            label={updatedAssignee?.name || assignee?.name}
            icon={
              <PersonIcon
                className={`w-4 h-4 ${
                  updatedAssignee ? 'fill-yellow-600' : 'fill-gray-200'
                }`}
              />
            }
            updated={!!updatedAssignee}
          />
        )}
        {/* Project */}
        {(project || updatedProject) && (
          <AttributeTag
            label={updatedProject?.name || project?.name}
            icon={
              <ProjectIcon
                className={`w-4 h-4 ${
                  updatedAssignee ? 'fill-yellow-600' : 'fill-gray-200'
                }`}
              />
            }
            updated={!!updatedProject}
          />
        )}
      </div>
      {/* Labels */}
      {labels.length > 0 &&
        updatedLabels.length === 0 &&
        labels.map((label) => (
          <AttributeTag
            key={label.id}
            label={label.name}
            icon={
              <span
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: label.color }}
              />
            }
          />
        ))}
      {updatedLabels.length > 0 &&
        updatedLabels.map((label) => (
          <AttributeTag
            key={label.id}
            label={label.name}
            icon={
              <span
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: label.color }}
              />
            }
            updated
          />
        ))}
      {/* TODO: Add parent tasks, estimate (only on update) */}
      {/* Debug Info */}
      {/* <div className="flex flex-col gap-2">
        <h3>Issue:</h3>
        <pre className="overflow-x-auto">{JSON.stringify(issue, null, 2)}</pre>
        <h3>Changes:</h3>
        <pre className="overflow-x-auto">
          {JSON.stringify(changes, null, 2)}
        </pre>
        <h3>Team:</h3>
        <pre className="overflow-x-auto">{JSON.stringify(team, null, 2)}</pre>
      </div> */}
    </div>
  );
};

const AttributeTag = ({
  icon,
  label,
  updated,
}: {
  icon: React.ReactNode;
  label?: string;
  updated?: boolean;
}) => {
  return (
    <div
      className={`flex items-center gap-2 py-1 border rounded-md text-sm ${
        updated
          ? 'text-yellow-600 border-yellow-600'
          : 'text-gray-400 border-gray-700'
      } ${!label ? 'px-1' : 'px-2'}`}
    >
      {icon}
      {label && <span>{label}</span>}
    </div>
  );
};

export default Issues;
