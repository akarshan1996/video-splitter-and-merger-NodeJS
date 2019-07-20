// Source: http://pixelscommander.com/en/javascript/javascript-file-download-ignore-content-type/
//https://www.youtube.com/watch?v=lTTajzrSkCw
import React, { Component } from 'react';
//import SliderControlled from './ReactSlider'
//import { RdxVideo, Overlay, Controls } from 'react-html5-video-editor'
import { Form, Col, Button } from 'react-bootstrap'
import { toast } from 'react-toastify'
import CheckBox from './Checkbox'
import moment from 'moment'
import { Rnd } from "react-rnd";
import 'react-toastify/dist/ReactToastify.css'
import './App.css'
//import { stringify } from 'querystring';

/*const videoDataExample = [
  { url: "http:/127.0.0.1:3333/tempBapuZimidarJassiGillReplayReturnOfMelodyLatestPunjabiSongs/0_part.mp4", startTime: 0, endTime: 100, videoHeight: "", videoWidth: "", videoAspectRatio: '' },
  { url: "http:/127.0.0.1:3333/tempBapuZimidarJassiGillReplayReturnOfMelodyLatestPunjabiSongs/1_part.mp4", startTime: 100, endTime: 100, videoHeight: "", videoWidth: "", videoAspectRatio: '' },
  { url: "http:/127.0.0.1:3333/tempBapuZimidarJassiGillReplayReturnOfMelodyLatestPunjabiSongs/2_part.mp4", startTime: 200, endTime: 27.461667000000006, videoHeight: "", videoWidth: "", videoAspectRatio: '' }
]*/

const style = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "solid 2px #ddd",
  background: 'rgba(171, 205, 239, 0)'
}

toast.configure({
  autoClose: 2000,
  draggable: false,
})

class App extends Component {
  constructor() {
    super()
    this.state = {
      videoData: '',
      url: '',
      mainVideoPath: '',
      segmentSetting: '',
      segmentValue: '',
      desiredVideoWidth: '',
      desiredVideoHeight: ''
    }
  }

  timeOut = () => setTimeout(() => {
    const url = '//assets.codepen.io/images/codepen-logo.svg';
    this.downloadFile(url)
  }, 2000)

  downloadFile = (sUrl) => {
    var link = document.createElement('a');
    link.href = sUrl;
    link.setAttribute('target', '_blank');
    var fileName = sUrl.substring(sUrl.lastIndexOf('/') + 1, sUrl.length);
    link.download = fileName;
    if (document.createEvent) {
      var e = document.createEvent('MouseEvents');
      e.initEvent('click', true, true);
      link.dispatchEvent(e);
      return true;
    }
    if (sUrl.indexOf('?') === -1) sUrl += '?download'

    window.open(sUrl, '_blank');
    return true;
  }

  setValue(e) {
    this.setState({
      [e.target.name]: e.target.value
    })
  }

  setStartTimeEndTime(e, id) {
    const name = e.target.name
    const value = e.target.value
    this.setState(prevState => ({
      videoData: prevState.videoData.map(videoInfo => videoInfo.id === id ? { ...videoInfo, [name]: value } : videoInfo)
    }))
  }

  sendURL = () => {
    toast.info("Please wait till the video downloads !", { position: toast.POSITION.TOP_CENTER })

    fetch(`http://localhost:3333/download?URL=${this.state.url}`, { method: 'GET' })
      //fetch(`http://localhost:3333/getUrl`, { method: 'GET' })
      .then(res => res.json()).then(result => {

        this.setState({
          //splittedVideoUrls: result.splittedVideoUrls,
          url: '',
          fileUploaded: true,
          mainVideoPath: result.url
        })
      })
      .catch(err => {
        alert(err)
        this.setState({
          fileUploaded: false,
          mainVideoPath: ''
        })
      })
    //window.location.href = `http://localhost:3333/download?URL=${this.refs.url.value}`
  }

  prepareVideoArray = (splittedVideosData) => {
    let videoDataArray = []
    for (let i = 0; i < splittedVideosData.length; i++) {
      let videoObject = {}
      videoObject['id'] = i
      videoObject['url'] = "http://" + splittedVideosData[i]['url']
      videoObject['isChecked'] = false
      videoObject['value'] = i
      videoObject['x'] = 0
      videoObject['y'] = 0
      videoObject['width'] = this.state.desiredVideoWidth
      videoObject['height'] = this.state.desiredVideoHeight
      videoObject['videoWidth'] = splittedVideosData[i]['videoWidth']
      videoObject['videoHeight'] = splittedVideosData[i]['videoHeight']
      videoObject['videoAspectRatio'] = splittedVideosData[i]['videoAspectRatio']
      /*videoObject['startTime'] = moment("1900-01-01 00:00:00").add(splittedVideosData[i]['startTime'], 'seconds').format("HH:mm:ss")
      videoObject['endTime'] = moment("1900-01-01 00:00:00").add(splittedVideosData[i]['endTime'], 'seconds').format("HH:mm:ss")*/
      videoObject['startTime'] = moment("1900-01-01 00:00:00").add(splittedVideosData[i]['startTime'], 'seconds').format("HH:mm:ss")
      videoObject['endTime'] = moment("1900-01-01 00:00:00").add(splittedVideosData[i]['endTime'], 'seconds').format("HH:mm:ss")
      videoDataArray.push(videoObject)
    }
    return videoDataArray
  }

  onSubmit = (e) => {
    e.preventDefault()
    toast.info("Please wait till other popup appears !", { position: toast.POSITION.TOP_CENTER })

    fetch("http://127.0.0.1:3333/upload?segmentSetting=" + this.state.segmentSetting + "&segmentValue=" + this.state.segmentValue + "&videoPath="
      + this.state.mainVideoPath + "&desiredVideoWidth=" + this.state.desiredVideoWidth + "&desiredVideoHeight=" + this.state.desiredVideoHeight
      , { method: 'GET' })
      .then(response => response.json())
      .then(result => {
        if (result.error) {
          throw new Error(result.error)
        }

        toast.info("Videos are splitted successfully", { position: toast.POSITION.TOP_CENTER })
        this.setState({
          url: '',
          fileUploaded: false,
          segmentSetting: '',
          segmentValue: '',
          loaded: 0
        }, () => {
          const videoDataArray = this.prepareVideoArray(result.splittedVideosData)
          this.setState({
            videoData: videoDataArray
          })
        })

      }).catch(error => {
        toast.info(error, { position: toast.POSITION.TOP_CENTER })
        this.setState({
          url: '',
          selectedFile: null,
          segmentSetting: '',
          segmentValue: '',
          loaded: 0,
          desiredVideoWidth: '',
          desiredVideoHeight: ''
        })
      })

  }

  onMergeVideos = (e) => {
    e.preventDefault()
    let videoDataToBePosted = this.state.videoData.filter(videoObject => videoObject.isChecked === true)

    toast.info("Please wait while merging happens :)", { position: toast.POSITION.TOP_CENTER })

    fetch("http://127.0.0.1:3333/mergeVideos?&desiredVideoWidth=" + this.state.desiredVideoWidth + "&desiredVideoHeight=" + this.state.desiredVideoHeight
      , {
        method: 'POST',
        mode: 'cors',
        headers: new Headers({
          'Request-Method': 'POST',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }), body: JSON.stringify({
          videoObjects: videoDataToBePosted
        }),
      })
      .then(response => response.json())
      .then(result => {
        if (result.error) {
          throw new Error("Some error occured")
        }
        toast.info("Videos are merged successfully", { position: toast.POSITION.TOP_CENTER })
        this.setState({
          finalVideo: result.videoPath
        })

      }).catch(error => {
        toast.info(error, { position: toast.POSITION.TOP_CENTER })
        this.setState({
          url: '',
          selectedFile: null,
          segmentSetting: '',
          segmentValue: '',
          loaded: 0,
          desiredVideoWidth: '',
          desiredVideoHeight: ''
        })
      })

  }

  handleAllChecked = (event) => {
    let videosInfo = this.state.videoData
    videosInfo.forEach(videoInfo => videoInfo.isChecked = event.target.checked)
    this.setState({ videoData: videosInfo })
  }

  handleCheckChildElement = (event) => {
    let videosInfo = this.state.videoData
    videosInfo.forEach((videoInfo) => {

      console.log(event, "videoInfo.id", videoInfo.id, "event.target.value", event.target.value)

      if (videoInfo.id === event.target.value)
        videoInfo.isChecked = event.target.checked
    })
    this.setState({ videoData: videosInfo })
    /*let videosInfo = this.state.videoData
    this.setState({ videoData: this.state.videoData.map(v => {return  (v.id === event.target.value) ? {...v, isChecked : event.target.checked} : v}) })*/
  }

  onDragStop = (videoDataId, event, delta) => {
    let videoData = this.state.videoData.splice()
    let requiredVideoObject = videoData.filter(videoInfo => videoInfo.id === videoDataId)
    requiredVideoObject.x = delta.x
    requiredVideoObject.y = delta.y
    this.setState(prevState => ({
      videoData: prevState.videoData.map(videoInfo => videoInfo.id === videoDataId ? { ...videoInfo, x: delta.x, y: delta.y } : videoInfo)
    }))
    //this.setState({ x: delta.x, y: delta.y }) }
  }

  onResizeStop = (videoDataId, event, resizeDirection, refToElement, resizableDelta, position) => {
    let videoData = this.state.videoData.splice()
    let requiredVideoObject = videoData.filter(videoInfo => videoInfo.id === videoDataId)
    requiredVideoObject.width = refToElement.offsetWidth
    requiredVideoObject.height = refToElement.offsetHeight
    this.setState(prevState => ({
      videoData: prevState.videoData.map(videoInfo =>
        videoInfo.id === videoDataId ? { ...videoInfo, ...position, width: refToElement.offsetWidth, height: refToElement.offsetHeight } : videoInfo
      )
    }))
    /*this.setState({
      width: refToElement.offsetWidth,
      height: refToElement.offsetHeight,
      ...position,    //this contains x and y
    })*/
  }

  render() {
    console.log(this.state.videoData)
    const { videoData } = this.state

    return (
      <div className="text-center" >
        <h1 className="heading">Video Engine !</h1>
        {/* <SliderControlled /> */}
        <div className="container card shadow" align="center" style={{ textAlign: 'center', padding: '10px', width: '600px' }}>
          {/* <a href={`http://localhost:3333/download?URL=${this.state.url}`} download="video.mp4">CLick here to download the video</a> */}

          <Form.Row>
            <Form.Group as={Col} controlId="enterUrl">
              <Form.Control className="URL-input" type="text" name="url" onChange={(e) => this.setValue(e)} placeholder="Ex.https://localhost:8000/video.mp4" style={{ width: '400px' }} />
            </Form.Group>
            <Form.Group as={Col} controlId="convert" >
              <Button className="convert-button" style={{ width: '100px' }} onClick={() => this.sendURL()}>Convert</Button>
            </Form.Group>
          </Form.Row>

          {
            this.state.fileUploaded &&
            <Form onSubmit={(e) => this.onSubmit(e)} >
              <Form.Group as={Col} className="color-primary" controlId="chooseSegmentSettings">
                <Form.Label className="color-primary">Choose Segment Settings</Form.Label>
                <Form.Control as="select" name="segmentSetting" onChange={(e) => this.setValue(e)} required>
                  <option >Choose...</option>
                  <option >Interval Duration</option>
                  <option>Range Duration</option>
                  <option>Number of segments</option>
                </Form.Control>
              </Form.Group>

              <Form.Label>Enter Value for Segment</Form.Label>
              <Form.Row>
                <Form.Group as={Col} controlId='segmentValue'>
                  <Form.Label>Segment Value</Form.Label>
                  <Form.Control type='text' name="segmentValue" onChange={(e) => this.setValue(e)} required />
                </Form.Group>
              </Form.Row>

              <Form.Label>Enter Required Video Resolution</Form.Label>
              <Form.Row>
                <Form.Group as={Col} controlId='enterWidth'>
                  <Form.Label>Video Width</Form.Label>
                  <Form.Control type='number' name="desiredVideoWidth" onChange={(e) => this.setValue(e)} required />
                </Form.Group>

                <Form.Group as={Col} controlId='enterHeight'>
                  <Form.Label>Video Height</Form.Label>
                  <Form.Control type='number' name="desiredVideoHeight" onChange={(e) => this.setValue(e)} required />
                </Form.Group>
              </Form.Row>

              <br />
              <Button variant="primary" type="submit">Upload</Button>
            </Form>
          }

          {/* <input style={{ display: 'none' }} id="file" type="file" onChange={(eventKey, event) => this.onFileChange(eventKey, event)} />
              <Form.Group as={Col}>
                <Form.Label className="btn btn-primary" style={{ width: '180px' }} htmlFor="file"> Choose File </Form.Label>
              </Form.Group>
            </Form.Row> */}
        </div>

        <div id="videoDiv" style={{ marginTop: '50px' }}>
          <Form onSubmit={(e) => this.onMergeVideos(e)} >
            {
              videoData.length > 0 &&
              <div>
                <div className="row">
                  <div className="col-8 text-center"><h6>Check and Uncheck All</h6></div>
                  <div className="col-4"><input type="checkbox" value="checkUncheckAll" onChange={this.handleAllChecked} /></div>
                </div>
                <ul style={{ listStyle: 'none' }}>
                  {
                    videoData.map((videoObject, index) => {
                      return (
                        <div key={videoObject.id} style={{ display: 'flex', flexDirection: 'column', height: videoObject.height, width:videoObject.width }}>

                          <div style={{ height: videoObject.videoHeight, width: videoObject.videoWidth }}>
                            <video width={videoObject.videoWidth} height={videoObject.videoHeight} controls>
                              <source src={videoObject.url} type="video/mp4" />Your browser does not support the video tag.
                            </video>

                            <Rnd
                              key={videoObject.id}
                              ref={rnd => { this.rnd = rnd }}
                              style={style}
                              size={{ width: videoData[videoObject.id].width, height: videoData[videoObject.id].height }}
                              position={{ x: videoData[videoObject.id].x, y: videoData[videoObject.id].y }}
                              onDragStop={(event, delta) => this.onDragStop(videoObject.id, event, delta)}
                              // type DraggableData = {
                              //   node: HTMLElement,
                              //   x: number,
                              //   y: number,
                              //   deltaX: number, deltaY: number,
                              //   lastX: number, lastY: number
                              // }
                              onResizeStop={(event, resizeDirection, refToElement, resizableDelta, position) => { this.onResizeStop(videoObject.id, event, resizeDirection, refToElement, resizableDelta, position) }}
                              // minWidth={this.state.desiredVideoWidth}
                              // minHeight={this.state.desiredVideoHeight}
                              lockAspectRatio={true}
                              // enableResizing={false}
                              // disableDragging={false}
                              bounds="parent"
                            />
                          </div>

                          <div key={videoObject.id}>

                            <Form.Row key={videoObject.id}>
                              <Form.Group as={Col} controlId="startTime">
                                {/* {this.state.videoObject[videoData.id].isChecked? `required` : ''}  */}
                                <Form.Control className="startTime-input pull-left" type="text" name="startTime" onChange={(e) => this.setStartTimeEndTime(e, videoObject.id)} value={videoData[videoObject.id].startTime} style={{ width: '100px' }} />
                              </Form.Group>
                              <Form.Group as={Col} controlId="endTime">
                                <Form.Control className="endTime-input pull-right" type="text" name="endTime" onChange={(e) => this.setStartTimeEndTime(e, videoObject.id)} value={videoData[videoObject.id].endTime} style={{ width: '100px' }} />
                              </Form.Group>
                            </Form.Row>

                            <div key={videoObject.id}>
                              <span><CheckBox handleCheckChildElement={this.handleCheckChildElement}   {...videoObject} /></span>
                            </div>
                          </div>

                        </div>
                      )
                    })
                  }
                </ul>
                <Button variant="primary" type="submit">Merge Videos</Button>
              </div>
            }
          </Form>
        </div>

      </div>
    )
  }
}

export default App