# Use an official Python base image
FROM ubuntu:22.04

# Install Python, pip, MeshLab, all required X11/Qt libraries, and Mesa OpenGL for headless operation
RUN apt-get update && \
    apt-get install -y python3 python3-pip meshlab git \
    libxkbcommon-x11-0 libxcb-xinerama0 libglu1-mesa xvfb \
    libxrender1 libsm6 libxext6 \
    libgl1-mesa-glx libgl1-mesa-dri \
    libegl1-mesa libgles2-mesa \
    mesa-utils mesa-utils-extra \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt ./
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy the rest of the app
COPY . .

# Set environment variables for headless operation
ENV QT_QPA_PLATFORM=offscreen
ENV LIBGL_ALWAYS_SOFTWARE=1
ENV MESA_GL_VERSION_OVERRIDE=3.3
ENV MESA_GLSL_VERSION_OVERRIDE=330
ENV DISPLAY=:99

# Expose the port (Render uses $PORT env var)
EXPOSE 10000

# Start the app with Gunicorn, binding to the port Render provides
CMD exec gunicorn app:app --bind 0.0.0.0:${PORT:-10000} --timeout 120 --workers 1 