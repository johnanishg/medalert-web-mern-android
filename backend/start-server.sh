#!/bin/bash

# Set Google Cloud environment variables
export GCLOUD_PROJECT_ID=rsvp-450609
export GOOGLE_APPLICATION_CREDENTIALS=/home/jag/medalert_web/backend/rsvp-450609-67bb2a85607a.json

# Set dedicated Speech-to-Text credentials
export SPEECH_GCLOUD_PROJECT_ID=rsvp-450609
export SPEECH_GOOGLE_APPLICATION_CREDENTIALS=/home/jag/medalert_web/backend/src/rsvp-450609-5da96c081fd6.json

# Start the server
echo "Starting backend server with Google Cloud credentials..."
echo "Translation credentials: $GOOGLE_APPLICATION_CREDENTIALS"
echo "Speech credentials: $SPEECH_GOOGLE_APPLICATION_CREDENTIALS"
node src/server.js
