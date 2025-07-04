import boto3
import os
from dotenv import load_dotenv

load_dotenv()

AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
BUCKET_NAME = os.getenv("AWS_S3_BUCKET")
REGION = os.getenv("AWS_REGION")

s3 = boto3.client(
    "s3",
    region_name=REGION,
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_KEY
)

try:
    response = s3.list_objects_v2(Bucket=BUCKET_NAME)
    if 'Contents' in response:
        print(f"Objects in {BUCKET_NAME}:")
        for obj in response['Contents']:
            print(f" - {obj['Key']}")
    else:
        print(f"No objects found in {BUCKET_NAME}. Bucket is accessible!")
except Exception as e:
    print(f"Error accessing bucket: {e}")
test_file_content = b"Hello, S3! This is a test."
test_file_key = "test-folder/test-file.txt"
