## Sync assets in S3 with CLD
Customers would want to continue managing assets in S3 and require the S3 bucket (or folder) to be in sync with Cloudinary Media Library.

### Actions Supported (performed in S3)
* add new asset(s)
* overwrite existing assets
* delete an asset(s)

### Serverless Application
This application uses Serverless Framework to create the required AWS stack to listen to S3 events, lambda function and create the required permissions.
More about the framework - https://www.serverless.com/

### Application Deployment
* create a Serverless application
  * sls create -t aws-nodejs -p <project_name>
  * cd to <project_name>
* copy files from this repo
* run 'npm install' to install the required packages
* sls deploy -s prod 
  * add '--aws-profile <profile_name>' in case it needs a profile information for fetching keys
* test locally without deploying to AWS
  * serverless invoke local -f s3-cld-sync -p event_objCreated.json -s prod
  * serverless invoke local -f s3-cld-sync -p event_objRemoved.json -s prod

#### Manual Step
In-order for Cloudinary backend to access S3 bucket to use S3 URL for uploads, appropriate permissions are required.
https://support.cloudinary.com/hc/en-us/articles/203276521-How-do-I-allow-Cloudinary-to-read-from-my-private-S3-bucket-
* bucket policy is already defined the YML file under resources -> BuckeyPolicy
* **manual step** - go to the S3 bucket that gets created as part of the serverless application stack and create the heirarchy as */wellknown/cloudinary/<cloud_name>*

#### Other
* modification to YML file in case using an existing bucket - https://www.serverless.com/framework/docs/providers/aws/events/s3#using-existing-buckets
