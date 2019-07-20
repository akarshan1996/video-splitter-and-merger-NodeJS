var ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
var ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
var command = ffmpeg();
//var probe = require('node-ffprobe');

const videoPath = __dirname + '/Raabta.mp4'
console.log(videoPath)

//Cropping Video:
ffmpeg(videoPath) //Input Video File
    .output('temp_video/cropped_video.mp4') // Output File
    .audioCodec('libmp3lame') // Audio Codec
    .videoCodec('libx264')  // Video Codec
    .setStartTime(03) // Start Position
    .setDuration(15) // Duration
    .on('end', function (err) {
        if (!err) {
            console.log("Conversion Done");
            //res.send('Video Cropping Done');
        }
    })
    .on('error', function (err) {
        console.log('error: ', +err);
    }).run();


/*var timemark = null;
function onProgress(progress) {
    if (progress.timemark != timemark) {
        timemark = progress.timemark;
        console.log('Time mark: ' + timemark + "...");
    }
}*/




//Mute Video : To disable audio you can use noAudio( ) method.
/*ffmpeg(videoPath)
    .output('temp_video/output.mp4') // Output File
    .noAudio().videoCodec('copy')
    .on('end', function (err) {
        if (!err) console.log("on end, Conversion Done");
    })
    .on('error', function (err) {
        console.log('error: ', +err);
    }).run();


//Remove Video & save Only audio :
ffmpeg(videoPath)  // Input Video File
    .output('temp_video/output.mp4') // Output  File
    .on('end', function (err) {
        if (!err) console.log("Remove video is done");
    })
    .on('error', function (err) {
        console.log('error: ' + err);
    }).run();


//Showing Video Metadata:
ffmpeg.ffprobe('public/raw/test.mp4', function (err, metadata) { // Input video File
    if (err) console.log("MetaData not Found. " + err);
    else console.log(metadata)
})


//Genarate Thumbnail:
probe('public/raw/test.mp4', function (err, probeData) {
    var proc = new ffmpeg('public/raw/test.mp4'); // Input File

    proc.screenshots({
        timestamps: ['50%', '80%'],
        folder: 'public/edited/thumbnail/output', // Thumbnail Location
        size: '392x220'
    }).on('end', function () {
        console.log('Screenshots taken');
    });
});
*/