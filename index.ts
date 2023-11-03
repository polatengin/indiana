import { argv, env, exit } from "process";
import { readFileSync } from "fs";

import * as azdev from "azure-devops-node-api";

const args = argv.slice(2);
const fileNameArg = args[0];

if (!fileNameArg) {
  console.log("No file provided.");
  exit(1);
}

type WorkItem = {title: string, description: string, type: string, children: WorkItem[]};

const token = env.AZUREDEVOPS_PAT || "";

const orgName = env.AZUREDEVOPS_ORGNAME || "enpolat";

const projectName = env.AZUREDEVOPS_PROJECTNAME || "monaco";

const authHandler = azdev.getPersonalAccessTokenHandler(token);

const connection = new azdev.WebApi(`https://dev.azure.com/${orgName}`, authHandler);

async function getWorkItemTrackingApi() {
  return await connection.getWorkItemTrackingApi();
}

async function getWorkItemsByProject(projectName: string) {
  const witApi = await getWorkItemTrackingApi();

  const queryResult = await witApi.queryByWiql({ query: `SELECT [System.Id], [System.Title] FROM WorkItems WHERE [System.TeamProject] = '${projectName}' AND [System.Id] > 0 ORDER BY [System.Id]` });

  if (!queryResult || !queryResult.workItems) {
    console.log("No work items found.");
    return;
  }

  const workItemIds = queryResult.workItems.map((item) => item.id).filter((id) => id !== undefined);

  if (workItemIds.length === 0) {
    console.log("No work items found.");
    return;
  }

  const workItems = await witApi.getWorkItems(workItemIds as number[]);

  workItems.forEach((workItem) => {
    if (workItem && workItem.fields) {
      console.log(`Work Item ID: ${workItem.id}, Title: ${workItem.fields['System.Title']}`);
    }
  });
}
