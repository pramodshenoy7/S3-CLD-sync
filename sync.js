const AWS = require('aws-sdk')
const cloudinary = require('cloudinary').v2;
var get_CLD_Config = require('./getCldConfig.js')

const IMAGE_FORMATS = [ "pdf", "gif", "png", "jpg", "bmp", "ico", "tiff", "eps", "jpc", "jp2", "psd", "webp", "svg", "wdp", "hpx", "djvu", "ai", "flif", "bpg", "miff", "tga", "cr2", "arw", "dng", "heic", "gltz", "gltf", "fbxz", "indd", "idml", "psb", "glb", "avif", "jxl", "usdz" ]; 
const AUDIO_FORMATS = [ "mp3", "aac", "ogg", "m4a", "wav", "aiff", "flac", "amr", "midi" ]; 
const VIDEO_FORMATS = [ "avi", "mp4", "webm", "mov", "ogv", "3gp", "3g2", "wmv", "mpeg", "flv", "m3u8", "ts", "mkv", "mpd", "clt", "mxf" ];
const VIDEO_RESOURCE_TYPE_FORMATS = VIDEO_FORMATS.concat(AUDIO_FORMATS);
const FORMAT_ALIASES = { jpeg: "jpg", jpe: "jpg", tif: "tiff", ps: "eps", ept: "eps", eps3: "eps", j2k: "jpc", jxr: "wdp", hdp: "wdp", m4v: "mp4", h264: "mp4", asf: "wmv", m2v: "mpeg", m2t: "ts", m2ts: "ts", aif: "aiff", aifc: "aiff", mka: "webm", webmda: "webm", webmdv: "webm", mp4dv: "mp4", mp4da: "mp4", opus: "ogg", bmp2: "bmp", bmp3: "bmp", "mpg/3": "mp3", heif: "heic", mid: "midi" }

exports.handler = async (event, context, callback) => {
    // store S3 event related variables
    var S3_EVENT_TYPE = event.Records[0].eventName;
    var S3_BUCKET_NAME = event.Records[0].s3.bucket.name;
    var S3_KEY = event.Records[0].s3.object.key;
    var S3_URL = 's3://'+S3_BUCKET_NAME+'/'+S3_KEY;
    console.log(S3_URL)
    
    // get secrets from secrets manager - stage vs dev vs prod
    var secrets = await get_CLD_Config.getCldConfig(process.env.STAGE);
    // set Cloudinary config
    cloudinary.config({ 
        cloud_name: secrets.cloud_name, 
        api_key: secrets.cld_key, 
        api_secret: secrets.cld_secret,
        secure: true
    });
    var CLD_FOLDER = process.env.CLD_FOLDER;
    var CLD_PRESET = process.env.CLD_PRESET;
    // replace S3 prefix 
    var CLD_PUB_ID= S3_KEY.replace('cld_folder/', '');
    // remove extension
    // improve this to check for resource type and preserve extension for raw files
    CLD_PUB_ID = CLD_PUB_ID.substring(0, CLD_PUB_ID.lastIndexOf('.'))

    if(S3_EVENT_TYPE.includes('ObjectCreated')){
        // for asset upload to S3
        try{
            var response = await cloudinary.uploader.upload(S3_URL, {public_id: CLD_FOLDER+'/'+CLD_PUB_ID, resource_type: "auto", upload_preset: CLD_PRESET});
            console.log("upload succeeded")
            console.log(response)
        }catch(e){
            console.log("upload to CLD failed")
            console.log(e)
        }
    } else
    if(S3_EVENT_TYPE.includes('ObjectRemoved')){
        // for asset deleted from S3
        var CLD_RES_TYPE = resourceTypeFromPath(S3_KEY);
        console.log(CLD_RES_TYPE)
        try{
            var response = await cloudinary.uploader.destroy(CLD_FOLDER+'/'+CLD_PUB_ID, {resource_type: CLD_RES_TYPE, invalidate:true})
            console.log("delete succeeded")
            console.log(response)
        }catch(e){
            console.log("CLD asset deletion failure")
            console.log(e)
        }
    } 
}

// determine resourceType - image vs video vs raw from path
function resourceTypeFromPath(path) {
    let dotIndex = path.lastIndexOf('.');
    if (dotIndex < 0 || dotIndex === path.length - 1) { 
        return null
    }
    let format = normalizeFileFormat(path.substr(dotIndex + 1));
    console.log("NF: "+format)
    if (VIDEO_RESOURCE_TYPE_FORMATS.includes(format)) {
        return "video";
    } else if (IMAGE_FORMATS.includes(format)) {
        return "image"
    } else {
        return "raw"
    }
}

function normalizeFileFormat(format) {
    format = format.toLowerCase();
    if (format == "") {
      return null;
    }
    return FORMAT_ALIASES[format] || format;
}