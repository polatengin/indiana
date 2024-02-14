# Observability Epic for Engineering Projects

## Overview

This script is designed to enhance the maturity of observability capabilities in our engineering projects. It allows users to add pre-defined epic, features, and user stories aligned with the Observability Maturity Model, facilitating the creation of a project backlog. The script supports three orchestrators - Azure DevOps (AzDo), GitHub, and Markdown - and can be customized to suit specific project needs.

The current list of work items is documented in [doc/workitems.md](doc/workitems.md).

## Prerequisites

- Node.js and npm (Node Package Manager).
- Personal Access Token (PAT) for AzDo or GitHub, depending on the chosen orchestrator.

Run `npm install` to download all dependencies defined in `package.json`.

## Running the Script

### For Azure DevOps (AzDo) Orchestrator

```bash
ts-node index.ts --orchestrator azdo --token YOUR_AZDO_PAT --organization YOUR_ORG --project YOUR_PROJECT --file work_items.json
```

- `--token`: Your AzDo Personal Access Token.
- `--organization`: The name of your AzDo organization.
- `--project`: The name of your AzDo project.
- `--file`: The JSON file containing work items definitions.

### For GitHub Orchestrator

```bash
ts-node index.ts --orchestrator github --token YOUR_GITHUB_PAT --organization YOUR_ORG --project YOUR_REPO --file work_items.json
```

- `--token`: Your GitHub Personal Access Token.
- `--organization`: The name of the user or organization owning the repo in GitHub.
- `--project`: The name of your GitHub repository.
- `--file`: The JSON file containing work items definitions.

## Generating Documentation

To generate documentation after updating `work_items.json` (which contains the current work items), run the script with the Markdown orchestrator. This will produce Markdown in the target file (`doc/workitems.md`) with a structured documentation of the work items.

- `--file`: The JSON file containing work items definitions.
- `--output`: The output Markdown file where the work items will be documented.

The target file must already exist. The script will replace the contents of two blocks marked with start and end comments:

**Table of Contents** - \<!-- toc --> and \<!-- endtoc -->
**Work Items** - \<!-- workitems --> and \<!-- endworkitems -->

### Command:

```bash
ts-node index.ts --orchestrator markdown --file work_items.json --output doc/workitems.md
```

Ensure that `work_items.json` is updated with the latest work items before running the command. The script will parse the JSON file and convert the content into a structured Markdown document.

## Notes

- Customize work items as needed but try to limit changes to Descriptions and Acceptance Criteria.
- For new additions or significant modifications, update them directly in the backlog after importing the Epic.
- The script is designed to be flexible and adaptable to different project requirements.