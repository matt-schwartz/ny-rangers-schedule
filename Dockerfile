# Dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package.json ./
COPY update-schedule.js ./

# Run the update script and keep container running to inspect output
CMD ["sh", "-c", "npm run update && echo '\n\n=== Schedule updated! Check index.html ===' && tail -f /dev/null"]
