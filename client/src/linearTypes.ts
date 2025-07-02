export interface BaseIssue {
  assignee?: string;
  assigneeId?: string;
  createdAt: string;
  createdBy: string;
  createdById: string;
  description?: string;
  dueDate?: string;
  gitBranchName: string;
  id: string;
  identifier: string;
  parentId?: string;
  priority?: {
    name: string;
    value: number;
  };
  project?: string;
  projectId?: string;
  status: string;
  team: string;
  teamId: string;
  title: string;
  updatedAt: string;
  url: string;
}

export interface CreateIssue {
  assigneeId?: string;
  description?: string;
  dueDate?: string;
  labelIds?: string[];
  parentId?: string;
  priority?: number;
  projectId?: string;
  stateId?: string;
  teamId: string;
  title: string;
}

export interface BaseUpdateIssue {
  assigneeId?: string;
  description?: string;
  dueDate?: string;
  estimate?: number;
  id: string;
  labelIds?: string[];
  parentId?: string;
  priority?: number;
  projectId?: string;
  stateId?: string;
  title?: string;
}

export interface UpdateIssue extends BaseUpdateIssue {
  originalIssue: BaseIssue;
}

export function baseIssueToCreateIssue(
  issue: BaseIssue,
  teams: Team[],
): CreateIssue {
  return {
    ...issue,
    priority: issue.priority?.value,
    stateId: teams
      ?.find((team) => team.id === issue.teamId)
      ?.issueStatuses?.find((status) => status.name === issue.status)?.id,
  };
}

export function isUpdateIssue(
  issueCreateOrUpdate: CreateIssue | UpdateIssue,
): issueCreateOrUpdate is UpdateIssue {
  return (issueCreateOrUpdate as UpdateIssue).id !== undefined;
}

export interface IssueStatus {
  id: string;
  name: string;
  type: string;
}

export interface IssueLabel {
  color: string;
  id: string;
  name: string;
}

export interface Comment {
  author: {
    id: string;
    name: string;
  };
  body: string;
  createdAt: string;
  id: string;
  updatedAt: string;
}

export interface BaseCreateComment {
  body: string;
  issueId: string;
}

export interface CreateComment extends BaseCreateComment {
  issue: BaseIssue;
}

export interface BaseTeam {
  createdAt: string;
  id: string;
  name: string;
  updatedAt: string;
}

export interface Team extends BaseTeam {
  issueLabels: IssueLabel[];
  issueStatuses: IssueStatus[];
}

export interface User {
  createdAt: string;
  displayName: string;
  email: string;
  id: string;
  isActive: boolean;
  isAdmin: boolean;
  isGuest: boolean;
  name: string;
  status: string;
  updatedAt: string;
}

export interface Project {
  createdAt: string;
  description: string;
  id: string;
  name: string;
  summary: string;
  targetDate?: string;
  updatedAt: string;
  url: string;
}

export interface CreateProject {
  description?: string;
  name: string;
  startDate?: string;
  summary?: string;
  targetDate?: string;
  teamId: string;
}
