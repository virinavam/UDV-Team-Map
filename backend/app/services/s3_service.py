import boto3
from botocore.exceptions import BotoCoreError, ClientError


class S3Service:
    def __init__(self, endpoint, user, password):
        self.client = boto3.client(
            "s3",
            endpoint_url=endpoint,
            aws_access_key_id=user,
            aws_secret_access_key=password,
        )

    def healthcheck(self):
        try:
            self.client.list_buckets()
            return True
        except (BotoCoreError, ClientError):
            return False
