const fs = require("fs");
 
const files = fs.readdirSync(".").filter(i => fs.lstatSync(i).isFile())
 
const YOUR_PATTERN_MATCH = true
function readFiles(files = null) {
    let promises = []
    for (let file of files) {
        let _ = new Promise((resolve, reject) => {
            fs.readFile(file, 'utf-8', (err, data) => {
                if (err) return resolve(-1)
                if (YOUR_PATTERN_MATCH)
                    return resolve(data)
                else return resolve(-1)
            })
        })
        promises.push(_)
    }
    return promises
}
 
async function checker() {
    let resolutions = await Promise.all(readFiles(files))
    for (let i = 0; i <= resolutions.length; i++) {
        if (resolutions[i] === -1) {
            console.log("Not found for ", files[i])
        }
        else {
            console.log("Found for ", files[i])
        }
    }
}
 
checker()