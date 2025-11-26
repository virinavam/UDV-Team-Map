from typing import BinaryIO

import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError


class S3Service:
    def __init__(self, access_key: str, secret_key: str, region: str, endpoint: str,
                 public_read: bool = True,
                 use_ssl: bool = True, public_endpoint: str = None):
        self.client = boto3.client(
            "s3",
            endpoint_url=endpoint,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region,
            config=Config(signature_version="s3v4", connect_timeout=2.0,
                          retries={'max_attempts': 1, 'mode': 'standard'}),
            use_ssl=use_ssl,
            verify=use_ssl,

        )
        self.public_endpoint = public_endpoint or endpoint
        self.public_read = public_read

    def healthcheck(self, bucket_name: str | None = None) -> bool:
        try:
            self.client.list_buckets()

            if not bucket_name:
                return True

            self.client.head_bucket(Bucket=bucket_name)

            return True
        except (BotoCoreError, ClientError):
            return False

    def upload_file_obj(self, file_object: BinaryIO, bucket_name: str, object_key: str) -> str | None:

        extra = {
            "ContentType": getattr(file_object, "content_type", "application/octet-stream"),
        }

        if self.public_read:
            extra["ACL"] = "public-read"

        self.client.upload_fileobj(
            Fileobj=file_object,
            Bucket=bucket_name,
            Key=object_key,
            ExtraArgs=extra
        )

    def download_file_obj(self, file_object: BinaryIO, bucket_name: str, object_key: str):
        self.client.download_fileobj(
            Bucket=bucket_name,
            Key=object_key,
            Fileobj=file_object
        )
