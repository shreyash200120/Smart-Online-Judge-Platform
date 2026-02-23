from rq import Queue
from redis import Redis
from app.config import settings

redis_conn = Redis.from_url(settings.REDIS_URL)
queue = Queue(settings.RQ_QUEUE_NAME, connection=redis_conn)


def enqueue_submission(submission_id: int) -> None:
	queue.enqueue("worker.worker.judge_submission", submission_id)


