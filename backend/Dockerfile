FROM python:3.12-alpine

# Set working directory
WORKDIR /app

# Install system dependencies if needed (for some Python packages)
RUN apk add --no-cache gcc musl-dev linux-headers

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create directory for problem reports
RUN mkdir -p /tmp/taboo_problems

# Expose port 8000 for Caddy to proxy
EXPOSE 8000

# Run the application
# Using 0.0.0.0 to listen on all interfaces inside the container
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]