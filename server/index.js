const express = require('express')
const cors = require('cors')
const app = express();
const fs = require('fs')
const http = require('http')
const path = require('path')
var multer = require('multer')    //handle files
var moment = require('moment')
const _ = require('underscore')
var bodyParser = require('body-parser')

var ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
var ffmpeg = require('fluent-ffmpeg')
var proc = new ffmpeg()
ffmpeg.setFfmpegPath(ffmpegPath)
const ffprobePath = require('@ffprobe-installer/ffprobe').path
ffmpeg.setFfprobePath(ffprobePath)

app.use(bodyParser.json()) // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })) // support encoded bodies
app.use(cors())
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next()
})
app.use(express.static(path.join(__dirname, 'public')))

let videoPath = '', videoName = '', videoData = [], videoRange = [], videoHeight = '', videoWidth = '', videoAspectRatio = '', croppedVideoUrl = []
let desiredVideoWidth = '', desiredVideoHeight = ''
const port = 3333, url = "127.0.0.1"

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
})

var upload = multer({ storage: storage }).single('file')

function getMostRecentFileName(dir) {
  var files = fs.readdirSync(dir)
  console.log(files)

  // use underscore for max()
  return _.max(files, function (f) {
    var fullpath = path.join(dir, f);
    return fs.statSync(fullpath).ctime    // ctime = creation time is used  replace with mtime for modification time
  })
}

function uploadFile(req, res) {
  return new Promise((resolve, reject) => {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        reject(err)
      } else if (err) {
        reject(err)
      }
      resolve(res)
    })
  })
}

const unlink = path =>
  new Promise((resolve, reject) =>
    fs.unlink(path, err => (err ? reject(err) : resolve()))
  )

function trimVideo(videoSegmentsFolder) {
  let promises = []
  videoRange.map((range, index) => {

    videoData.push({
      url: path.join(url + ":" + port, "temp" + videoName, index + "_part.mp4"),
      startTime: 0,
      endTime: parseFloat(range[1] - range[0]),
      videoHeight: videoHeight,
      videoWidth: videoWidth,
      videoAspectRatio: videoAspectRatio
    })

    console.log(`${index} st: ${range[0]} et: ${range[1]} path: ${path.join(videoSegmentsFolder, index + "_part.mp4")}`)
    let _ = new Promise((resolve, reject) => {
      ffmpeg(videoPath)       //Input Video File
        .output(path.join(videoSegmentsFolder, index + "_part.mp4"))        // Output File
        .audioCodec('libmp3lame')     // Audio Codec
        .videoCodec('libx264')        // Video Codec
        .setStartTime(parseFloat(range[0]))       // Start Position
        .setDuration(parseFloat(range[1] - range[0]))        // Duration
        .on('end', (err) => {
          if (!err) {
            console.log(`Conversion Done for ${range}`)
            resolve(true)
          }
        })
        .on('error', (err) => {
          console.log('error: ', err)
          resolve(false)
        })
        .run()
    })
    promises.push(_)
  })
  return promises
}

async function splitVideo() {
  try {
    const videoSegmentsFolder = path.join(__dirname, 'public', "temp" + videoName)
    if (!fs.existsSync(videoSegmentsFolder)) {
      fs.mkdirSync(videoSegmentsFolder)
      console.log("temporary directory created for storing splitted videos")
    }
    let splittedVideoPaths = await Promise.all(trimVideo(videoSegmentsFolder))
    splittedVideoPaths = splittedVideoPaths.filter(path => path != false)

    return splittedVideoPaths
  } catch (err) {
    throw Error("some error occurred in crop video")
  }
}

const cropScenes = video => {
  const videoPath = path.join(__dirname, "public", video.url.substring(21, video.url.length))    //remove http://127.0.0.1:3333/
  const saveVideoToPath = path.join(__dirname, "public", "editedtemp" + video.url.substring(21, video.url.length))  //saving video after cropping to edited temp

  const saveVideoToPathFolder = path.join(__dirname, "public", "editedtemp" + video.url.substring(21, video.url.lastIndexOf("/")))
  const editedTempFolder = saveVideoToPathFolder.substring(0, saveVideoToPathFolder.lastIndexOf("/"))

  let startTime = moment(video.startTime, 'HH:mm:ss').diff(moment().startOf('day'), 'seconds')    //Start video from this time
  let endTime = moment(video.endTime, 'HH:mm:ss').diff(moment().startOf('day'), 'seconds')  //End video at this time
  let cropCommand = 'crop=' + video.width + ':' + video.height + ':' + video.x + ':' + video.y

  if (!fs.existsSync(editedTempFolder)) {
    fs.mkdirSync(editedTempFolder, 0777)
    if (!fs.existsSync(saveVideoToPathFolder)) {
      fs.mkdirSync(saveVideoToPathFolder, 0777)
    }
  }

  if (((video.x + video.width) > video.videoWidth) || ((video.y + video.height) > video.videoHeight)) {   //pad the video with x,y =0
    console.log("inside padding")
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)       //Input Video File
        .audioCodec("libmp3lame")     // Audio Codec
        .videoCodec("libx264")        // Video Codec
        .setStartTime(startTime)       // Start Position
        .setDuration(endTime - 1)        // Duration
        .size(`'${desiredVideoWidth}x${desiredVideoHeight}'`)     //this command takes the input of desiredwidth and desiredheight in main video aspect ratio
        .videoFilters('pad=' + parseInt(desiredVideoWidth) + ':' + parseInt(desiredVideoHeight) + ':' + parseInt(0) + ':' + parseInt(0) + ':violet')      //pads the video with the color and places it on the given x,y co-ordinate (only works if provided resolution is greatere than main)
        .videoFilters(cropCommand)
        .on('end', (err) => {
          if (!err) {
            console.log(`Scenes Cropped for ${video.url}`)
            resolve(saveVideoToPath)
          }
        })
        .on('error', (err) => {
          console.log('Inside padding video:', err)
          resolve(false)
        })
        .save(saveVideoToPath)
    })
  } else {        //crop the video with the height, width, x, y 
    console.log("inside cropping")
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)       //Input Video File
        .audioCodec("libmp3lame")     // Audio Codec
        .videoCodec("libx264")        // Video Codec
        .setStartTime(startTime)       // Start Position
        .setDuration(endTime - 1)        // Duration
        .size(`'${desiredVideoWidth}x${desiredVideoHeight}'`)     //this command takes the input of desiredwidth and desiredheight in main video aspect ratio
        .videoFilters(cropCommand)      //crops the part of the video by locaing x and y
        .on('end', (err) => {
          if (!err) {
            console.log(`Scenes Cropped for ${video.url}`)
            resolve(saveVideoToPath)
          }
        })
        .on('error', (err) => {
          console.log('Inside cropping video:', err)
          //await unlink(editedTempFolder)
          resolve(false)
        })
        .save(saveVideoToPath)
    })
  }

}

function writeFile(pathTextFile, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(pathTextFile, data, (err) => {
      if (err) return reject('File writing error' + err)
      //console.log("written successfully")
      resolve(true)
    })
  })
}

async function mergeVideoAsync(videoObjects) {
  try {
    let finalVideoPath = path.join(__dirname, "public", "finalVideo" + Math.random().toString(10).slice(2))
    const pathTextFile = path.join(__dirname, "public", "finalVideotxt" + Math.random().toString(10).slice(2) + ".txt")
    let data = 'ffconcat version 1.0\n'

    let croppedVideoPaths = await Promise.all(videoObjects.map(cropScenes))
    if (croppedVideoPaths === undefined || croppedVideoPaths === "") {
      throw new Error('Error in cropping')
    }
    croppedVideoPaths.filter(path => path != false)

    console.log(croppedVideoPaths)

    croppedVideoPaths.forEach(path => {
      data += `file '${path}'\n`
    })

    const written = await writeFile(pathTextFile, data)
    if (written === undefined || written.toString().indexOf('error') > 0) {
      throw new Error('Error in writing paths to file')
    }
    return await new Promise((resolve, reject) =>
      ffmpeg(pathTextFile)
        .on('error', function (err) {
          console.log('An error occurred in merging: ' + err.message)
          resolve(false)
        })
        .on('end', function () {
          console.log('Merging finished !')
          resolve(finalVideoPath + ".mp4")
        })
        .inputOptions(
          '-f', 'concat',
          '-safe', '0'
        )
        .outputOptions('-c copy')
        .save(finalVideoPath + ".mp4")
    )
    //croppedVideoPaths.map(unlink)
  } catch (err) {
    console.log("error in mergevideo async", err)
    throw new Error('some error occurred in cropping video scenes')
  }
}

app.get('/download', (req, res) => {
  var URL = req.query['URL']
  var index = URL.lastIndexOf("/")
  var extensionIndex = URL.lastIndexOf(".")
  const extensionName = URL.substring(extensionIndex, URL.length)
  videoName = URL.substring(index, extensionIndex).replace(/[^a-zA-Z]/g, '')
  const videoNameWithExtension = videoName + extensionName

  const folderPath = path.join(__dirname, 'public', videoName)
  if (!fs.existsSync(folderPath)) {
    console.log("directory created for main video")
    fs.mkdirSync(folderPath, 0744)
  }
  const file = fs.createWriteStream(path.join(__dirname, 'public', videoName, videoNameWithExtension))
  const request = http.get(URL, response => {
    response.pipe(file)

    file.on('finish', result => {
      file.close()
      videoPath = file.path
      return res.json({ url: file.path })
    })

    file.on('error', error => {
      console.log("error occured is", error)
      return res.status(400).send({
        error: error
      })

    })
  })
  /*res.header('Content-Disposition', 'attachment; filename="video.mp4"');
  ytdl(URL, {
      format: 'mp4'
  }).pipe(res);*/
})

app.get('/downloadVideo', async (req, res) => {
  const actualFilePath = req.query['actualFilePath']
  const videoPath = req.query['url']
  const index = actualFilePath.lastIndexOf('/')
  const fileName = actualFilePath.substr(index, actualFilePath.length)  
    const dest = path.join(__dirname, "temp")
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest)
      console.log("temporary directory created for storing the final video to different location")
    }
    
    console.log("fileName", fileName, "new path", path.join(dest, fileName))

    const copy = await new Promise((resolve, reject) => {
      fs.copyFile(actualFilePath, path.join(dest, fileName), (err) => {
        if (err){
          resolve(false)
          throw err
        } 
        resolve(true)
      })
    })

    res.setHeader('Content-type', 'video/mp4')
    res.setHeader('Content-disposition', 'attachment; filename=' + fileName)
    res.download(path.join(dest, fileName))
})

app.post('/mergeVideos', (req, res) => {
  videoData = []
  desiredVideoWidth = req.query['desiredVideoWidth']
  desiredVideoHeight = req.query['desiredVideoHeight']
  const videoObjects = req.body.videoObjects
  console.log(videoObjects)
  if (videoObjects === undefined || req.body.videoObjects === undefined || videoObjects.length === 0) {
    return res.status(400).send({ error: "Please check some video" })
  }

  mergeVideoAsync(videoObjects).then((resultPath) => {
    const index = resultPath.lastIndexOf('/')
    const finalVideoPath = path.join(url + ":" + port, resultPath.substring(index, resultPath.length))
    //console.log("final merged video path is ", resultPath, "and required path is", finalVideoPath)
    res.status(200)
    res.send({
      videoPath: finalVideoPath,
      actualFilePath : resultPath
    })
  })
    .catch(err => res.status(400).send({ error: err }))
})

app.get('/upload', (req, res) => {
  videoData = []
  videoPath = req.query['videoPath']
  const segmentSetting = req.query['segmentSetting'].toLowerCase()
  let segmentValue = req.query['segmentValue'], videoDuration = '', endValue = req.query['segmentValue']

  var URL = req.query['videoPath']
  var index = URL.lastIndexOf("/")
  var extensionIndex = URL.lastIndexOf(".")
  const extensionName = URL.substring(extensionIndex, URL.length)
  videoName = URL.substring(index, extensionIndex).replace(/[^a-zA-Z]/g, '')
  const videoNameWithExtension = videoName + extensionName

  ffmpeg.ffprobe(videoPath, function (err, metadata) {
    if (err) return res.status(400).send({
      error: "Some error occurred while reading metadata of video"
    })
    //console.dir(metadata) // all metadata
    videoDuration = metadata.format.duration
    videoHeight = metadata.streams[0].height
    videoWidth = metadata.streams[0].width
    videoAspectRatio = metadata.streams[0].display_aspect_ratio
    let range = 0, eachSegmentDuration = 0

    console.log("segment value: ", segmentValue, " segment setting:", segmentSetting, " duration:", videoDuration, videoWidth, videoHeight, videoAspectRatio)
    if (segmentSetting === "interval duration") {
      //console.log("interval")
      videoRange = []
      segmentValue = parseFloat(segmentValue)
      endValue = parseFloat(endValue)
      if (segmentValue > videoDuration)
        return res.status(400).send({
          error: "Duration cannot be greater than video duration"
        })

      while (parseFloat(endValue) < parseFloat(videoDuration)) {
        videoRange.push([range, endValue])
        range = range + segmentValue//50
        endValue = range + segmentValue//100
      }
      if (range < videoDuration) videoRange.push([range, videoDuration])

      console.log(videoRange)
      //console.log(videoRange[0][0],videoRange[0][1],videoRange[1][0],videoRange[1][1])
      splitVideo().then((splittingResult) => {
        console.log("result of splitting is ", splittingResult)
        res.status(200)
        res.send({
          splittedVideosData: videoData
        })
      })
        .catch(err => res.status(400).send({ error: err }))

    } else if (segmentSetting === "range duration") {
      console.log("range")
      videoRange = []
      videoRange = JSON.parse(segmentValue)

      console.log(videoRange)

      for (let i = 0; i < videoRange.length; i++) {
        if (videoRange[i][1] > videoDuration)
          return res.status(400).send({
            error: "Second parameter of range cannot be greater than video duration"
          })
      }

      splitVideo().then((splittingResult) => {
        console.log("result of splitting is ", splittingResult)
        res.status(200)
        res.send({
          splittedVideosData: videoData
        })
      })
        .catch(err => res.status(400).send({ error: err }))

      //return res.status(200).send(req.file)
    } else if (segmentSetting === "number of segments") {
      console.log("inside number of segments")
      let range = 0, eachSegmentDuration = 0
      videoRange = []
      segmentValue = parseFloat(segmentValue)
      eachSegmentDuration = parseFloat(videoDuration / parseInt(segmentValue))
      endValue = eachSegmentDuration
      //console.log("eachSegmentDuration",eachSegmentDuration, "endValue",endValue, "videoname",videoName, "videoNameWithExtension", videoNameWithExtension)
      if (segmentValue > videoDuration) {
        return res.status(400).send({
          error: "Segment value cannot be greater than video duration"
        })

      }
      while (endValue <= videoDuration) {
        videoRange.push([range.toFixed(4), endValue.toFixed(4)])
        range = range + eachSegmentDuration
        endValue = range + eachSegmentDuration
      }
      //console.log(videoRange)

      splitVideo().then((splittingResult) => {
        console.log("result of splitting is ", splittingResult)
        res.status(200)
        res.send({
          splittedVideosData: videoData
        })
      })
        .catch(err => res.status(400).send({ error: err }))

    }
  })
})

app.listen(port, () => {
  console.log('Server Works !!! At port 3333');
});