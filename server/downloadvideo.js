'use strict'
const Fs = require('fs')
const Path = require('path')
const Listr = require('listr')
const Axios = require('axios')

function one(tasks) {
    tasks.run()
        .then(process.exit)
        .catch(process.exit)
}

if (process.argv) {
    const tasks = [
        {
            title: 'Downloading',
            task: async (ctx, task) => {
                const url = 'https://s3.xxx.amazon.com/bucketname/folder/video_example.mp4'
                //const url = 'https://www.youtube.com/watch?v=ba7mB8oueCY'
                const path = Path.resolve(__dirname, 'temp_video', 'video.mp4')
                const response = await Axios({
                    method: 'GET',
                    url: url,
                    responseType: 'stream'
                })

                response.data.pipe(Fs.createWriteStream(path))

                return new Promise((resolve, reject) => {
                    response.data.on('end', () => {
                        resolve()
                    })

                    response.data.on('error', err => {
                        reject(err)
                    })
                })
            }
        }
    ]

    one(new Listr(tasks))
}