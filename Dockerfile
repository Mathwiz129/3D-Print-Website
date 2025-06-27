# Use an official Python base image
FROM ubuntu:22.04

# Install Python, pip, MeshLab, and other dependencies
RUN apt-get update && \
    apt-get install -y python3 python3-pip meshlab git && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt ./
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy the rest of the app
COPY . .

# Expose the port (Render uses $PORT env var)
EXPOSE 10000

# Start the app with Gunicorn, binding to the port Render provides
CMD exec gunicorn app:app --bind 0.0.0.0:${PORT:-10000} 