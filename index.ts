import { Command } from "commander";
import { readFileSync } from "fs";
import { env, exit } from "process";

import * as azdev from "azure-devops-node-api";
import { IRequestHandler } from 'azure-devops-node-api/interfaces/common/VsoBaseInterfaces';

const program = new Command();

program
  .option('--token <string>', 'PAT Token')
  .option('--orchestrator <string>', 'azdo, github')
  .option('--organization <string>', 'Name of the Organization')
  .option('--project <string>', 'Name of the Project')
  .option('--file <string>', 'Json file containing the work items to be created.')
  .parse(process.argv);

const config = {
  ...{
    token: env.INDIANA_TOKEN ?? "",
    orchestrator: env.INDIANA_ORCHESTRATOR ?? "",
    organization: env.INDIANA_ORGANIZATION ?? "",
    project: env.INDIANA_PROJECT ?? "",
    file: env.INDIANA_FILE ?? ""
  },
  ...program.opts()
};

if (!config.token) {
  console.log("No token provided.");
  exit(1);
}
if (!config.orchestrator) {
  console.log("No orchestrator provided.");
  exit(1);
}
if (!config.organization) {
  console.log("No organization provided.");
  exit(1);
}
if (!config.project) {
  console.log("No project provided.");
  exit(1);
}
if (!config.file) {
  console.log("No file provided.");
  exit(1);
}

type WorkItem = {title: string, description: string, type: string, acceptanceCriteria: string, children: WorkItem[]};

interface IOrchestrator {
  getWorkItemsByProject(projectName: string): Promise<void>;
  createWorkItem(item: WorkItem, parentId?: string): Promise<void>;
};

async function createWorkItem(item: WorkItem, parentId: string = "") {
  const witApi = await getWorkItemTrackingApi();

  const workItem: { op: string, path: string, value: string | object }[] = [
    {
      op: "add",
      path: "/fields/System.Title",
      value: item.title,
    },
    {
      op: "add",
      path: "/fields/System.Description",
      value: item.description,
    },
  ];

  if (item.acceptanceCriteria) {
    workItem.push({
      op: "add",
      path: "/fields/Microsoft.VSTS.Common.AcceptanceCriteria",
      value: item.acceptanceCriteria,
    });
  }

  if (parentId !== "") {
    workItem.push({
      op: "add",
      path: "/relations/-",
      value: {
        rel: "System.LinkTypes.Hierarchy-Reverse",
        url: `https://dev.azure.com/${orgName}/${projectName}/_apis/wit/workItems/${parentId}`,
        attributes: {
          comment: item.description,
        },
      },
    });
  }

  const result = await witApi.createWorkItem(null, workItem, projectName, item.type);

  const parent_id = result.id?.toString();

  if (item.children && item.children.length > 0) {
    item.children.forEach(async (child) => {
      await createWorkItem(child, parent_id);
    }
  )};

  return result;
}

async function main() {
  const jsonContent = readFileSync(fileNameArg, "utf8");

  const items: WorkItem[] = JSON.parse(jsonContent);

  for (const item of items) {
    await createWorkItem(item);
  }

  // await getWorkItemsByProject(projectName);
}

(async () => {
  await main();
})();
