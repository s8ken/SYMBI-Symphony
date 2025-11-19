# Use pinned Python 3.10 image
FROM python:3.10-slim@sha256:2407c61b1a18067393feef2c6b36dea38e8c9a751c3f4c7e274b0c9c8e3e9e1e as Builder

# Add metadata labels
LABEL org.opencontainers.image.title="SYMBI AgentVerse"
LABEL org.opencontainers.image.description="Multi-agent system orchestration"
LABEL org.opencontainers.image.source="https://github.com/s8ken/SYMBI-Symphony"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.vendor="SYMBI Team"

RUN sed -i 's/deb.debian.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apt/sources.list.d/debian.sources && \
    sed -i 's/security.debian.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apt/sources.list.d/debian.sources
RUN pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple && \
    pip3 install --upgrade pip  # enable PEP 660 support
WORKDIR /app
# install libGL.so.1
RUN apt-get update && apt-get install libgl1 -y
# install BMTools
RUN git clone https://github.com/OpenBMB/BMTools.git --depth=1
RUN cd BMTools && \
    pip install -r requirements.txt && \
    python setup.py develop
# install AgentVerse
WORKDIR /app/AgentVerse
COPY requirements*.txt ./
RUN pip install -r requirements.txt
RUN pip install -r requirements_local.txt
COPY . .
RUN pip install -e .

# Add health check (adjust port as needed)
ENV PORT=5001
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT}/health')" || exit 1

