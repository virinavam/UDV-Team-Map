from typing import BinaryIO

import boto3
from botocore.exceptions import BotoCoreError, ClientError


class S3Service:
    def __init__(self, endpoint: str, user: str, password: str, region_name: str = "us-east-1"):
        """
        Инициализирует клиент S3.

        Args:
            endpoint: URL конечной точки S3 (например, MinIO или AWS).
            user: Ключ доступа AWS.
            password: Секретный ключ AWS.
            region_name: Имя региона.
        """
        self.client = boto3.client(
            "s3",
            endpoint_url=endpoint,
            aws_access_key_id=user,
            aws_secret_access_key=password,
            region_name=region_name,
        )

    def healthcheck(self):
        try:
            self.client.list_buckets()
            return True
        except (BotoCoreError, ClientError):
            return False

    def upload_file_obj(self, file_object: BinaryIO, bucket_name: str, object_key: str) -> str | None:
        try:
            self.client.upload_fileobj(
                Fileobj=file_object,
                Bucket=bucket_name,
                Key=object_key,
                ExtraArgs={
                    'ContentType': file_object.content_type if hasattr(file_object, 'content_type') else 'image/jpeg'}
            )
            return f"{self.client._endpoint.host}/{bucket_name}/{object_key}"

        except ClientError as e:
            return None
        except Exception as e:
            return None
