FROM oven/bun:1.4 AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
ENV STANDALONE=1
ENV NEXT_ADAPTER_PATH=next-bun-compile
ENV NEXT_BUN_COMPILE_VERBOSE=1
# next-bun-compile 2 writes <NBC_OUT>/<NBC_BINARY>, defaulting to dist/app
ENV NBC_OUT=.
ENV NBC_BINARY=server
ARG TARGETARCH
ARG GIT_SHA=dev
ARG NEXT_PUBLIC_SITE_URL=https://opencapper.coding-global.com
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_RELEASE_VERSION=$GIT_SHA
# Impressum identity: public on the site, but kept out of the public repo.
ARG NEXT_PUBLIC_LEGAL_NAME
ARG NEXT_PUBLIC_LEGAL_ADDRESS
ARG NEXT_PUBLIC_LEGAL_VAT_ID
ARG NEXT_PUBLIC_LEGAL_EMAIL
ENV NEXT_PUBLIC_LEGAL_NAME=$NEXT_PUBLIC_LEGAL_NAME \
    NEXT_PUBLIC_LEGAL_ADDRESS=$NEXT_PUBLIC_LEGAL_ADDRESS \
    NEXT_PUBLIC_LEGAL_VAT_ID=$NEXT_PUBLIC_LEGAL_VAT_ID \
    NEXT_PUBLIC_LEGAL_EMAIL=$NEXT_PUBLIC_LEGAL_EMAIL
# An empty Impressum is a legal defect, so a missing value stops the build.
RUN for v in NEXT_PUBLIC_LEGAL_NAME NEXT_PUBLIC_LEGAL_ADDRESS NEXT_PUBLIC_LEGAL_VAT_ID NEXT_PUBLIC_LEGAL_EMAIL; do \
      [ -n "$(printenv "$v")" ] || { echo "missing build arg $v (set ${v#NEXT_PUBLIC_} in the stack env)" >&2; exit 1; }; \
    done
# Komodo passes no commit, so a timestamp keeps asset URLs unique per deploy: a 404 cached at the edge during a container swap must not outlive that deploy.
RUN --mount=type=cache,target=/app/.next/cache \
    NEXT_DEPLOYMENT_ID=$([ "$GIT_SHA" = dev ] && date +%s || echo "$GIT_SHA") \
    NBC_TARGET=bun-linux-$([ "$TARGETARCH" = arm64 ] && echo arm64 || echo x64) bun run build

FROM gcr.io/distroless/cc-debian12:nonroot@sha256:9dac0a79194e45a7da0158a9c6da57b217585af0786db3845d1f0ec1a0dd182f AS prod
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# the binary extracts its runtime tree here on first start and runs with it as cwd
ENV NBC_RUNTIME_DIR=/app
# distroless has no HTTP client; static busybox wget serves the compose healthcheck.
COPY --from=busybox:1.37.0-musl /bin/busybox /usr/local/bin/wget
COPY --from=builder --chown=nonroot:nonroot /app/server ./server
EXPOSE 3000
ENTRYPOINT ["./server"]
