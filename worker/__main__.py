import time
import redis
from redis import Redis
from app.config import settings
from rq import Queue, Connection
from worker.worker import judge_submission

if __name__ == "__main__":
    redis = Redis.from_url(settings.REDIS_URL)
    with Connection(redis):
        q = Queue(settings.RQ_QUEUE_NAME)
        while True:
            job = q.dequeue_any()
            if job:
                judge_submission(job.kwargs.get("submission_id"))
            time.sleep(0.1)