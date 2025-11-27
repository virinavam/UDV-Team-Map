from typing import BinaryIO, Optional

import aiobotocore.session
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError


class AsyncS3Service:
    def __init__(
            self,
            access_key: str,
            secret_key: str,
            region: str,
            endpoint: str,
            public_read: bool = True,
            use_ssl: bool = True,
            public_endpoint: str = None,
    ):
        self.session = aiobotocore.session.get_session()
        self.client_kwargs = {
            "endpoint_url": endpoint,
            "aws_access_key_id": access_key,
            "aws_secret_access_key": secret_key,
            "region_name": region,
            "config": Config(
                signature_version="s3v4", connect_timeout=2.0, retries={"max_attempts": 1, "mode": "standard"}
            ),
            "use_ssl": use_ssl,
            "verify": use_ssl,
        }
        self.public_endpoint = public_endpoint or endpoint
        self.public_read = public_read

    async def _get_client(self):
        return self.session.create_client("s3", **self.client_kwargs)

    async def healthcheck(self, bucket_name: Optional[str] = None) -> bool:
        try:
            async with await self._get_client() as client:
                await client.list_buckets()
                if not bucket_name:
                    return True
                await client.head_bucket(Bucket=bucket_name)
                return True
        except (BotoCoreError, ClientError):
            return False

    async def upload_file_obj(self, file_object: BinaryIO, bucket_name: str, object_key: str) -> Optional[str]:
        extra_args = {}
        content_type = getattr(file_object, "content_type", "application/octet-stream")

        if self.public_read:
            extra_args["ACL"] = "public-read"

        file_object.seek(0)
        async with await self._get_client() as client:
            await client.put_object(
                Bucket=bucket_name,
                Key=object_key,
                Body=file_object,
                ContentType=content_type,
                **extra_args
            )
        return f"{self.public_endpoint}/{bucket_name}/{object_key}"

    async def download_file_obj(self, file_object: BinaryIO, bucket_name: str, object_key: str):
        async with await self._get_client() as client:
            response = await client.get_object(Bucket=bucket_name, Key=object_key)
            async with response["Body"] as stream:
                data = await stream.read()
                file_object.write(data)
