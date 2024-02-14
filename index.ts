import { readFileSync, writeFileSync } from "fs";
import { env, exit } from "process";

import { Command } from "commander";

import * as azdev from "azure-devops-node-api";
import { IRequestHandler } from 'azure-devops-node-api/interfaces/common/VsoBaseInterfaces';

import { Octokit } from "@octokit/core";
import { throttling } from "@octokit/plugin-throttling";

const program = new Command();

program
  .option('--token <string>', 'PAT Token')
  .option('--orchestrator <string>', 'azdo, github')
  .option('--organization <string>', 'Name of the Organization')
  .option('--project <string>', 'Name of the Project')
  .option('--file <string>', 'Json file containing the work items to be created.')
  .option('--output <string>', 'Output file for the markdown content.')
  .parse(process.argv);

const config = {
  ...{
    token: env.INDIANA_TOKEN ?? "",
    orchestrator: env.INDIANA_ORCHESTRATOR ?? "",
    organization: env.INDIANA_ORGANIZATION ?? "",
    project: env.INDIANA_PROJECT ?? "",
    file: env.INDIANA_FILE ?? "",
    output: env.INDIANA_OUTPUT ?? "",
  },
  ...program.opts()
};

if (!config.orchestrator) {
  console.log("No orchestrator provided.");
  exit(1);
}
if (!config.file) {
  console.log("No file provided.");
  exit(1);
}

if (config.orchestrator === 'markdown') {
  if (!config.output) {
    console.log("No output file provided for markdown orchestrator.");
    exit(1);
  }
} else {
  // For other orchestrators
  if (!config.token) {
    console.log("No token provided.");
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
}

type WorkItem = {title: string, description: string, type: string, acceptanceCriteria: string, children: WorkItem[]};

interface IOrchestrator {
  getWorkItemsByProject(projectName: string): Promise<void>;
  createWorkItem(item: WorkItem, parentId?: string): Promise<void>;
};

class AzDo implements IOrchestrator {
  private connection: azdev.WebApi;
  private authHandler: IRequestHandler;

  public constructor() {
    this.authHandler = azdev.getPersonalAccessTokenHandler(config.token);
    this.connection = new azdev.WebApi(`https://dev.azure.com/${config.organization}`, this.authHandler);
  }

  public async getWorkItemsByProject(projectName: string) {
    const witApi = await this.connection.getWorkItemTrackingApi();
  
    const queryResult = await witApi.queryByWiql({ query: `SELECT [System.Id], [System.Title] FROM WorkItems WHERE [System.TeamProject] = '${projectName}' AND [System.Id] > 0 ORDER BY [System.Id]` });
  
    if (!queryResult?.workItems) {
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
      console.log(`Work Item ID: ${workItem?.id}, Title: ${workItem?.fields?.['System.Title']}`);
    });
  }

  public async createWorkItem(item: WorkItem, parentId: string = "") {
    const witApi = await this.connection.getWorkItemTrackingApi();
  
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
          url: `https://dev.azure.com/${config.organization}/${config.project}/_apis/wit/workItems/${parentId}`,
          attributes: {
            comment: item.description,
          },
        },
      });
    }

    const result = await witApi.createWorkItem(null, workItem, config.project, item.type);

    const parent_id = result.id?.toString();

    if (item.children && item.children.length > 0) {
      item.children.forEach(async (child) => {
        await this.createWorkItem(child, parent_id);
      }
    )};
  }
};

class GitHub implements IOrchestrator {
  private octokit: Octokit;

  public constructor() {
    const ThrottlingOctokit = Octokit.plugin(throttling);

    this.octokit = new ThrottlingOctokit({
      auth: config.token,
      throttle: {
        onRateLimit: (retryAfter, options, octokit, retryCount) => {
          octokit.log.warn(
            `Request quota exhausted for request ${options.method} ${options.url}`,
          );

          if (retryCount < 1) {
            octokit.log.info(`Retrying after ${retryAfter} seconds!`);
            return true;
          }
        },
        onSecondaryRateLimit: (retryAfter, options, octokit, retryCount) => {
          octokit.log.warn(
            `SecondaryRateLimit detected for request ${options.method} ${options.url}`,
          );
          if (retryCount < 1) {
            octokit.log.info(`Retrying after ${retryAfter} seconds!`);
          }
          return true;
        },
      }
    });
  }

  private sanitizeTitle(title: string) {
    return title.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  }

  private generateColor() {
    return Math.floor(Math.random() * 16777216).toString(16);
  }

  private async createLabels(item: WorkItem) {
    const existing_labels = (await this.octokit.request('GET /repos/{owner}/{repo}/labels', {
      owner: config.organization,
      repo: config.project,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })).data.map((item) => item.name);

    const desired_labels = [
      { title: this.sanitizeTitle(item.title), description: item.title, color: this.generateColor()},
      ...item.children.map((child) => ({ title: this.sanitizeTitle(child.title), description: child.title, color: this.generateColor() })),
    ];

    const diff = desired_labels.filter(item => existing_labels.indexOf(item.title) < 0);

    diff.forEach(async (label) => {
      await this.octokit.request("POST /repos/{owner}/{repo}/labels", {
        owner: config.organization,
        repo: config.project,
        name: this.sanitizeTitle(label.title),
        description: label.title,
        color: this.generateColor(),
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
    });
  }

  public async getWorkItemsByProject(projectName: string) {
    console.log("GitHub: getWorkItemsByProject");
  }

  public async createWorkItem(item: WorkItem, parentId: string = "") {
    let observability_milestone = (await this.octokit.request('GET /repos/{owner}/{repo}/milestones', {
      owner: config.organization,
      repo: config.project,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })).data.find((milestone) => milestone.title === this.sanitizeTitle(item.title));

    if (!observability_milestone) {
      observability_milestone = (await this.octokit.request('POST /repos/{owner}/{repo}/milestones', {
        owner: config.organization,
        repo: config.project,
        title: this.sanitizeTitle(item.title),
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      })).data;
    }

    this.createLabels(item);

    item.children.forEach(async (child) => {
      const child_issue = await this.octokit.request('POST /repos/{owner}/{repo}/issues', {
        owner: config.organization,
        repo: config.project,
        title: child.title,
        body: child.description,
        labels: [
          this.sanitizeTitle(item.title),
        ],
        milestone: observability_milestone?.number,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });

      console.log(`✔ Created issue #${child_issue.data.number} (${child_issue.data.title}).`);

      child.children.forEach(async (grandchild) => {
        const grandchild_issue = await this.octokit.request('POST /repos/{owner}/{repo}/issues', {
          owner: config.organization,
          repo: config.project,
          title: grandchild.title,
          body: `${grandchild.description}\n\n${grandchild.acceptanceCriteria}`,
          labels: [
            this.sanitizeTitle(child.title),
          ],
          milestone: observability_milestone?.number,
          headers: {
            'X-GitHub-Api-Version': '2022-11-28'
          }
        });

        console.log(`✔ Created issue #${grandchild_issue.data.number} (${grandchild_issue.data.title}).`);

        await this.octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
          owner: config.organization,
          repo: config.project,
          issue_number: grandchild_issue.data.number,
          body: `Mentioned in #${child_issue.data.number}`,
          headers: {
            'X-GitHub-Api-Version': '2022-11-28'
          }
        });

        console.log(`✔ Commented on issue #${grandchild_issue.data.number}.`);
      });
    });
  }
}

class MarkdownOrchestrator implements IOrchestrator {
  private markdownContent: string = "";
  private tocContent: string = "";

  public async getWorkItemsByProject(projectName: string): Promise<void> {
    // Placeholder implementation
  }

  private generateMarkdownForItem(item: WorkItem, level: number = 0): string {
    let headerPrefix = "";
    if (level === 0) headerPrefix = "Epic: ";
    else if (level === 1) headerPrefix = "Feature: ";
    else if (level === 2) headerPrefix = "User Story: ";

    let markdown = `${"#".repeat(level + 1)} ${headerPrefix}${item.title}\n\n${item.description}\n\n`;

    if (item.acceptanceCriteria && item.acceptanceCriteria.length > 0) {
      markdown += `**Acceptance Criteria:**\n\n${item.acceptanceCriteria}\n\n`;
    }

    if (item.children && item.children.length > 0) {
      item.children.forEach(child => {
        markdown += this.generateMarkdownForItem(child, level + 1);
      });
    }

    return markdown;
  }

  private addToTOC(item: WorkItem, level: number = 0): void {
    if (level === 1) { // Include only level 1 items (Features) in the ToC
      const anchor = item.title.toLowerCase().replace(/ /g, "-").replace(/[^\w-]/g, '');
      this.tocContent += `- [Feature: ${item.title}](#${anchor})\n`;
    }

    if (item.children && item.children.length > 0) {
      item.children.forEach(child => {
        this.addToTOC(child, level + 1);
      });
    }
  }

  public async createWorkItem(item: WorkItem, parentId: string = ""): Promise<void> {
    this.addToTOC(item);
    this.markdownContent += this.generateMarkdownForItem(item);
  }

  public writeToFile(filename: string): void {
    let fileContent = "";
    try {
      fileContent = readFileSync(filename, { encoding: "utf8" });
    } catch (error) {
      console.error("Error reading file:", error);
      return;
    }

    const tocSection = `<!-- toc -->\n${this.tocContent}\n<!-- endtoc -->`;
    const workItemsSection = `<!-- workitems -->\n${this.markdownContent}\n<!-- endworkitems -->`;

    fileContent = fileContent.replace(/<!-- toc -->[\s\S]*?<!-- endtoc -->/, tocSection);
    fileContent = fileContent.replace(/<!-- workitems -->[\s\S]*?<!-- endworkitems -->/, workItemsSection);

    try {
      writeFileSync(filename, fileContent, { encoding: "utf8" });
    } catch (error) {
      console.error("Error writing file:", error);
    }
  }
}


const jsonContent = readFileSync(config.file, "utf8");

const items: WorkItem[] = JSON.parse(jsonContent);

items.forEach(item => {
  item.children.forEach(child => {
    child.children.forEach(grandchild => {
      grandchild.acceptanceCriteria = grandchild.acceptanceCriteria.replaceAll("<br /><br />", "\n").replaceAll("[ ]", "* [ ]");
    });
  });
});

let orchestrator: IOrchestrator;

switch (config.orchestrator) {
  case "azdo":
    orchestrator = new AzDo();
    break;
  case "github":
    orchestrator = new GitHub();
    break;
  case "markdown":
    orchestrator = new MarkdownOrchestrator();
    break;
  default:
    throw new Error("Invalid orchestrator type");
}


for (const item of items) {
  orchestrator.createWorkItem(item).then(() => {});
}

// If MarkdownOrchestrator was used, write to a markdown file
if (orchestrator instanceof MarkdownOrchestrator) {
  orchestrator.writeToFile(config.output);
}