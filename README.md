## vDemonstrator for GSA based vSpeech
This project demonstrates the speech recognition service based on a video livestream.

## Requirements
- node.js
- ffmpeg
- ffserver

## Installation
Change directory where the project files are located.
### Development
```
npm install
```
### Production
```
docker build -t vmonitor .
```
## Usage
Run the following command to start the service.
### Development
```
node ./bin/www
```
### Production
```
docker run --name vmonitor -p 9000:9000 -d vmonitor
```

## API
The following api endpoints are available:
```
GET /api                        Finds all data
```
```
GET /api/transcription          Finds transcription
```
```
POST /api/transcription/start   Starts transcription
```
```
POST /api/transcription/stop    Stops transcription
```
```
GET /api/transcription/state    Finds state of transcription
```
```
GET /api/words                  Finds words
```
```
GET /api/statistics             Finds statistics
```
```
GET /api/configuration          Finds configuration
```
```
POST /api/configuration         Updates configuration
```
#### Parameters
| Name          | Type          | Description  |
| ------------- |:-------------:| -----|
| `url`         | `string`      | URL of the RTP/RTMP/RTSP video live stream |
| `language`    | `string`      | language of the video live stream (default: *en-US*) |
| `validity`    | `number`      | duration in ms how long the credentials will be valid (default: *60000*) |
| `credentials` | `object`      | google application credentials |

#### Example
```json
{
  "url": "rtmp://localhost/live/teststream",
  "language": "en-US",
  "validity": 60000
}
```

## Additional Parameters
`-e PORT` - port on which the web service is running
`-e SPEECH_PORT` - port on which the speech-to-text service is running video live stream
`-e SPEECH_HOST` - host or ip of the speech-to-text service
