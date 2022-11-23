// this JS fetches keys and secrets required for the WPT tool from AWS Secrets Manager
var AWS = require('aws-sdk')
var client = new AWS.SecretsManager();

const getAllSecret = (secret) => {
    return new Promise((resolve, reject) => {
        let secrets = {};
        const secretName = secret;
        client.getSecretValue({ SecretId: secretName }, function (err, data) {
            if (err) {
                console.error('getAllSecret - error: ', err);
                reject(err);
            }
            else {
                if ('SecretString' in data) {
                    secrets = data.SecretString;
                }
                else {
                    let buff = new Buffer(data.SecretBinary, 'base64');
                    secrets = buff.toString('ascii');
                }
                secrets = JSON.parse(secrets);
                resolve(secrets);
            }
        });
    });
};

// secrets should be defined in Secrets Manager as <env>/cld_config
// example: prod/cld_config or stage/cld_config
async function getCldConfig(env) {
    console.log(env+'/cld_config')
    const keys = await getAllSecret(env+'/cld_config');
    return keys
}

module.exports = {
    getCldConfig
}
