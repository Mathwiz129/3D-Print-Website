# Use an official Python base image
FROM python:3.9

# Install system dependencies (MeshLab, git, etc.)
RUN apt-get update && \
    apt-get install -y meshlab git && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the app
COPY . .

# Expose the port (Render uses $PORT env var)
EXPOSE 10000

# Start the app with Gunicorn, binding to the port Render provides
CMD exec gunicorn app:app --bind 0.0.0.0:${PORT:-10000} 