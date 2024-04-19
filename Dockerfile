FROM lukemathwalker/cargo-chef:latest-rust-slim-bullseye AS chef

RUN apt-get update \
    && apt-get -y install \
    clang \
    cmake \
    libudev-dev \
    make \
    unzip \
    libssl-dev \
    pkg-config \
    libpq-dev \
    curl

WORKDIR distributor

FROM chef AS prepare

COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS build

COPY --from=prepare /distributor/recipe.json recipe.json

# Build dependencies - this is the caching Docker layer!
RUN cargo chef cook --release --bin kamino-airdrop-api --recipe-path recipe.json

# Build application
COPY . .
RUN cargo build --release --bin kamino-airdrop-api --locked

FROM debian:bullseye-slim AS runtime

RUN apt-get update && apt-get install -y libssl1.1 libpq-dev ca-certificates && update-ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=build /distributor/target/release/kamino-airdrop-api ./

ENTRYPOINT ["./kamino-airdrop-api"]

# use scratch to dump binary from
FROM scratch AS release-bin

COPY --from=runtime /kamino-airdrop-api .