FROM amd64/node:14-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    net-tools \
    curl \
    && rm -rf /var/lib/apt/lists/*

ENV WORKINGDIR /app
WORKDIR ${WORKINGDIR}

ADD package.json ${WORKINGDIR}/package.json
ADD .eslintrc.json ${WORKINGDIR}/.eslintrc.json
ADD tsconfig.json ${WORKINGDIR}/tsconfig.json
ADD LICENSE ${WORKINGDIR}/LICENSE
ADD README.md ${WORKINGDIR}/README.md
ADD src ${WORKINGDIR}/src
ADD client_dist ${WORKINGDIR}/client_dist
ADD client_dist/assets ${WORKINGDIR}/assets
ADD static ${WORKINGDIR}/static

RUN npm install -q && \
    npm run build && \
    # npm run eslint && \
    npm prune --production && \
    rm -f .eslintrc.json && \
    rm -f tsconfig.json && \
    rm -rf src

HEALTHCHECK \
    --interval=30s \
    --timeout=30s \
    --start-period=60s \
    --retries=3 \
    CMD curl -f http://localhost:9072/health || exit 1

EXPOSE 9072

CMD ["node", "./dist/index"]
