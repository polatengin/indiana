# Table of Contents

<!-- toc -->
- [Feature: Plan observability approach](#plan-observability-approach)
- [Feature: Create infrastructure](#create-infrastructure)
- [Feature: Auto instrument telemetry data](#auto-instrument-telemetry-data)
- [Feature: Add basic manual instrumentation](#add-basic-manual-instrumentation)
- [Feature: Build visualization dashboards](#build-visualization-dashboards)
- [Feature: Build automated alerts](#build-automated-alerts)
- [Feature: Implement advanced instrumentation practices](#implement-advanced-instrumentation-practices)
- [Feature: Accommodate cost and scale](#accommodate-cost-and-scale)

<!-- endtoc -->

<!-- workitems -->
# Epic: Observability

Observability is the ability to understand the internal state of a system by looking at its outputs. It is a superset of monitoring, alerting, and logging.

## Feature: Plan observability approach

Observability related tooling should be selected and business critical indicators identified

### User Story: Select centralized monitoring solution (assumes Azure Monitor)

As a project lead, I want to make a decision on which centralized monitoring solution to use, so that telemetry data can be aggregated and analyzed

**Acceptance Criteria:**

* [ ] Centralized monitoring solution selected

### User Story: Select instrumentation tooling (assumes OpenTelemetry exporter for Azure Monitor)

As a project lead, I want to make a decision on what tooling to use to instrument telemetry data, so that telemetry data can be collected and sent to the centralized monitoring solution

**Acceptance Criteria:**

* [ ] Instrumentation library selected

### User Story: Identify critical business signals

As a project lead, I want to identify the resources and signals most important to the business and application, so that the team can begin collecting and analyzing the requisite data

**Acceptance Criteria:**

* [ ] Design doc created that outlines telemetry signals to prioritize for the application
* [ ] Document references resource-specific and application-specific telemetry signals
* [ ] Monitor reference docs linked for each infrastructure resource (e.g. https://learn.microsoft.com/en-us/azure/service-bus-messaging/monitor-service-bus-reference)

## Feature: Create infrastructure

All supporting observability infrastructure should be created using infrastructure-as-code

### User Story: Create Log Analytics Workspace resource

As a project developer, I want a Log Analytics Workspace defined in IaC, so that we can send telemetry data for analysis

**Acceptance Criteria:**

* [ ] Log Analytics Workspace defined in IaC

### User Story: Create Application Insights resource

As a project developer, I want an Application Insights instance defined in IaC, so that we can send telemetry data for analysis

**Acceptance Criteria:**

* [ ] Application Insights defined in IaC

### User Story: Ensure all supporting Azure resources send telemetry data to Log Analytics

As a project developer, I want all Azure resources to send diagnostic information to the Log Analytics Workspace, so that we can begin analyzing collected telemetry data for those resources

**Acceptance Criteria:**

* [ ] Diagnostic settings added for all Azure resources in IaC
* [ ] Diagnostic settings reference Log Analytics Workspace

### User Story: View and query resource metrics in Log Analytics

As a project developer, I want a set of basic KQL queries that utilize Log Analytics tables saved to the repository, so that the team can begin familiarizing with querying Log Analytics using KQL

**Acceptance Criteria:**

* [ ] Documentation added that outlines where to retrieve resource logs and metrics
* [ ] At least 1 metric's retrieval process documented
* [ ] At least 3 KQL queries that use resource-specific Log Analytics Workspace tables documented (https://learn.microsoft.com/en-us/azure/azure-monitor/reference/tables/tables-resourcetype)

## Feature: Auto instrument telemetry data

Instrumentation tooling should be added to the project to begin automatically instrumenting out-of-the-box logs, metrics, and traces

### User Story: Add auto instrumentation code to project

As a project developer, I want the language-specific OpenTelemetry Exporter for Azure Monitor to be added to the project, so that application-specific telemetry is collected

**Acceptance Criteria:**

* [ ] Language-specific OpenTelemetry Exporter package installed (e.g. https://learn.microsoft.com/en-us/azure/azure-monitor/app/opentelemetry-enable?tabs=aspnetcore)
* [ ] Application code modified according to OpenTelemetry Exporter documentation

### User Story: Reference Application Insights Instrumentation Key in project

As a project developer, I want the Application Insights Instrumentation Key to be automatically written to the project environment variables, so that telemetry data is sent to the Application Insights instance deployed via IaC

**Acceptance Criteria:**

* [ ] Example environment variables file added to the project
* [ ] Environment variables file sets the Application Insights Instrumentation Key using the variable name specified by the OpenTelemetryExporter documentation
* [ ] Application Insights Instrumentation Key output from IaC as a sensitive value
* [ ] Application Insights Instrumentation Key output value automatically written to environment variables used by published versions of the project

### User Story: View and query logs, metrics, and traces in Application Insights

As a project developer, I want a set of basic KQL queries that utilize Application Insights tables saved to the repository, so that the team can begin familiarizing with querying Application Insights using KQL

**Acceptance Criteria:**

* [ ] Documentation added that outlines how to retrieve application logs and metrics
* [ ] At least 1 metric's retrieval process documented
* [ ] At least 3 KQL queries that use resource-specific Application Insights tables documented (https://learn.microsoft.com/en-us/azure/azure-monitor/app/data-model-complete)

## Feature: Add basic manual instrumentation

Manually instrumented telemetry data should augment auto-instrumented data to enable base visibility

### User Story: Add log statements to project and configure log level

As a project developer, I want an application wide log level configured, and I want each existing log statement to have an appropriate level applied, so that application-wide log output becomes configurable

**Acceptance Criteria:**

* [ ] Explanatory log statements added to project code, where missing
* [ ] Appropriate log level applied to all log statements
* [ ] Application wide log level configured (e.g. https://learn.microsoft.com/en-us/aspnet/core/fundamentals/logging/?view=aspnetcore-7.0#configure-logging)

### User Story: Ensure all dependencies are tracked

As a project developer, I want all currently untracked dependencies captured with spans, so that all sub-operations within the larger project operations are collected by Azure Monitor

**Acceptance Criteria:**

* [ ] Requests and dependencies available in Application Insights compared with expected set of requests and dependencies for the application (many libraries will auto instrument spans for their requests and dependencies)
* [ ] Tracers and spans added to project code that wrap all missing requests and dependencies

### User Story: Implement distributed tracing across service boundaries

As a project developer, I want distributed tracing configured across service boundaries, so that entire operations can be analyzed in Azure Monitor queries

**Acceptance Criteria:**

* [ ] Appropriate trace and span IDs passed from service to service using W3C Trace Context (https://www.w3.org/TR/trace-context/)
* [ ] Application Insights Transaction Search displays entire end to end operation

### User Story: Implement health checks

As a project developer, I want each service to expose a consumable health check, so that automated processes can access the check and report service health

**Acceptance Criteria:**

* [ ] Health checks implemented on all services according to the type of service (http, background, etc.)
* [ ] Health check logs are queryable in Azure Monitor

## Feature: Build visualization dashboards

Dashboards should provide visual representations of instrumented telemetry data

### User Story: Design tile layout

As a project developer, I want to predefine the set of tiles that should be displayed visually, so that project developers can build the necessary supporting queries

**Acceptance Criteria:**

* [ ] Design doc created that outlines the list of telemetry signals that should be displayed in a dashboard
* [ ] Dashboard layout documented

### User Story: Build supporting queries

As a project developer, I want the set of KQL queries that support the pre-defined visualization tiles added to the project, so that the queries can be added to dashboard related IaC

**Acceptance Criteria:**

* [ ] Set of KQL queries that retrieve the specified log-based telemetry signals added to the existing dashboard design doc
* [ ] Metrics that are necessary to support dashboard tiles added to the document

### User Story: Create Azure Workbooks resource

As a project developer, I want an Azure Workbook defined in IaC that includes the set of pre-built supporting queries, so that the visualization dashboard is deployed alongside existing project infrastructure

**Acceptance Criteria:**

* [ ] Azure Workbooks defined in IaC that implements the dashboard outlined in the design doc using the defined KQL queries and metrics

## Feature: Build automated alerts

Alerts should provide automatic notifications based on thresholds applied to incoming telemetry data

### User Story: Design alert signals and thresholds

As a project developer, I want to predefine the set of telemetry signals and corresponding  thresholds that should trigger action, so that project developers can build the necessary supporting queries and IaC

**Acceptance Criteria:**

* [ ] Design doc created that outlines the list of telemetry signals that should be used in alerts, with associated thresholds, etc
* [ ] Document references recommended alert rules for all supporting resources (e.g. https://learn.microsoft.com/en-us/azure/azure-monitor/vm/tutorial-monitor-vm-alert-recommended)

### User Story: Create Azure Alert action group

As a project developer, I want an Azure Alert action group with at least one email notification added to the project IaC, so that project admins can receive alert notifications

**Acceptance Criteria:**

* [ ] Azure Alert action group defined in IaC

### User Story: Create Azure Alert rules

As a project developer, I want the set of pre-defined signals and thresholds added as Azure Alert rules to the project IaC, so that project admins receive alert notifications when certain thresholds are met

**Acceptance Criteria:**

* [ ] Azure Alert rules defined in IaC that implement the rules outlined in the design doc using the defined KQL queries and metrics
* [ ] All alert rules utilize the action group

## Feature: Implement advanced instrumentation practices

Additional telemetry data should be instrumented to support business-specific visualization tiles and alerts

### User Story: Design additional required business-specific metrics

As a project developer, I want to define the set of business-specific metrics that should be collected in addition to the out-of-the-box metrics, so that these new custom metrics can be implemented in code

**Acceptance Criteria:**

* [ ] Design doc created that lists additional required metrics that are not instrumented by the application

### User Story: Design additional dimensions that should be added to existing logs

As a project developer, I want to define the business-specific dimensions that should be added to existing logs and traces, so that these attributes can be retrieved in KQL queries and support additional visualization tiles and alert rules

**Acceptance Criteria:**

* [ ] Design doc created that lists additional required attributes/dimensions that are not available in the instrumented telemetry data

### User Story: Instrument new custom metrics

As a project developer, I want to instrument the additional business-specific custom metrics, so that these metrics can be captured in visualization tiles and alert rules

**Acceptance Criteria:**

* [ ] Custom metrics added to application code to enable tracking of documented additional required metrics

### User Story: Add custom dimensions to instrumented telemetry data

As a project developer, I want to instrument the additional business-specific custom dimensions, so that these new attributes can be captured in visualization tiles and alert rules

**Acceptance Criteria:**

* [ ] Custom dimensions added to application code to enable tracking of documented additional required attributes/dimensions

### User Story: Track custom metrics in Azure Workbooks and Azure Alerts

As a project developer, I want to utilize the custom metrics in Workbook tiles and Azure Alert rules, so that they can be visualized and trigger notifications when appropriate thresholds are hit

**Acceptance Criteria:**

* [ ] Tiles added to Azure Workbook IaC that consume the custom metrics
* [ ] Azure alert rules added to IaC that consume the custom metrics

### User Story: Track custom dimensions in Azure Workbooks and Azure Alerts

As a project developer, I want to utilize the custom dimensions in Workbook tiles and Azure Alert rules, so that they can be visualized and trigger notifications when appropriate thresholds are hit

**Acceptance Criteria:**

* [ ] Tiles added to Azure Workbook IaC that consume the custom dimensions
* [ ] Azure alert rules added to IaC that consume the custom dimensions

## Feature: Accommodate cost and scale

Cost and capacity concerns should be mitigated

### User Story: Design cost and scaleability measures

As a project developer, I want clear specifications for cost and scalability measures, so that expenses related to the collection and storage of telemetry data are minimized

**Acceptance Criteria:**

* [ ] Design doc created that defines the sampling percentage that should be used
* [ ] Log retention timeframe documented
* [ ] Log levels documented for all environments
* [ ] Processes that require log rotation identified and the rotation process documented

### User Story: Set sampling percentage

As a project developer, I want sampling percentages set, so that a percentage of telemetry data is sampled out, reducing costs

**Acceptance Criteria:**

* [ ] Sampling percentage configured for the application

### User Story: Set retention policies for stored telemetry data

As a project developer, I want retention policies set for Log Analytics and Application Insights, so that data is archived after some time, reducing costs

**Acceptance Criteria:**

* [ ] Log retention policy configured for Log Analytics and Application Insights in IaC

### User Story: Ensure appropriate log levels are set across environments

As a project developer, I want log levels applied across all deployment environments, so that low level logs are suppressed by default, reducing costs

**Acceptance Criteria:**

* [ ] Log level is set via environment variable
* [ ] Log level configured for all deployed environments
* [ ] Log level can be updated without re-building and re-deploying the application

### User Story: Set log rotation policies

As a project developer, I want log rotation policies applied where applicable, so that performance is unaffected while ensuring log data is properly migrated to Azure Monitor

**Acceptance Criteria:**

* [ ] Log rotation processes implemented, where necessary


<!-- endworkitems -->
