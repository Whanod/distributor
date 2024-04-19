FROM hubbleprotocol/helm:0.0.2

ARG CHART
ARG BUILD_VERSION

COPY /bots/$CHART/helm /build/helm
COPY /.github/scripts /build/scripts
WORKDIR /build/helm

RUN /build/scripts/update-local-chart.sh "hubbleprotocol/$CHART" "$BUILD_VERSION"

RUN --mount=type=secret,id=aws_access_key_id \
	--mount=type=secret,id=aws_secret_access_key \
	/build/scripts/push-local-chart.sh
