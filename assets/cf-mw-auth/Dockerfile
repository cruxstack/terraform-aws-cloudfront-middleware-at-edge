# ------------------------------------------------------------------- base ---

FROM node:18 as base

RUN mkdir -p /opt/app
WORKDIR /opt/app

ENV NODE_ENV development

# intentally not installing node_modules inside the /opt/app dir; this makes
# for a better experience when using image in development environment
ADD package*.json /opt/
RUN npm ci

ADD ./ ./

# -------------------------------------------------------------------- test ---

FROM base as test

RUN npm run lint && npm run test

# -------------------------------------------------------------------- test ---

FROM test as build

ENV OPA_VERSION=0.49.0
RUN SYSTEM_ARCH=$(dpkg --print-architecture) \
    && curl -L -o opa https://github.com/open-policy-agent/opa/releases/download/v${OPA_VERSION}/opa_linux_${SYSTEM_ARCH}_static \
    && mv opa /usr/bin/opa \
    && chmod +x /usr/bin/opa \
    && opa -h

RUN npm run build

ARG SERVICE_POLICY_ENCODED=cGFja2FnZSBhdXRoX2F0X2VkZ2VfYXV0aHoKcmVzdWx0cyA6PSBbXQo=
RUN echo "$SERVICE_POLICY_ENCODED" | base64 -d > /opt/app/dist/policy.rego

RUN opa build -t wasm -e auth_at_edge_authz/results /opt/app/dist/policy.rego \
    && tar -zxv -C /opt/app/dist -f bundle.tar.gz '/policy.wasm'

# ----------------------------------------------------------------- package ---

FROM alpine:latest as package

RUN apk add jq

ARG SERVICE_CONFIG_ENCODED=e30K

COPY --from=build /opt/app/dist /opt/app/dist
COPY --from=build /opt/package-lock.json /opt/app/dist/

RUN echo "$SERVICE_CONFIG_ENCODED" | base64 -d | jq > /opt/app/dist/configuration.json

RUN apk add zip \
    && cd /opt/app/dist \
    && zip -r /tmp/package.zip .

