# gunicorn.conf.py — tuned for 100 concurrent students
import multiprocessing

workers     = 4          # 4 workers × 4 threads = 16 concurrent requests
threads     = 4
bind        = "0.0.0.0:10000"   # Render uses port 10000
timeout     = 60
keepalive   = 5
accesslog   = "-"
errorlog    = "-"
loglevel    = "info"
worker_class = "sync"
max_requests        = 1000
max_requests_jitter = 100
