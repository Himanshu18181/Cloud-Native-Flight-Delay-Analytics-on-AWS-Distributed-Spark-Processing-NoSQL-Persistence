# Flight Delay Analytics Project

This workspace contains the flight delay analytics ETL pipeline, React dashboard, backend API, dissertation source, and the current Spark job implementation.

## Kept Files

- `flight-dashboard/`: React frontend and Express backend
- `flight_react_spark_v6.py`: current Spark pipeline script
- `flight_delay_project.ipynb`: notebook work

## Project Structure

`9o0``text
Himanshu/
├── README.md
├── flight_react_spark_v6.py
├── flight_delay_project.ipynb
└── flight-dashboard/
    ├── package.json
    ├── server.js
    ├── public/
    └── src/
```

## What The App Does

- Processes large flight datasets with Apache Spark on EMR
- Reads processed results from S3
- Serves pipeline state and data through an Express API
- Displays real dashboard views in React

## Requirements

- Node.js
- npm
- AWS credentials only if you want to submit or inspect EMR pipeline runs from the UI

## Install

```bash
cd /home/nashtech/Himanshu/flight-dashboard
npm install
```

## Run In Development

This starts both backend and frontend.

```bash
npm --prefix /home/nashtech/Himanshu/flight-dashboard run dev
```

URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

## Run Production Preview

Build the frontend:

```bash
npm --prefix /home/nashtech/Himanshu/flight-dashboard run build
```

Serve the built app:

```bash
npx --yes serve -s /home/nashtech/Himanshu/flight-dashboard/build -l 3001
```

Production preview URL:

- `http://localhost:3001`

## Useful npm Commands

```bash
npm --prefix /home/nashtech/Himanshu/flight-dashboard run dev
npm --prefix /home/nashtech/Himanshu/flight-dashboard run server
npm --prefix /home/nashtech/Himanshu/flight-dashboard start
npm --prefix /home/nashtech/Himanshu/flight-dashboard run build
```

## AWS Configuration

The backend uses region `us-east-1` and the EMR cluster `j-3AUQOHYTC9PXZ`.

Set credentials only if pipeline submission or AWS-backed status checks are required:

```bash
export AWS_ACCESS_KEY_ID="your_access_key"
export AWS_SECRET_ACCESS_KEY="your_secret_key"
export AWS_DEFAULT_REGION="us-east-1"
```

Then start the app with:

```bash
npm --prefix /home/nashtech/Himanshu/flight-dashboard run dev
```

## Backend Endpoints

- `GET /api/health`
- `GET /api/pipeline/status`
- `GET /api/pipeline/steps`
- `POST /api/pipeline/run`
- `GET /api/pipeline/job/:jobId`
- `GET /api/data/:dataType`

## Current Runtime Notes

- The frontend is configured to use backend port `5000`
- The current Spark script referenced by the backend is `flight_react_spark_v6.py`
- Old shell wrappers and duplicated markdown docs were removed intentionally

## Cleanup Policy Applied

- Kept one detailed markdown file: this file
- Removed redundant markdown files
- Removed shell helper scripts that only wrapped npm or curl commands
- Kept only the current Spark pipeline version in the root workspace