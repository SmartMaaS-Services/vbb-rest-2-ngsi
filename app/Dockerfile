FROM node:10.16.3-alpine
RUN mkdir -p /home/node/vbb-rest-2-ngsi/node_modules && chown -R node:node /home/node/vbb-rest-2-ngsi
WORKDIR /home/node/vbb-rest-2-ngsi
COPY package*.json /home/node/vbb-rest-2-ngsi/
USER node
RUN npm install
COPY --chown=node:node . /home/node/vbb-rest-2-ngsi
CMD node index.js
