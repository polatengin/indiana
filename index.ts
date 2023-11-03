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
