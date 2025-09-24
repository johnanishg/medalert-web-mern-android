#!/bin/bash

# Set Google Cloud environment variables
export GCLOUD_PROJECT_ID=rsvp-450609
export GOOGLE_APPLICATION_CREDENTIALS=/home/jag/medalert_web/backend/rsvp-450609-67bb2a85607a.json

# Start the server
echo "Starting backend server with Google Cloud credentials..."
node src/server.js
