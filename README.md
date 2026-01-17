# FlyData CKAN Sync & Versioning

This project provides an automated solution for tracking and versioning flight data from the Israel Airport Authority (data.gov.il) and maintaining a continuous log on odata.org.il.

## How it Works
The system is built as a Google Apps Script that runs on a time-based trigger.

1.  **Fetching:** Every 5 minutes, the script polls the live dataset from the official Government Data Portal.
2.  **Comparison:** It compares the live data against a "Snapshot" stored in a Google Sheet to identify only new records (INSERTs).
3.  **Logging:** New records are appended with a metadata timestamp and an action type.
4.  **Syncing:** The updated log is pushed as a CSV resource to the target CKAN dataset at `odata.org.il`.

## Features
* **Incremental Updates:** Only new data is added to the log, saving bandwidth and processing time.
* **Audit Trail:** Adds `log_timestamp` and `log_action` columns to every record for historical analysis.
* **Serverless:** Runs entirely on Google Apps Script (no server maintenance required).
* **Persistence:** Uses Google Sheets as a local database to track the last known state.

## Setup
1. Create a new Google Apps Script project.
2. Copy the code from `Code.gs`.
3. Replace the `API_KEY` with your private API key from odata.org.il.
4. Run the `initialSetup()` function once to initialize the log and the local snapshot.
5. Set up a Time-driven trigger for `appendUpdatesToCkan()` to run every 5 minutes.

## Data Sources
* **Source:** [data.gov.il - Israel Airport Authority](https://data.gov.il/dataset/flydata)
* **Destination Log:** [odata.org.il - FlyData Versioning](https://www.odata.org.il/dataset/flydata)
