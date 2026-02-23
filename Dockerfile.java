FROM openjdk:21
RUN useradd -ms /bin/bash runner
USER runner
WORKDIR /home/runner







