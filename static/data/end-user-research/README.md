# Cadence community survey data, 2023 to 2025

These files are a sanitized copy of the Cadence community surveys run on SurveyMonkey. Check the counts on [End User Research](../../../docs/11-tech-review/01-day-0-planning/01-scope/06-end-user-research.md). That is a path in this repo, so it works on GitHub. This file is static data, not a Docusaurus page.

| File | Survey | Responses |
| --- | --- | --- |
| [2023.csv](./2023.csv) | Cadence Community Survey 2023 | 15 |
| [2024.csv](./2024.csv) | Cadence Workflow OSS Community feedback 2024 | 18 |
| [2025.csv](./2025.csv) | Cadence Community Survey 2025 | 6 |

Total: 39 responses.

## What was removed

Each source export included SurveyMonkey metadata and some free-text answers. The copies here drop:

- Respondent ID, Collector ID, Start Date, End Date
- IP Address, Email Address, First Name, Last Name, Custom Data
- Employer and optional name or organization fields
- Every "Other (please specify)" column
- Every open-ended question

Rows are anonymous (`year` and `row`). Questions differ between years, so the three files do not share one schema.

## Collection windows in the source files

Dates below are the earliest start and latest end timestamps in each SurveyMonkey export. They are not a statement of when the survey was advertised.

- 2023 file: 2 February 2023 through 16 June 2025
- 2024 file: 17 September 2024 through 20 January 2025
- 2025 file: 1 January 2026 through 20 May 2026

The 2023 file includes one late response in 2025. That row is kept because it is in the source export.

## How to read the CSVs

SurveyMonkey's expanded export uses one column per choice. A filled cell means that respondent selected that choice. Empty cells mean they did not. Multi-select questions can have several filled cells on one row.
