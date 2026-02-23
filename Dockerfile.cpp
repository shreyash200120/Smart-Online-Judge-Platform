FROM gcc:13
RUN useradd -ms /bin/bash runner
USER runner
WORKDIR /home/runner







